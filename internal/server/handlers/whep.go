package handlers

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/glimesh/broadcast-box/internal/server/helpers"
	"github.com/glimesh/broadcast-box/internal/server/webhook"
	"github.com/glimesh/broadcast-box/internal/webrtc"
	"github.com/glimesh/broadcast-box/internal/webrtc/utils"
)

const whepRoute = "/api/whep"

func whepHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !helpers.RequireMethod(responseWriter, request, http.MethodPost, http.MethodPatch) {
		return
	}

	offer, err := io.ReadAll(request.Body)
	if err != nil || len(offer) == 0 {
		helpers.LogHTTPError(responseWriter, "error reading offer", http.StatusBadRequest)
		return
	}

	if request.Method == http.MethodPatch {
		whepPatchHandler(responseWriter, request, string(offer))
		return
	}

	token := helpers.ResolveBearerToken(request.Header.Get("Authorization"))
	if token == "" {
		helpers.LogHTTPError(responseWriter, "Authorization was invalid", http.StatusUnauthorized)
		return
	}

	if webhookURL := os.Getenv(environment.WebhookURL); webhookURL != "" {
		token, err = webhook.CallWebhook(webhookURL, webhook.WHEPConnect, token, request)
		if err != nil {
			responseWriter.WriteHeader(http.StatusUnauthorized)
			return
		}
	}

	whepAnswer, sessionID, err := webrtc.WHEP(string(offer), token)
	if err != nil {
		slog.Error("API.WHEP: Setup Error", "err", err)
		helpers.LogHTTPError(responseWriter, err.Error(), http.StatusBadRequest)
		return
	}

	responseWriter.Header().Add("Link", `</api/sse/`+sessionID+`>; rel="urn:ietf:params:whep:ext:core:server-sent-events"; events="layers"`)
	responseWriter.Header().Add("Link", `</api/layer/`+sessionID+`>; rel="urn:ietf:params:whep:ext:core:layer"`)
	responseWriter.Header().Set("Location", whepRoute+"/"+sessionID)
	responseWriter.Header().Set("Content-Type", "application/sdp")
	responseWriter.WriteHeader(http.StatusCreated)

	if _, err = fmt.Fprint(responseWriter, whepAnswer); err != nil {
		slog.Error("API.WHEP Error", "err", err)
	} else {
		slog.Info("API.WHEP Completed")
	}
}

func whepPatchHandler(responseWriter http.ResponseWriter, request *http.Request, candidates string) {
	if err := utils.ValidateOffer(candidates); err != nil {
		helpers.LogHTTPError(responseWriter, "invalid offer: "+err.Error(), http.StatusBadRequest)
		return
	}

	sessionID := helpers.SessionIDFromPath(request.URL.Path, whepRoute)
	if sessionID == "" {
		helpers.LogHTTPError(responseWriter, "Missing session id", http.StatusBadRequest)
		return
	}

	if !helpers.IsTrickleICERequest(request) {
		helpers.LogHTTPError(responseWriter, "invalid content type", http.StatusUnsupportedMediaType)
		return
	}

	slog.Info("API.WHEP.Patch: Patching session", "sessionID", sessionID)
	if err := webrtc.HandleWHEPPatch(sessionID, candidates); err != nil {
		slog.Error("API.WHEP.Patch Error", "err", err)
		helpers.LogHTTPError(responseWriter, err.Error(), http.StatusBadRequest)
		return
	}

	responseWriter.WriteHeader(http.StatusNoContent)
}

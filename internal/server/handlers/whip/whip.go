package whip

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strconv"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/glimesh/broadcast-box/internal/server/authorization"
	"github.com/glimesh/broadcast-box/internal/server/helpers"
	"github.com/glimesh/broadcast-box/internal/server/webhook"
	"github.com/glimesh/broadcast-box/internal/webrtc"
)

const whipRoute = "/api/whip"

func WHIPHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !helpers.RequireMethod(responseWriter, request, http.MethodPost, http.MethodPatch, http.MethodDelete) {
		return
	}

	authHeader := request.Header.Get("Authorization")
	if authHeader == "" {
		helpers.LogHTTPError(responseWriter, "Authorization was not set", http.StatusBadRequest)
		return
	}

	token := helpers.ResolveBearerToken(authHeader)
	if token == "" {
		helpers.LogHTTPError(responseWriter, "Authorization was invalid", http.StatusUnauthorized)
		return
	}

	if request.Method == http.MethodDelete {
		deleteHandler(responseWriter, request)
		return
	}

	offer, err := io.ReadAll(request.Body)
	if err != nil || len(offer) == 0 {
		helpers.LogHTTPError(responseWriter, "error reading offer", http.StatusBadRequest)
		return
	}

	userProfile, isAuthorized := resolveStreamProfile(token)
	if !isAuthorized {
		responseWriter.WriteHeader(http.StatusUnauthorized)
		return
	}

	if webhookURL := os.Getenv(environment.WebhookURL); webhookURL != "" {
		streamKey, err := webhook.CallWebhook(webhookURL, webhook.WHIPConnect, userProfile.StreamKey, request)
		if err != nil {
			responseWriter.WriteHeader(http.StatusUnauthorized)
			return
		}

		userProfile = defaultProfile(streamKey)
	}

	if request.Method == http.MethodPatch {
		patchHandler(responseWriter, request, string(offer))
		return
	}

	whipAnswer, sessionID, err := webrtc.WHIP(string(offer), userProfile)
	if err != nil {
		helpers.LogHTTPError(responseWriter, err.Error(), http.StatusBadRequest)
		return
	}

	responseWriter.Header().Add("Link", `</api/sse/`+sessionID+`>; rel="urn:ietf:params:whep:ext:core:server-sent-events"; events="status"`)
	responseWriter.Header().Set("Location", whipRoute+"/"+sessionID)
	responseWriter.Header().Set("Content-Type", "application/sdp")
	responseWriter.Header().Set("Content-Length", strconv.Itoa(len(whipAnswer)))
	responseWriter.WriteHeader(http.StatusCreated)

	if _, err = fmt.Fprint(responseWriter, whipAnswer); err != nil {
		slog.Error("API.WHIP Error", "err", err)
	} else {
		slog.Info("API.WHIP Completed")
	}
}

// resolveStreamProfile applies the stream profile policy. The token is either the bearer
// token of a reserved profile or, when the policy allows it, a free-form stream key.
func resolveStreamProfile(token string) (authorization.PublicProfile, bool) {
	var profile *authorization.PublicProfile

	if os.Getenv(environment.StreamProfilePolicy) == authorization.StreamPolicyReservedOnly {
		reservedProfile, err := authorization.GetPublicProfile(token)
		if err != nil {
			slog.Info("Unauthorized login attempt")
			return authorization.PublicProfile{}, false
		}

		profile = reservedProfile
	} else {
		if authorization.IsProfileReserved(token) {
			slog.Info("Unauthorized login attempt with reserved stream key", "streamKey", token)
			return authorization.PublicProfile{}, false
		}

		profile, _ = authorization.GetPublicProfile(token)
	}

	if profile == nil || *profile == (authorization.PublicProfile{}) {
		return defaultProfile(token), true
	}

	return *profile, true
}

func defaultProfile(streamKey string) authorization.PublicProfile {
	return authorization.PublicProfile{
		StreamKey: streamKey,
		IsPublic:  true,
		MOTD:      "Welcome to " + streamKey + "'s stream!",
	}
}

func patchHandler(responseWriter http.ResponseWriter, request *http.Request, candidates string) {
	if !helpers.IsTrickleICERequest(request) {
		helpers.LogHTTPError(responseWriter, "Invalid patch request", http.StatusBadRequest)
		return
	}

	sessionID := helpers.SessionIDFromPath(request.URL.Path, whipRoute)
	if sessionID == "" {
		helpers.LogHTTPError(responseWriter, "Missing session id", http.StatusBadRequest)
		return
	}

	slog.Info("API.WHIP.Patch: Patching session", "sessionID", sessionID)
	if err := webrtc.HandleWHIPPatch(sessionID, candidates); err != nil {
		slog.Error("API.WHIP.Patch Error", "err", err)
		helpers.LogHTTPError(responseWriter, err.Error(), http.StatusBadRequest)
		return
	}

	responseWriter.WriteHeader(http.StatusNoContent)
}

func deleteHandler(responseWriter http.ResponseWriter, request *http.Request) {
	sessionID := helpers.SessionIDFromPath(request.URL.Path, whipRoute)
	if sessionID == "" {
		helpers.LogHTTPError(responseWriter, "Missing session id", http.StatusBadRequest)
		return
	}

	slog.Info("API.WHIP.Delete: Removing session", "sessionID", sessionID)
	if err := webrtc.HandleWHIPDelete(sessionID); err != nil {
		slog.Error("API.WHIP.Delete Error", "err", err)
		helpers.LogHTTPError(responseWriter, err.Error(), http.StatusBadRequest)
		return
	}

	responseWriter.WriteHeader(http.StatusNoContent)
}

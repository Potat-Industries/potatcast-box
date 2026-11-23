package whip

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/glimesh/broadcast-box/internal/server/authorization"
	"github.com/glimesh/broadcast-box/internal/server/helpers"
	"github.com/glimesh/broadcast-box/internal/webrtc/sessions/manager"
)

type updateProfilePayload struct {
	Motd     string `json:"motd"`
	IsPublic bool   `json:"isPublic"`
}

func ProfileHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !helpers.RequireMethod(responseWriter, request, http.MethodGet, http.MethodPost) {
		return
	}

	token := helpers.ResolveBearerToken(request.Header.Get("Authorization"))

	if request.Method == http.MethodGet {
		getProfile(responseWriter, token)
		return
	}

	updateProfile(responseWriter, request, token)
}

func getProfile(responseWriter http.ResponseWriter, token string) {
	profile, err := authorization.GetPersonalProfile(token)
	if err != nil {
		// The publish page probes this endpoint with plain stream keys, so a missing profile is not an error.
		responseWriter.WriteHeader(http.StatusNoContent)
		return
	}

	helpers.WriteJSON(responseWriter, http.StatusOK, profile)
}

func updateProfile(responseWriter http.ResponseWriter, request *http.Request, token string) {
	var payload updateProfilePayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		helpers.LogHTTPError(responseWriter, "Invalid profile payload", http.StatusBadRequest)
		return
	}

	if err := authorization.UpdateProfile(token, payload.Motd, payload.IsPublic); err != nil {
		if errors.Is(err, authorization.ErrProfileNotFound) {
			helpers.LogHTTPError(responseWriter, "Profile not found", http.StatusNotFound)
			return
		}

		slog.Error("Profile Update Error", "err", err)
		helpers.LogHTTPError(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	profile, err := authorization.GetPersonalProfile(token)
	if err != nil {
		slog.Error("Profile Update Error", "err", err)
		helpers.LogHTTPError(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	manager.SessionsManager.UpdateProfile(profile)

	helpers.WriteJSON(responseWriter, http.StatusOK, profile)
}

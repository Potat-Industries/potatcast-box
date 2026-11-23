package admin

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/glimesh/broadcast-box/internal/server/authorization"
	"github.com/glimesh/broadcast-box/internal/server/helpers"
)

type streamKeyPayload struct {
	StreamKey string `json:"streamKey"`
}

func ProfilesHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !requireAdmin(responseWriter, request, http.MethodGet) {
		return
	}

	profiles, err := authorization.GetAdminProfilesAll()
	if err != nil {
		helpers.LogHTTPError(responseWriter, "Error reading profiles", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(responseWriter, http.StatusOK, profiles)
}

func ProfilesResetTokenHandler(responseWriter http.ResponseWriter, request *http.Request) {
	handleStreamKeyAction(responseWriter, request, func(streamKey string) error {
		if err := authorization.ResetProfileToken(streamKey); err != nil {
			slog.Error("API.Admin.ResetProfileToken", "err", err)
			return errors.New("error updating token")
		}

		return nil
	})
}

func ProfileAddHandler(responseWriter http.ResponseWriter, request *http.Request) {
	handleStreamKeyAction(responseWriter, request, func(streamKey string) error {
		_, err := authorization.CreateProfile(streamKey)
		return err
	})
}

func ProfileRemoveHandler(responseWriter http.ResponseWriter, request *http.Request) {
	handleStreamKeyAction(responseWriter, request, func(streamKey string) error {
		_, err := authorization.RemoveProfile(streamKey)
		return err
	})
}

func handleStreamKeyAction(responseWriter http.ResponseWriter, request *http.Request, action func(streamKey string) error) {
	if !requireAdmin(responseWriter, request, http.MethodPost) {
		return
	}

	var payload streamKeyPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		helpers.LogHTTPError(responseWriter, "Error resolving request", http.StatusBadRequest)
		return
	}

	if err := action(payload.StreamKey); err != nil {
		helpers.LogHTTPError(responseWriter, err.Error(), http.StatusBadRequest)
		return
	}

	responseWriter.WriteHeader(http.StatusOK)
}

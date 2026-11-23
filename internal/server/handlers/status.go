package handlers

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/glimesh/broadcast-box/internal/server/helpers"
	"github.com/glimesh/broadcast-box/internal/webrtc/sessions/manager"
)

func statusHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !helpers.RequireMethod(responseWriter, request, http.MethodGet, http.MethodHead) {
		return
	}

	if streamKey := request.URL.Query().Get("key"); streamKey != "" {
		streamStatusHandler(responseWriter, streamKey)
		return
	}

	sessionStatusesHandler(responseWriter)
}

func streamStatusHandler(responseWriter http.ResponseWriter, streamKey string) {
	session, ok := manager.SessionsManager.GetSessionByID(streamKey)
	if !ok {
		slog.Info("Could not find active stream", "streamKey", streamKey)
		helpers.LogHTTPError(responseWriter, "No active stream found", http.StatusNotFound)
		return
	}

	helpers.WriteJSON(responseWriter, http.StatusOK, session.GetStreamStatus())
}

func sessionStatusesHandler(responseWriter http.ResponseWriter) {
	if os.Getenv(environment.DisableStatus) != "" {
		helpers.LogHTTPError(responseWriter, "Status Service Unavailable", http.StatusServiceUnavailable)
		return
	}

	helpers.WriteJSON(responseWriter, http.StatusOK, manager.SessionsManager.GetSessionStates(false))
}

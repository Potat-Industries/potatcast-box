package admin

import (
	"net/http"

	"github.com/glimesh/broadcast-box/internal/server/helpers"
	"github.com/glimesh/broadcast-box/internal/webrtc/sessions/manager"
)

func StatusHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !requireAdmin(responseWriter, request, http.MethodGet) {
		return
	}

	helpers.WriteJSON(responseWriter, http.StatusOK, manager.SessionsManager.GetSessionStates(true))
}

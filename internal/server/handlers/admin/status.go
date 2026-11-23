package admin

import (
	"net/http"

	"github.com/glimesh/broadcast-box/internal/server/helpers"
)

func StatusHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !requireAdmin(responseWriter, request, http.MethodGet) {
		return
	}

	helpers.WriteJSON(responseWriter, http.StatusOK, helpers.ActiveSessionStates(true))
}

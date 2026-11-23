package admin

import (
	"net/http"

	"github.com/glimesh/broadcast-box/internal/server/helpers"
)

func LoginHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !requireAdmin(responseWriter, request, http.MethodPost) {
		return
	}

	helpers.WriteJSON(responseWriter, http.StatusOK, sessionResponse{IsValid: true})
}

package admin

import (
	"net/http"

	"github.com/glimesh/broadcast-box/internal/server/helpers"
)

func LoggingHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !requireAdmin(responseWriter, request, http.MethodGet) {
		return
	}

	helpers.ServeLatestLogFile(responseWriter)
}

package handlers

import (
	"crypto/subtle"
	"net/http"
	"os"
	"strings"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/glimesh/broadcast-box/internal/server/helpers"
)

func logHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !strings.EqualFold(os.Getenv(environment.LoggingAPIEnabled), "true") {
		return
	}

	if apiKey := os.Getenv(environment.LoggingAPIKey); apiKey != "" {
		token := helpers.ResolveBearerToken(request.Header.Get("Authorization"))

		if subtle.ConstantTimeCompare([]byte(token), []byte(apiKey)) != 1 {
			helpers.LogHTTPError(responseWriter, "Authorization was invalid", http.StatusUnauthorized)
			return
		}
	}

	helpers.ServeLatestLogFile(responseWriter)
}

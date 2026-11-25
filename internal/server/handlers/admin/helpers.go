package admin

import (
	"crypto/subtle"
	"net/http"
	"os"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/glimesh/broadcast-box/internal/server/helpers"
)

const invalidAuthorizationMessage = "Authorization was invalid"

type sessionResponse struct {
	IsValid      bool   `json:"isValid"`
	ErrorMessage string `json:"errorMessage"`
}

func isAdminRequest(request *http.Request) bool {
	adminToken := os.Getenv(environment.FrontendAdminToken)
	token := helpers.ResolveBearerToken(request.Header.Get("Authorization"))

	if adminToken == "" || token == "" {
		return false
	}

	return subtle.ConstantTimeCompare([]byte(adminToken), []byte(token)) == 1
}

// requireAdmin answers the request itself when the method or the admin token is wrong.
func requireAdmin(responseWriter http.ResponseWriter, request *http.Request, method string) bool {
	if !helpers.RequireMethod(responseWriter, request, method) {
		return false
	}

	if !isAdminRequest(request) {
		helpers.LogHTTPError(responseWriter, invalidAuthorizationMessage, http.StatusUnauthorized)
		return false
	}

	return true
}

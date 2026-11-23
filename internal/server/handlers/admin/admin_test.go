package admin

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/glimesh/broadcast-box/internal/server/authorization"
	"github.com/stretchr/testify/require"
)

const adminToken = "AdminSecret"

func adminRequest(method string, target string, token string, body string) *http.Request {
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	if token != "" {
		request.Header.Set("Authorization", "Bearer "+token)
	}

	return request
}

func TestLoginHandler(t *testing.T) {
	t.Setenv(environment.FrontendAdminToken, adminToken)

	for _, test := range []struct {
		name  string
		token string
		want  int
	}{
		{"valid token", adminToken, http.StatusOK},
		{"missing token", "", http.StatusUnauthorized},
		{"wrong token", "SomethingElse", http.StatusUnauthorized},
		{"token differing only in case", strings.ToLower(adminToken), http.StatusUnauthorized},
	} {
		t.Run(test.name, func(t *testing.T) {
			response := httptest.NewRecorder()
			LoginHandler(response, adminRequest(http.MethodPost, "/api/admin/login", test.token, ""))

			require.Equal(t, test.want, response.Code)
			if test.want == http.StatusOK {
				require.JSONEq(t, `{"isValid":true,"errorMessage":""}`, response.Body.String())
			}
		})
	}
}

func TestLoginHandlerRejectsEveryTokenWhenAdminTokenUnset(t *testing.T) {
	t.Setenv(environment.FrontendAdminToken, "")

	response := httptest.NewRecorder()
	LoginHandler(response, adminRequest(http.MethodPost, "/api/admin/login", adminToken, ""))

	require.Equal(t, http.StatusUnauthorized, response.Code)
}

func TestLoginHandlerRejectsWrongMethodWithSingleResponse(t *testing.T) {
	t.Setenv(environment.FrontendAdminToken, adminToken)

	response := httptest.NewRecorder()
	LoginHandler(response, adminRequest(http.MethodGet, "/api/admin/login", adminToken, ""))

	require.Equal(t, http.StatusMethodNotAllowed, response.Code)
	require.Equal(t, "Method not allowed\n", response.Body.String())
}

func TestProfileHandlersManageProfiles(t *testing.T) {
	t.Setenv(environment.FrontendAdminToken, adminToken)
	t.Setenv(environment.StreamProfilePath, t.TempDir())

	add := httptest.NewRecorder()
	ProfileAddHandler(add, adminRequest(http.MethodPost, "/api/admin/profiles/add-profile", adminToken, `{"streamKey":"my_stream"}`))
	require.Equal(t, http.StatusOK, add.Code)
	require.True(t, authorization.IsProfileReserved("my_stream"))

	list := httptest.NewRecorder()
	ProfilesHandler(list, adminRequest(http.MethodGet, "/api/admin/profiles", adminToken, ""))
	require.Equal(t, http.StatusOK, list.Code)
	require.Equal(t, "application/json", list.Header().Get("Content-Type"))
	require.Contains(t, list.Body.String(), `"streamKey":"my_stream"`)

	reset := httptest.NewRecorder()
	ProfilesResetTokenHandler(reset, adminRequest(http.MethodPost, "/api/admin/profiles/reset-token", adminToken, `{"streamKey":"my_stream"}`))
	require.Equal(t, http.StatusOK, reset.Code)

	remove := httptest.NewRecorder()
	ProfileRemoveHandler(remove, adminRequest(http.MethodPost, "/api/admin/profiles/remove-profile", adminToken, `{"streamKey":"my_stream"}`))
	require.Equal(t, http.StatusOK, remove.Code)
	require.False(t, authorization.IsProfileReserved("my_stream"))
}

func TestProfileAddHandlerRejectsPathTraversal(t *testing.T) {
	t.Setenv(environment.FrontendAdminToken, adminToken)
	t.Setenv(environment.StreamProfilePath, t.TempDir())

	response := httptest.NewRecorder()
	ProfileAddHandler(response, adminRequest(http.MethodPost, "/api/admin/profiles/add-profile", adminToken, `{"streamKey":"../escape"}`))

	require.Equal(t, http.StatusBadRequest, response.Code)
}

func TestProfileHandlersRequireAdminToken(t *testing.T) {
	t.Setenv(environment.FrontendAdminToken, adminToken)
	t.Setenv(environment.StreamProfilePath, t.TempDir())

	response := httptest.NewRecorder()
	ProfileAddHandler(response, adminRequest(http.MethodPost, "/api/admin/profiles/add-profile", "wrong", `{"streamKey":"my_stream"}`))

	require.Equal(t, http.StatusUnauthorized, response.Code)
	require.False(t, authorization.IsProfileReserved("my_stream"))
}

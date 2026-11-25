package whip

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/glimesh/broadcast-box/internal/server/authorization"
	"github.com/glimesh/broadcast-box/internal/server/testutil"
	"github.com/glimesh/broadcast-box/internal/webrtc/sessions/manager"
	"github.com/stretchr/testify/require"
)

func profileRequest(method string, token string, body string) *http.Request {
	request := httptest.NewRequest(method, "/api/whip/profile", strings.NewReader(body))
	request.Header.Set("Authorization", "Bearer "+token)

	return request
}

func useEmptySessionManager(t *testing.T) {
	t.Helper()

	previous := manager.SessionsManager
	manager.SessionsManager = &manager.SessionManager{}
	manager.SessionsManager.Setup()

	t.Cleanup(func() { manager.SessionsManager = previous })
}

func TestProfileHandlerGetUnknownProfileHasNoContent(t *testing.T) {
	t.Setenv(environment.StreamProfilePath, t.TempDir())

	response := httptest.NewRecorder()
	ProfileHandler(response, profileRequest(http.MethodGet, "plain_stream_key", ""))

	require.Equal(t, http.StatusNoContent, response.Code)
	require.Empty(t, response.Body.String())
}

func TestProfileHandlerUpdatesProfile(t *testing.T) {
	t.Setenv(environment.StreamProfilePath, t.TempDir())
	useEmptySessionManager(t)

	token, err := authorization.CreateProfile("my_stream")
	require.NoError(t, err)

	update := httptest.NewRecorder()
	ProfileHandler(update, profileRequest(http.MethodPost, token, `{"motd":"hello","isPublic":false}`))
	require.Equal(t, http.StatusOK, update.Code)

	get := httptest.NewRecorder()
	ProfileHandler(get, profileRequest(http.MethodGet, token, ""))
	require.Equal(t, http.StatusOK, get.Code)
	require.Equal(t, "application/json", testutil.SentContentType(get))
	require.JSONEq(t, `{"streamKey":"my_stream","isActive":false,"isPublic":false,"motd":"hello"}`, get.Body.String())
}

func TestProfileHandlerUpdateUnknownProfileIsNotFound(t *testing.T) {
	t.Setenv(environment.StreamProfilePath, t.TempDir())
	useEmptySessionManager(t)

	response := httptest.NewRecorder()
	ProfileHandler(response, profileRequest(http.MethodPost, "unknown-token", `{"motd":"hello","isPublic":true}`))

	require.Equal(t, http.StatusNotFound, response.Code)
}

func TestProfileHandlerRejectsMalformedUpdate(t *testing.T) {
	t.Setenv(environment.StreamProfilePath, t.TempDir())

	response := httptest.NewRecorder()
	ProfileHandler(response, profileRequest(http.MethodPost, "unknown-token", `not json`))

	require.Equal(t, http.StatusBadRequest, response.Code)
}

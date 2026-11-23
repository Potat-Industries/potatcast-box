package handlers

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/glimesh/broadcast-box/internal/server/testutil"
	"github.com/glimesh/broadcast-box/internal/webrtc/sessions/manager"
	"github.com/stretchr/testify/require"
)

func useEmptySessionManager(t *testing.T) {
	t.Helper()

	previous := manager.SessionsManager
	manager.SessionsManager = &manager.SessionManager{}
	manager.SessionsManager.Setup()

	t.Cleanup(func() { manager.SessionsManager = previous })
}

func TestLayerChangeHandlerRejectsUnknownSession(t *testing.T) {
	useEmptySessionManager(t)

	request := httptest.NewRequest(http.MethodPost, "/api/layer/unknown", strings.NewReader(`{"mediaId":"1","encodingId":"high"}`))
	response := httptest.NewRecorder()

	require.NotPanics(t, func() { layerChangeHandler(response, request) })
	require.Equal(t, http.StatusBadRequest, response.Code)
}

func TestLayerChangeHandlerRejectsMalformedBody(t *testing.T) {
	useEmptySessionManager(t)

	request := httptest.NewRequest(http.MethodPost, "/api/layer/unknown", strings.NewReader(`not json`))
	response := httptest.NewRecorder()

	layerChangeHandler(response, request)

	require.Equal(t, http.StatusBadRequest, response.Code)
}

func TestStatusHandlerReturnsEmptyListWithoutStreams(t *testing.T) {
	useEmptySessionManager(t)

	response := httptest.NewRecorder()
	statusHandler(response, httptest.NewRequest(http.MethodGet, "/api/status", nil))

	require.Equal(t, http.StatusOK, response.Code)
	require.JSONEq(t, `[]`, response.Body.String())
	require.Equal(t, "application/json", testutil.SentContentType(response))
}

func TestStatusHandlerUnknownStreamKey(t *testing.T) {
	useEmptySessionManager(t)

	response := httptest.NewRecorder()
	statusHandler(response, httptest.NewRequest(http.MethodGet, "/api/status?key=missing", nil))

	require.Equal(t, http.StatusNotFound, response.Code)
}

func TestStatusHandlerDisabled(t *testing.T) {
	useEmptySessionManager(t)
	t.Setenv(environment.DisableStatus, "TRUE")

	response := httptest.NewRecorder()
	statusHandler(response, httptest.NewRequest(http.MethodGet, "/api/status", nil))

	require.Equal(t, http.StatusServiceUnavailable, response.Code)
}

func TestSSEHandlerRejectsUnknownSession(t *testing.T) {
	useEmptySessionManager(t)

	response := httptest.NewRecorder()
	sseHandler(response, httptest.NewRequest(http.MethodGet, "/api/sse/unknown", nil))

	require.Equal(t, http.StatusBadRequest, response.Code)
	require.NotEqual(t, "text/event-stream", testutil.SentContentType(response))
}

func TestLogHandlerRequiresMatchingAPIKey(t *testing.T) {
	t.Setenv(environment.LoggingAPIEnabled, "TRUE")
	t.Setenv(environment.LoggingAPIKey, "secret-key")

	for _, test := range []struct {
		name          string
		authorization string
	}{
		{"missing", ""},
		{"wrong key", "Bearer other-key"},
		{"wrong case", "Bearer SECRET-KEY"},
	} {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, "/api/log", nil)
			if test.authorization != "" {
				request.Header.Set("Authorization", test.authorization)
			}

			response := httptest.NewRecorder()
			logHandler(response, request)

			require.Equal(t, http.StatusUnauthorized, response.Code)
		})
	}
}

func TestLogHandlerServesLogWithMatchingAPIKey(t *testing.T) {
	logDirectory := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(logDirectory, "20260101"), []byte("log line\n"), 0600))

	t.Setenv(environment.LoggingAPIEnabled, "TRUE")
	t.Setenv(environment.LoggingAPIKey, "secret-key")
	t.Setenv("LOGGING_DIRECTORY", logDirectory)

	request := httptest.NewRequest(http.MethodGet, "/api/log", nil)
	request.Header.Set("Authorization", "Bearer secret-key")

	response := httptest.NewRecorder()
	logHandler(response, request)

	require.Equal(t, http.StatusOK, response.Code)
	require.Equal(t, "log line\n", response.Body.String())
}

func TestLogHandlerReportsMissingLogFile(t *testing.T) {
	t.Setenv(environment.LoggingAPIEnabled, "TRUE")
	t.Setenv("LOGGING_DIRECTORY", t.TempDir())

	response := httptest.NewRecorder()
	logHandler(response, httptest.NewRequest(http.MethodGet, "/api/log", nil))

	require.Equal(t, http.StatusInternalServerError, response.Code)
}

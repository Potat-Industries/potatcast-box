package helpers

import (
	"math"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestWriteJSONSetsContentTypeBeforeBody(t *testing.T) {
	recorder := httptest.NewRecorder()

	WriteJSON(recorder, http.StatusOK, map[string]string{"streamKey": "test"})

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Equal(t, "application/json", recorder.Header().Get("Content-Type"))
	require.JSONEq(t, `{"streamKey":"test"}`, recorder.Body.String())
}

func TestWriteJSONReportsEncodingFailure(t *testing.T) {
	recorder := httptest.NewRecorder()

	WriteJSON(recorder, http.StatusOK, math.Inf(1))

	require.Equal(t, http.StatusInternalServerError, recorder.Code)
}

func TestRequireMethod(t *testing.T) {
	allowed := httptest.NewRecorder()
	require.True(t, RequireMethod(allowed, httptest.NewRequest(http.MethodPost, "/", nil), http.MethodGet, http.MethodPost))
	require.Equal(t, http.StatusOK, allowed.Code)

	rejected := httptest.NewRecorder()
	require.False(t, RequireMethod(rejected, httptest.NewRequest(http.MethodDelete, "/", nil), http.MethodGet, http.MethodPost))
	require.Equal(t, http.StatusMethodNotAllowed, rejected.Code)
	require.Equal(t, "GET, POST", rejected.Header().Get("Allow"))
}

func TestSessionIDFromPath(t *testing.T) {
	for _, test := range []struct {
		name string
		path string
		want string
	}{
		{"bare route", "/api/whip", ""},
		{"trailing slash", "/api/whip/", ""},
		{"session id", "/api/whip/1234", "1234"},
		{"padded session id", "/api/whip/ 1234 ", "1234"},
	} {
		t.Run(test.name, func(t *testing.T) {
			require.Equal(t, test.want, SessionIDFromPath(test.path, "/api/whip"))
		})
	}
}

func TestIsTrickleICERequest(t *testing.T) {
	for _, test := range []struct {
		contentType string
		want        bool
	}{
		{"application/trickle-ice-sdpfrag", true},
		{"application/trickle-ice-sdpfrag; charset=utf-8", true},
		{"application/sdp", false},
		{"", false},
	} {
		request := httptest.NewRequest(http.MethodPatch, "/", nil)
		request.Header.Set("Content-Type", test.contentType)

		require.Equal(t, test.want, IsTrickleICERequest(request), test.contentType)
	}
}

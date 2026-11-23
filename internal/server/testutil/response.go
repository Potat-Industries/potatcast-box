// Package testutil holds helpers shared by the HTTP handler tests.
package testutil

import "net/http/httptest"

// SentContentType returns the Content-Type that actually went out with the response.
// recorder.Header() is the live map and would also show a header set after the body was written.
func SentContentType(recorder *httptest.ResponseRecorder) string {
	result := recorder.Result()
	defer func() { _ = result.Body.Close() }()

	return result.Header.Get("Content-Type")
}

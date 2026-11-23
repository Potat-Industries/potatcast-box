package helpers

import (
	"encoding/json"
	"log/slog"
	"mime"
	"net/http"
	"slices"
	"strings"
)

// WriteJSON marshals before writing so an encoding failure can still be reported as a 500.
func WriteJSON(responseWriter http.ResponseWriter, statusCode int, payload any) {
	body, err := json.Marshal(payload)
	if err != nil {
		slog.Error("Failed to encode JSON response", "err", err)
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	responseWriter.Header().Set("Content-Type", "application/json")
	responseWriter.WriteHeader(statusCode)

	if _, err := responseWriter.Write(body); err != nil {
		slog.Error("Failed to write JSON response", "err", err)
	}
}

// RequireMethod reports whether the request uses an allowed method and answers 405 when it does not.
func RequireMethod(responseWriter http.ResponseWriter, request *http.Request, allowedMethods ...string) bool {
	if slices.Contains(allowedMethods, request.Method) {
		return true
	}

	responseWriter.Header().Set("Allow", strings.Join(allowedMethods, ", "))
	LogHTTPError(responseWriter, "Method not allowed", http.StatusMethodNotAllowed)

	return false
}

func LastPathSegment(urlPath string) string {
	segments := strings.Split(urlPath, "/")
	return strings.TrimSpace(segments[len(segments)-1])
}

// SessionIDFromPath returns "" when the path is the bare route without a session ID.
func SessionIDFromPath(urlPath string, route string) string {
	return LastPathSegment(strings.TrimPrefix(urlPath, route))
}

func IsTrickleICERequest(request *http.Request) bool {
	mediaType, _, err := mime.ParseMediaType(request.Header.Get("Content-Type"))
	return err == nil && mediaType == "application/trickle-ice-sdpfrag"
}

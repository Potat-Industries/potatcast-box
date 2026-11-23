package helpers

import (
	"io"
	"log/slog"
	"net/http"

	"github.com/glimesh/broadcast-box/internal/environment"
)

func ServeLatestLogFile(responseWriter http.ResponseWriter) {
	file, err := environment.GetLogFileReader()
	if err != nil {
		LogHTTPError(responseWriter, "Log file unavailable", http.StatusInternalServerError)
		return
	}

	defer func() {
		if err := file.Close(); err != nil {
			slog.Error("Failed to close log file", "err", err)
		}
	}()

	responseWriter.Header().Set("Content-Type", "text/plain; charset=utf-8")

	if _, err := io.Copy(responseWriter, file); err != nil {
		slog.Error("Failed to write log file to response", "err", err)
	}
}

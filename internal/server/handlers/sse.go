package handlers

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/glimesh/broadcast-box/internal/server/helpers"
	"github.com/glimesh/broadcast-box/internal/webrtc/sessions/manager"
)

const (
	sseEventInterval = 5 * time.Second
	sseWriteTimeout  = 500 * time.Millisecond
)

type sseSubscription struct {
	events   func() []string
	isClosed func() bool
}

func sseHandler(responseWriter http.ResponseWriter, request *http.Request) {
	flusher, ok := responseWriter.(http.Flusher)
	if !ok {
		http.Error(responseWriter, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	subscription, found := findSSESubscription(helpers.LastPathSegment(request.URL.Path))
	if !found {
		helpers.LogHTTPError(responseWriter, "Invalid request", http.StatusBadRequest)
		return
	}

	responseWriter.Header().Set("Content-Type", "text/event-stream")
	responseWriter.Header().Set("Cache-Control", "no-cache")
	responseWriter.Header().Set("Connection", "keep-alive")

	ctx := request.Context()
	writeEvent := newSSEEventWriter(responseWriter, flusher)
	writeEvents := func() bool {
		for _, event := range subscription.events() {
			if event == "" || ctx.Err() != nil || !writeEvent(event) {
				return false
			}
		}

		return true
	}

	if !writeEvents() {
		return
	}

	ticker := time.NewTicker(sseEventInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("API.SSE: Client disconnected")
			return
		case <-ticker.C:
			if subscription.isClosed() || !writeEvents() {
				return
			}
		}
	}
}

// A session ID belongs either to a viewer (WHEP), who also receives the available layers, or to the broadcaster (WHIP).
func findSSESubscription(sessionID string) (sseSubscription, bool) {
	if streamSession, whepSession, found := manager.SessionsManager.GetSessionAndWHEPByID(sessionID); found {
		return sseSubscription{
			events: func() []string {
				events := []string{streamSession.GetSessionStatsEvent()}
				if host := streamSession.Host.Load(); host != nil {
					events = append(events, host.GetAvailableLayersEvent())
				}

				return events
			},
			isClosed: whepSession.IsSessionClosed.Load,
		}, true
	}

	if streamSession, found := manager.SessionsManager.GetSessionByHostSessionID(sessionID); found {
		return sseSubscription{
			events:   func() []string { return []string{streamSession.GetSessionStatsEvent()} },
			isClosed: func() bool { return false },
		}, true
	}

	return sseSubscription{}, false
}

func newSSEEventWriter(responseWriter http.ResponseWriter, flusher http.Flusher) func(event string) bool {
	debugSSEMessages := strings.EqualFold(os.Getenv(environment.DebugPrintSSEMessages), "true")
	responseController := http.NewResponseController(responseWriter)

	return func(event string) bool {
		if debugSSEMessages {
			slog.Info("API.SSE Sending", "msg", event)
		}

		if err := responseController.SetWriteDeadline(time.Now().Add(sseWriteTimeout)); err != nil && !errors.Is(err, http.ErrNotSupported) {
			slog.Error("API.SSE SetWriteDeadline error", "err", err)
			return false
		}

		_, writeErr := fmt.Fprintf(responseWriter, "%s\n", event)
		if writeErr == nil {
			flusher.Flush()
		}

		// SSE responses stay open, so the deadline must not outlive this single write.
		if err := responseController.SetWriteDeadline(time.Time{}); err != nil && !errors.Is(err, http.ErrNotSupported) {
			slog.Error("API.SSE ClearWriteDeadline error", "err", err)
			return false
		}

		if writeErr != nil {
			if errors.Is(writeErr, os.ErrDeadlineExceeded) {
				slog.Error("API.SSE Write timeout")
			} else {
				slog.Error("API.SSE Write error", "err", writeErr)
			}

			return false
		}

		return true
	}
}

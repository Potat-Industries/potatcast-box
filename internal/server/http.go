package server

import (
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/glimesh/broadcast-box/internal/server/handlers"
)

const (
	defaultHTTPAddress         = ":8080"
	defaultHTTPRedirectAddress = ":80"

	// Bounds how long a client may take to send request headers. Response writes stay
	// unbounded because SSE responses are long-lived.
	readHeaderTimeout = 10 * time.Second
)

func startHTTPServer(serverMux http.HandlerFunc) {
	server := &http.Server{
		Handler:           serverMux,
		Addr:              getHTTPAddress(),
		ReadHeaderTimeout: readHeaderTimeout,
	}

	slog.Info("Starting HTTP", "address", getHTTPAddress())
	if err := server.ListenAndServe(); err != nil {
		slog.Error("Server closed with error", "err", err)
		os.Exit(1)
	}
}

func getHTTPAddress() string {
	if httpAddress := os.Getenv(environment.HTTPAddress); httpAddress != "" {
		return httpAddress
	}

	return defaultHTTPAddress
}

func getHTTPRedirectAddress() string {
	address := os.Getenv(environment.HTTPSRedirectPort)
	if address == "" {
		return defaultHTTPRedirectAddress
	}

	if !strings.HasPrefix(address, ":") {
		address = ":" + address
	}

	return address
}

func setupHTTPRedirect() {
	if shouldRedirectToHTTPS := os.Getenv(environment.HTTPEnableRedirect); shouldRedirectToHTTPS != "" {
		go func() {
			slog.Info("Setting up HTTP Redirecting")

			redirectServer := &http.Server{
				Addr:              getHTTPRedirectAddress(),
				Handler:           http.HandlerFunc(handlers.RedirectToHttpsHandler),
				ReadHeaderTimeout: readHeaderTimeout,
			}

			slog.Info("Forwarding requests to HTTPS server", "address", redirectServer.Addr)
			err := redirectServer.ListenAndServe()

			if err != nil {
				slog.Error("Redirect Server closed with error", "err", err)
				os.Exit(1)
			}
		}()
	}
}

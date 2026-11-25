package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/glimesh/broadcast-box/internal/server/helpers"
	"github.com/glimesh/broadcast-box/internal/webrtc/sessions/manager"
)

const (
	videoMediaID = "1"
	audioMediaID = "2"
)

type whepLayerRequestJSON struct {
	MediaID    string `json:"mediaId"`
	EncodingID string `json:"encodingId"`
}

func layerChangeHandler(responseWriter http.ResponseWriter, request *http.Request) {
	if !helpers.RequireMethod(responseWriter, request, http.MethodPost) {
		return
	}

	var requestContent whepLayerRequestJSON
	if err := json.NewDecoder(request.Body).Decode(&requestContent); err != nil {
		helpers.LogHTTPError(responseWriter, "Invalid layer request", http.StatusBadRequest)
		return
	}

	whepSessionID := helpers.LastPathSegment(request.URL.Path)
	whepSession, ok := manager.SessionsManager.GetWHEPSessionByID(whepSessionID)
	if !ok {
		helpers.LogHTTPError(responseWriter, "Could not find WHEP session", http.StatusBadRequest)
		return
	}

	switch requestContent.MediaID {
	case videoMediaID:
		slog.Info("Setting Video Layer", "sessionID", whepSessionID, "encodingID", requestContent.EncodingID)
		whepSession.SetVideoLayer(requestContent.EncodingID)
	case audioMediaID:
		slog.Info("Setting Audio Layer", "sessionID", whepSessionID, "encodingID", requestContent.EncodingID)
		whepSession.SetAudioLayer(requestContent.EncodingID)
	default:
		helpers.LogHTTPError(responseWriter, "Unknown media type", http.StatusBadRequest)
	}
}

package helpers

import (
	"github.com/glimesh/broadcast-box/internal/webrtc/sessions/manager"
	"github.com/glimesh/broadcast-box/internal/webrtc/sessions/session"
)

// ActiveSessionStates never returns nil: clients iterate over the JSON result, so "no streams"
// has to be encoded as an empty list rather than null.
func ActiveSessionStates(includePrivateStreams bool) []session.StreamSessionState {
	if sessionStates := manager.SessionsManager.GetSessionStates(includePrivateStreams); sessionStates != nil {
		return sessionStates
	}

	return []session.StreamSessionState{}
}

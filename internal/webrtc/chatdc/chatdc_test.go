package chatdc

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNormalizeChatMessage(t *testing.T) {
	for _, test := range []struct {
		name        string
		text        string
		displayName string
		wantErr     error
	}{
		{"trims whitespace", "  hello  ", "  alice  ", nil},
		{"empty text", "   ", "alice", errInvalidMessageLength},
		{"empty display name", "hello", "   ", errInvalidDisplayNameLength},
		{"text at limit", strings.Repeat("a", maxTextLength), "alice", nil},
		{"text over limit", strings.Repeat("a", maxTextLength+1), "alice", errInvalidMessageLength},
		{"multi-byte text at limit", strings.Repeat("é", maxTextLength), "alice", nil},
		{"multi-byte display name at limit", "hello", strings.Repeat("é", maxDisplayNameLength), nil},
		{"display name over limit", "hello", strings.Repeat("a", maxDisplayNameLength+1), errInvalidDisplayNameLength},
	} {
		t.Run(test.name, func(t *testing.T) {
			text, displayName, err := normalizeChatMessage(test.text, test.displayName)

			require.ErrorIs(t, err, test.wantErr)
			if test.wantErr == nil {
				require.Equal(t, strings.TrimSpace(test.text), text)
				require.Equal(t, strings.TrimSpace(test.displayName), displayName)
			}
		})
	}
}

package authorization

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/glimesh/broadcast-box/internal/environment"
	"github.com/stretchr/testify/require"
)

func TestStreamKeyWithUnderscore(t *testing.T) {
	t.Setenv(environment.StreamProfilePath, t.TempDir())

	_, err := CreateProfile("my_stream")
	require.NoError(t, err)

	require.True(t, IsProfileReserved("my_stream"))
	require.False(t, IsProfileReserved("my"))

	_, err = CreateProfile("my")
	require.NoError(t, err)

	require.NoError(t, ResetProfileToken("my_stream"))

	removed, err := RemoveProfile("my_stream")
	require.NoError(t, err)
	require.True(t, removed)

	require.False(t, IsProfileReserved("my_stream"))
	require.True(t, IsProfileReserved("my"))
}

func TestCreateProfileRejectsInvalidStreamKeys(t *testing.T) {
	t.Setenv(environment.StreamProfilePath, t.TempDir())

	for _, streamKey := range []string{"", "my stream", "../escape", "name/with/slash", "dots.are.invalid"} {
		_, err := CreateProfile(streamKey)
		require.Error(t, err, streamKey)
	}

	for _, streamKey := range []string{"stream", "my_stream-2", "strøm"} {
		_, err := CreateProfile(streamKey)
		require.NoError(t, err, streamKey)
	}
}

func TestRemoveProfileHandlesKeysCreatedBeforeValidationWasAnchored(t *testing.T) {
	profilePath := t.TempDir()
	t.Setenv(environment.StreamProfilePath, profilePath)

	require.NoError(t, os.WriteFile(filepath.Join(profilePath, "my stream_token"), []byte(`{}`), 0644))

	removed, err := RemoveProfile("my stream")
	require.NoError(t, err)
	require.True(t, removed)
}

func TestUpdateProfileUnknownToken(t *testing.T) {
	t.Setenv(environment.StreamProfilePath, t.TempDir())

	require.ErrorIs(t, UpdateProfile("unknown", "motd", true), ErrProfileNotFound)
}

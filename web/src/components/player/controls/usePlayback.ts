import { useCallback, useEffect, useState, type RefObject, type SyntheticEvent } from "react";
import { readStored, writeStored } from "../../../utilities/storage";

const VOLUME_STORAGE_KEY = "player-volume";
const MUTED_STORAGE_KEY = "player-muted";
const DEFAULT_VOLUME = 1;
const UNMUTE_FALLBACK_VOLUME = 0.5;

interface AudioState {
  volume: number;
  isMuted: boolean;
}

function readInitialAudio(startMuted: boolean): AudioState {
  const storedVolume = readStored(VOLUME_STORAGE_KEY);
  const volume = storedVolume === null ? Number.NaN : Number(storedVolume);

  return {
    volume: volume >= 0 && volume <= 1 ? volume : DEFAULT_VOLUME,
    isMuted: startMuted || readStored(MUTED_STORAGE_KEY) === "true",
  };
}

// iOS ignores writes to HTMLMediaElement.volume; loudness there is controlled by the device only.
function detectVolumeSupport(): boolean {
  const probe = document.createElement("video");
  probe.volume = 0.5;

  return probe.volume === 0.5;
}

function isAutoplayBlocked(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

interface UsePlaybackOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  mediaStream: MediaStream | null;
  startMuted: boolean;
  /** Secondary tiles in multi-view must not overwrite the viewer's saved volume and mute choice. */
  persistAudioChoices: boolean;
}

/**
 * Drives the video element. The element stays the source of truth for volume and mute; this hook
 * mirrors it into state, so changes made outside our controls (native fullscreen, hardware keys)
 * show up too.
 */
export function usePlayback(options: UsePlaybackOptions) {
  const { videoRef, mediaStream, startMuted, persistAudioChoices } = options;

  // Captured once: a tile that later becomes the first one keeps whatever the viewer set on it.
  const [initialAudio] = useState(() => readInitialAudio(startMuted));
  const [audio, setAudio] = useState(initialAudio);
  const [canSetVolume] = useState(detectVolumeSupport);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [isAutoplayMuted, setIsAutoplayMuted] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.volume = initialAudio.volume;
    video.muted = initialAudio.isMuted;
  }, [videoRef, initialAudio]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.srcObject = mediaStream;
    if (!mediaStream) {
      return;
    }

    let isCancelled = false;

    // Browsers block autoplay with sound until the viewer has interacted with the site. Muted
    // autoplay is almost always allowed, so fall back to it and offer a one-tap unmute.
    const startPlayback = async () => {
      try {
        await video.play();
        return;
      } catch (error) {
        if (isCancelled || !isAutoplayBlocked(error)) {
          return;
        }
      }

      if (!video.muted) {
        video.muted = true;
        setIsAutoplayMuted(true);

        try {
          await video.play();
          return;
        } catch (error) {
          if (isCancelled || !isAutoplayBlocked(error)) {
            return;
          }
        }
      }

      setNeedsUserGesture(true);
    };

    void startPlayback();

    return () => {
      isCancelled = true;
    };
  }, [videoRef, mediaStream]);

  const persist = useCallback(
    (key: string, value: string) => {
      if (persistAudioChoices) {
        writeStored(key, value);
      }
    },
    [persistAudioChoices],
  );

  const unmute = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.volume === 0) {
      video.volume = UNMUTE_FALLBACK_VOLUME;
      persist(VOLUME_STORAGE_KEY, String(UNMUTE_FALLBACK_VOLUME));
    }

    video.muted = false;
    setIsAutoplayMuted(false);
    persist(MUTED_STORAGE_KEY, "false");
  }, [videoRef, persist]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.muted) {
      unmute();
    } else {
      video.muted = true;
      persist(MUTED_STORAGE_KEY, "true");
    }
  }, [videoRef, unmute, persist]);

  const setVolume = useCallback(
    (volume: number) => {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      const clampedVolume = Math.min(1, Math.max(0, volume));
      video.volume = clampedVolume;
      video.muted = clampedVolume === 0;
      setIsAutoplayMuted(false);
      persist(VOLUME_STORAGE_KEY, String(clampedVolume));
      persist(MUTED_STORAGE_KEY, String(clampedVolume === 0));
    },
    [videoRef, persist],
  );

  const nudgeVolume = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      if (!video.muted) {
        setVolume(video.volume + delta);
      } else if (delta > 0) {
        unmute();
      }
    },
    [videoRef, setVolume, unmute],
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    // Decided by what the viewer sees rather than by video.paused: while a stream is offline or
    // still loading, playback is pending and the element already reports "not paused", so
    // trusting it would turn a press on Play into a pause that cancels the automatic start.
    if (isPlaying) {
      video.pause();
      return;
    }

    setNeedsUserGesture(false);
    void video.play().catch((error) => console.error("Playback failed", error));
  }, [videoRef, isPlaying]);

  const videoEventHandlers = {
    onPlaying: () => {
      setIsPlaying(true);
      setHasFrame(true);
      setNeedsUserGesture(false);
    },
    onPause: () => setIsPlaying(false),
    onEmptied: () => {
      setIsPlaying(false);
      setHasFrame(false);
    },
    onLoadedData: () => setHasFrame(true),
    onVolumeChange: (event: SyntheticEvent<HTMLVideoElement>) => {
      const { volume, muted } = event.currentTarget;
      setAudio({ volume, isMuted: muted });
    },
  };

  return {
    volume: audio.volume,
    isMuted: audio.isMuted,
    canSetVolume,
    isPlaying,
    hasFrame,
    isAutoplayMuted: isAutoplayMuted && audio.isMuted,
    needsUserGesture,
    togglePlay,
    toggleMute,
    unmute,
    setVolume,
    nudgeVolume,
    videoEventHandlers,
  };
}

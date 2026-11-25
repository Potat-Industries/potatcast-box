import { PlayIcon, SpeakerXMarkIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { LocaleContext } from "../../providers/LocaleProvider";
import { ControlButton } from "./controls/ControlButton";
import { PlayerControls, type ChatToggle, type CinemaModeToggle } from "./controls/PlayerControls";
import { useAutoHide } from "./controls/useAutoHide";
import { useFullscreen } from "./controls/useFullscreen";
import { usePictureInPicture } from "./controls/usePictureInPicture";
import { usePlayback } from "./controls/usePlayback";
import { ReactionOverlay } from "./ReactionOverlay";
import type { StreamSession, StreamSessionSnapshot } from "./session/StreamSession";
import { useStreamSession } from "./session/useStreamSession";
import { StatusOverlay, type PlayerStatus } from "./StatusOverlay";

const VOLUME_KEY_STEP = 0.05;
const DOUBLE_CLICK_WINDOW_MS = 200;

interface PlayerProps {
  session: StreamSession;
  /** Secondary tiles start muted so adding a stream never talks over the one already playing. */
  startMuted?: boolean;
  chat?: ChatToggle;
  cinemaMode?: CinemaModeToggle;
  /** Shows a title bar with a close button; used for tiles in multi-view. */
  onClose?: () => void;
}

function getPlayerStatus(
  snapshot: StreamSessionSnapshot,
  hasFrame: boolean,
  needsUserGesture: boolean,
): PlayerStatus | null {
  if (snapshot.phase === "rejected" || snapshot.phase === "reconnecting") {
    return snapshot.phase;
  }

  if (snapshot.streamStatus && !snapshot.streamStatus.isOnline) {
    return "offline";
  }

  // Some browsers load nothing until playback starts, so "waiting for a tap" must not look like loading.
  return hasFrame || needsUserGesture ? null : "loading";
}

function isTypingTarget(target: EventTarget): boolean {
  return (
    target instanceof HTMLElement && target.matches("input:not([type='range']), textarea, select")
  );
}

/** Elements that already give Space and the arrow keys a meaning of their own. */
function handlesSpaceAndArrows(target: EventTarget): boolean {
  return (
    target instanceof HTMLElement &&
    target.matches("button, a, [role='menuitemradio'], input[type='range']")
  );
}

export default function Player({
  session,
  startMuted = false,
  chat,
  cinemaMode,
  onClose,
}: PlayerProps) {
  const { locale } = useContext(LocaleContext);
  const snapshot = useStreamSession(session);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastPointerTypeRef = useRef("mouse");
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHoveringControls, setIsHoveringControls] = useState(false);

  const playback = usePlayback({
    videoRef,
    mediaStream: snapshot.mediaStream,
    startMuted,
    persistAudioChoices: !startMuted,
  });
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef, videoRef);
  const { isPictureInPictureSupported, togglePictureInPicture } = usePictureInPicture(videoRef);
  const { isRevealed, reveal, hide } = useAutoHide();

  useEffect(() => () => clearTimeout(clickTimerRef.current), []);

  const status = getPlayerStatus(snapshot, playback.hasFrame, playback.needsUserGesture);
  const areControlsVisible = isRevealed || isMenuOpen || isHoveringControls || !playback.isPlaying;

  const handleSurfaceClick = () => {
    // A tap on a touchscreen only shows or hides the controls; pausing needs a deliberate press
    // on the play button, otherwise every attempt to reach the controls would pause the stream.
    if (lastPointerTypeRef.current === "mouse") {
      // Held back briefly so a double-click can go fullscreen without a pause-and-resume flicker.
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(playback.togglePlay, DOUBLE_CLICK_WINDOW_MS);
      reveal();
    } else if (areControlsVisible && playback.isPlaying) {
      hide();
    } else {
      reveal();
    }
  };

  const handleSurfaceDoubleClick = () => {
    if (lastPointerTypeRef.current === "mouse") {
      clearTimeout(clickTimerRef.current);
      toggleFullscreen();
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (event.pointerType === "mouse") {
      reveal();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) {
      return;
    }

    const shortcuts: Record<string, (() => void) | undefined> = {
      k: playback.togglePlay,
      m: playback.toggleMute,
      f: toggleFullscreen,
      c: chat?.onToggle,
    };

    if (!handlesSpaceAndArrows(event.target)) {
      shortcuts[" "] = playback.togglePlay;
      shortcuts.ArrowUp = () => playback.nudgeVolume(VOLUME_KEY_STEP);
      shortcuts.ArrowDown = () => playback.nudgeVolume(-VOLUME_KEY_STEP);
    }

    const shortcut = shortcuts[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (!shortcut) {
      return;
    }

    event.preventDefault();
    shortcut();
    reveal();
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={session.streamKey}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={(event) => event.pointerType === "mouse" && hide()}
      className="@container relative h-full w-full overflow-hidden bg-black text-white select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400"
    >
      <video
        ref={videoRef}
        playsInline
        className="h-full w-full object-contain"
        {...playback.videoEventHandlers}
      />

      <div
        aria-hidden="true"
        className={`absolute inset-0 ${areControlsVisible ? "" : "cursor-none"}`}
        onPointerUp={(event) => {
          lastPointerTypeRef.current = event.pointerType;
        }}
        onClick={handleSurfaceClick}
        onDoubleClick={handleSurfaceDoubleClick}
      />

      <ReactionOverlay session={session} />

      {status && (
        <StatusOverlay status={status} streamKey={session.streamKey} onRetry={session.retryNow} />
      )}

      {!status && playback.needsUserGesture && (
        <button
          type="button"
          aria-label={locale.player.button_play}
          onClick={playback.togglePlay}
          className="player-drag-cancel absolute inset-0 z-10 flex items-center justify-center bg-black/40"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-black">
            <PlayIcon className="size-8" />
          </span>
        </button>
      )}

      {!status && !playback.needsUserGesture && playback.isAutoplayMuted && (
        <button
          type="button"
          onClick={playback.unmute}
          className="player-drag-cancel absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold whitespace-nowrap text-black shadow-lg"
        >
          <SpeakerXMarkIcon className="size-5" />
          {locale.player.button_tap_to_unmute}
        </button>
      )}

      {onClose && (
        <div
          className={`player-drag-handle absolute inset-x-0 top-0 z-20 flex cursor-move items-center gap-2 bg-gradient-to-b from-black/85 to-transparent pr-1 pb-6 pl-3 transition-opacity duration-200 has-[:focus-visible]:opacity-100 ${
            areControlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <span className="min-w-0 flex-1 truncate text-sm">
            <span className="font-semibold">{session.streamKey}</span>
            {snapshot.streamStatus?.isOnline && snapshot.streamStatus.motd && (
              <span className="ml-2 text-gray-300">{snapshot.streamStatus.motd}</span>
            )}
          </span>
          <ControlButton label={locale.player.button_close_stream} onClick={onClose}>
            <XMarkIcon className="size-5" />
          </ControlButton>
        </div>
      )}

      <PlayerControls
        isVisible={areControlsVisible}
        snapshot={snapshot}
        isPlaying={playback.isPlaying}
        volume={playback.volume}
        isMuted={playback.isMuted}
        canSetVolume={playback.canSetVolume}
        isFullscreen={isFullscreen}
        chat={chat}
        cinemaMode={cinemaMode}
        onTogglePlay={playback.togglePlay}
        onToggleMute={playback.toggleMute}
        onVolumeChange={playback.setVolume}
        onSelectLayer={(kind, layer) => void session.selectLayer(kind, layer)}
        onMenuOpenChange={setIsMenuOpen}
        onHoverChange={setIsHoveringControls}
        onTogglePictureInPicture={isPictureInPictureSupported ? togglePictureInPicture : undefined}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}

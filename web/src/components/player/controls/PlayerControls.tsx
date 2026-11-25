import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  MusicalNoteIcon,
  PauseIcon,
  PlayIcon,
  RectangleGroupIcon,
  Square2StackIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { useContext } from "react";
import { LocaleContext } from "../../../providers/LocaleProvider";
import type { StreamSessionSnapshot } from "../session/StreamSession";
import type { LayerKind } from "../session/types";
import { ControlButton } from "./ControlButton";
import { LayerMenu } from "./LayerMenu";
import { VolumeControl } from "./VolumeControl";

export interface ChatToggle {
  isOpen: boolean;
  unreadCount: number;
  onToggle(): void;
}

export interface CinemaModeToggle {
  isEnabled: boolean;
  onToggle(): void;
}

interface PlayerControlsProps {
  isVisible: boolean;
  snapshot: StreamSessionSnapshot;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  canSetVolume: boolean;
  isFullscreen: boolean;
  chat?: ChatToggle;
  cinemaMode?: CinemaModeToggle;
  onTogglePlay(): void;
  onToggleMute(): void;
  onVolumeChange(volume: number): void;
  onSelectLayer(kind: LayerKind, layer: string): void;
  onMenuOpenChange(isOpen: boolean): void;
  onHoverChange(isHovered: boolean): void;
  onTogglePictureInPicture?: () => void;
  onToggleFullscreen(): void;
}

function formatUnreadCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export function PlayerControls(props: PlayerControlsProps) {
  const { snapshot, chat, cinemaMode } = props;
  const { locale } = useContext(LocaleContext);
  const isOnline = snapshot.streamStatus?.isOnline ?? false;
  const chatLabel = chat?.isOpen ? locale.player.button_hide_chat : locale.player.button_show_chat;
  const viewers = snapshot.streamStatus?.viewers ?? 0;

  return (
    <div
      onPointerEnter={(event) => event.pointerType === "mouse" && props.onHoverChange(true)}
      onPointerLeave={() => props.onHoverChange(false)}
      className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 to-transparent px-1 pt-8 pb-1 transition-opacity duration-200 has-[:focus-visible]:pointer-events-auto has-[:focus-visible]:opacity-100 ${
        props.isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="flex items-center gap-0.5">
        <ControlButton
          label={props.isPlaying ? locale.player.button_pause : locale.player.button_play}
          onClick={props.onTogglePlay}
        >
          {props.isPlaying ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
        </ControlButton>

        <VolumeControl
          volume={props.volume}
          isMuted={props.isMuted}
          canSetVolume={props.canSetVolume}
          onToggleMute={props.onToggleMute}
          onVolumeChange={props.onVolumeChange}
        />

        <div className="ml-1 flex min-w-0 items-center gap-2 text-xs font-semibold">
          <span
            className={`rounded px-1.5 py-0.5 tracking-wide uppercase ${isOnline ? "bg-red-600 text-white" : "bg-gray-600 text-gray-100"}`}
          >
            {isOnline ? locale.player.status_live : locale.player.stream_status_offline}
          </span>
          <span
            className="hidden items-center gap-1 text-gray-100 @xs:flex"
            title={locale.stream_status.message_current_viewers}
          >
            <UsersIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">{locale.stream_status.message_current_viewers}:</span>
            {viewers}
          </span>
        </div>

        <div className="flex-1" />

        {snapshot.layers.video.length > 1 && (
          <LayerMenu
            label={locale.player.menu_quality}
            icon={<Cog6ToothIcon className="size-5" />}
            layers={snapshot.layers.video}
            selectedLayer={snapshot.selectedLayers.video}
            automaticLabel={locale.player.menu_option_auto}
            onSelect={(layer) => props.onSelectLayer("video", layer)}
            onOpenChange={props.onMenuOpenChange}
          />
        )}

        {snapshot.layers.audio.length > 1 && (
          <LayerMenu
            label={locale.player.menu_audio_track}
            icon={<MusicalNoteIcon className="size-5" />}
            layers={snapshot.layers.audio}
            selectedLayer={snapshot.selectedLayers.audio}
            automaticLabel={locale.player.menu_option_auto}
            onSelect={(layer) => props.onSelectLayer("audio", layer)}
            onOpenChange={props.onMenuOpenChange}
          />
        )}

        {chat && !props.isFullscreen && (
          <ControlButton
            label={
              chat.unreadCount > 0
                ? `${chatLabel} (${chat.unreadCount} ${locale.chat.unread_messages})`
                : chatLabel
            }
            onClick={chat.onToggle}
          >
            <ChatBubbleLeftRightIcon className="size-5" />
            {chat.unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 right-0.5 min-w-4 rounded-full bg-blue-600 px-1 text-[10px] leading-4 font-bold"
              >
                {formatUnreadCount(chat.unreadCount)}
              </span>
            )}
          </ControlButton>
        )}

        {cinemaMode && !props.isFullscreen && (
          <ControlButton
            label={
              cinemaMode.isEnabled
                ? locale.player_page.cinema_mode_disable
                : locale.player_page.cinema_mode_enable
            }
            onClick={cinemaMode.onToggle}
          >
            <RectangleGroupIcon className="size-5" />
          </ControlButton>
        )}

        {props.onTogglePictureInPicture && (
          <div className="hidden @sm:block">
            <ControlButton
              label={locale.player.button_picture_in_picture}
              onClick={props.onTogglePictureInPicture}
            >
              <Square2StackIcon className="size-5" />
            </ControlButton>
          </div>
        )}

        <ControlButton
          label={
            props.isFullscreen
              ? locale.player.button_fullscreen_exit
              : locale.player.button_fullscreen_enter
          }
          onClick={props.onToggleFullscreen}
        >
          {props.isFullscreen ? (
            <ArrowsPointingInIcon className="size-5" />
          ) : (
            <ArrowsPointingOutIcon className="size-5" />
          )}
        </ControlButton>
      </div>
    </div>
  );
}

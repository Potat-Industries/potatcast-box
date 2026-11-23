import { NoSymbolIcon, VideoCameraSlashIcon } from "@heroicons/react/24/outline";
import { useContext, type ReactNode } from "react";
import { LocaleContext } from "../../providers/LocaleProvider";

export type PlayerStatus = "loading" | "offline" | "reconnecting" | "rejected";

interface StatusOverlayProps {
  status: PlayerStatus;
  streamKey: string;
  onRetry(): void;
}

function Spinner() {
  return (
    <div
      aria-hidden="true"
      className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-white @md:size-12"
    />
  );
}

export function StatusOverlay({ status, streamKey, onRetry }: StatusOverlayProps) {
  const { locale } = useContext(LocaleContext);
  const iconClassName = "size-10 text-gray-300 @md:size-14";

  const content: Record<PlayerStatus, { icon: ReactNode; title: string; detail?: string }> = {
    loading: { icon: <Spinner />, title: locale.player.message_loading_video },
    reconnecting: { icon: <Spinner />, title: locale.player.message_reconnecting },
    offline: {
      icon: <VideoCameraSlashIcon className={iconClassName} />,
      title: `${streamKey} ${locale.player.message_is_not_online}`,
      detail: locale.player.message_offline_hint,
    },
    rejected: {
      icon: <NoSymbolIcon className={iconClassName} />,
      title: locale.player.message_rejected,
    },
  };

  const { icon, title, detail } = content[status];
  const canRetry = status === "reconnecting" || status === "rejected";

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/75 p-4 text-center"
    >
      {icon}
      <p className="max-w-md text-sm font-medium text-balance break-words @md:text-lg">{title}</p>
      {detail && (
        <p className="max-w-md text-xs text-balance text-gray-300 @md:text-sm">{detail}</p>
      )}
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="player-drag-cancel pointer-events-auto rounded-md bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
        >
          {locale.player.button_retry}
        </button>
      )}
    </div>
  );
}

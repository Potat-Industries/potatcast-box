import { UsersIcon } from "@heroicons/react/20/solid";
import { useContext, useEffect } from "react";
import { LocaleContext } from "../../providers/LocaleProvider";
import { StatusContext } from "../../providers/StatusProvider";
import { isSameStreamKey } from "../player/session/streamKey";

interface AvailableStreamsProps {
  onSelect(streamKey: string): void;
  showHeader?: boolean;
  /** Streams to leave out, for example the ones the viewer is already watching. */
  hiddenStreamKeys?: string[];
}

export default function AvailableStreams(props: AvailableStreamsProps) {
  const { onSelect, showHeader = true, hiddenStreamKeys = [] } = props;
  const { locale } = useContext(LocaleContext);
  const { activeStreamsStatus, refreshStatus, subscribe, unsubscribe } = useContext(StatusContext);

  useEffect(() => {
    subscribe();
    refreshStatus();

    return () => unsubscribe();
  }, [refreshStatus, subscribe, unsubscribe]);

  // The status API can be disabled by the server operator; without it there is nothing to list.
  if (activeStreamsStatus === undefined) {
    return null;
  }

  const liveStreams = activeStreamsStatus
    .filter((stream) => stream.videoTracks.length > 0)
    .filter((stream) => !hiddenStreamKeys.some((key) => isSameStreamKey(key, stream.streamKey)))
    .sort((left, right) => left.streamKey.localeCompare(right.streamKey));

  return (
    <section className="flex flex-col gap-2">
      {showHeader && (
        <div>
          <h2 className="text-2xl leading-tight font-light">{locale.available_streams.title}</h2>
          {liveStreams.length > 0 && (
            <p className="text-sm text-gray-300">{locale.available_streams.stream_join_message}</p>
          )}
        </div>
      )}

      {liveStreams.length === 0 && (
        <p className="py-2 text-center text-sm text-gray-300">
          {locale.available_streams.no_streams_message}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {liveStreams.map((stream) => (
          <li key={stream.streamKey}>
            <button
              type="button"
              onClick={() => onSelect(stream.streamKey)}
              className="flex w-full items-center gap-3 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-left hover:border-blue-500 hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold tracking-wide text-white uppercase">
                {locale.player.status_live}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{stream.streamKey}</span>
                {stream.motd && (
                  <span className="block truncate text-sm text-gray-300">{stream.motd}</span>
                )}
              </span>
              <span
                className="flex shrink-0 items-center gap-1 text-sm text-gray-300"
                title={locale.stream_status.message_current_viewers}
              >
                <UsersIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">{locale.stream_status.message_current_viewers}:</span>
                {stream.sessions?.length ?? 0}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

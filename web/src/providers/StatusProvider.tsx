import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface WhepSession {
  id: string;

  audioLayerCurrent: string;
  audioTimestamp: string;
  audioPacketsWritten: number;
  audioSequenceNumber: number;

  videoBitrate: number;
  videoLayerCurrent: string;
  videoTimestamp: string;
  videoPacketsWritten: number;
  videoSequenceNumber: number;

  sequenceNumber: number;
  timestamp: number;
}

export interface StatusResult {
  streamKey: string;
  motd: string;
  streamStart: Date;

  videoTracks: VideoTrack[];
  audioTracks: AudioTrack[];

  sessions: WhepSession[];
}

interface VideoTrack {
  rid: string;
  bitrate: number;
  packetsReceived: number;
  packetsDropped: number;
  lastKeyframe: string;
}

interface AudioTrack {
  rid: string;
  packetsReceived: number;
  packetsDropped: number;
}

const STATUS_POLL_INTERVAL_MS = 5000;
const STATUS_API_DISABLED = 503;

interface StatusContextValue {
  /** Undefined until the first response, and whenever the server has the status API disabled. */
  activeStreamsStatus: StatusResult[] | undefined;
  refreshStatus: () => void;
  /** Polling runs only while at least one component is subscribed. */
  subscribe: () => void;
  unsubscribe: () => void;
}

export const StatusContext = React.createContext<StatusContextValue>({
  activeStreamsStatus: undefined,
  refreshStatus: () => {},
  subscribe: () => {},
  unsubscribe: () => {},
});

export function StatusProvider(props: { children: React.ReactNode }) {
  const [activeStreamsStatus, setActiveStreamsStatus] = useState<StatusResult[] | undefined>();
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const subscriberCountRef = useRef(0);

  const refreshStatus = useCallback(() => {
    fetch("/api/status")
      .then(async (response) => {
        if (response.status === STATUS_API_DISABLED) {
          setActiveStreamsStatus(undefined);
        } else if (response.ok) {
          // Servers before the empty-list fix answer `null` when nothing is live.
          setActiveStreamsStatus(((await response.json()) as StatusResult[] | null) ?? []);
        }
      })
      .catch((error) => console.error("Failed to fetch stream status", error));
  }, []);

  const subscribe = useCallback(() => {
    subscriberCountRef.current += 1;
    pollTimerRef.current ??= setInterval(refreshStatus, STATUS_POLL_INTERVAL_MS);
  }, [refreshStatus]);

  const unsubscribe = useCallback(() => {
    subscriberCountRef.current -= 1;

    if (subscriberCountRef.current === 0) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = undefined;
    }
  }, []);

  useEffect(() => () => clearInterval(pollTimerRef.current), []);

  const value = useMemo<StatusContextValue>(
    () => ({ activeStreamsStatus, refreshStatus, subscribe, unsubscribe }),
    [activeStreamsStatus, refreshStatus, subscribe, unsubscribe],
  );

  return <StatusContext.Provider value={value}>{props.children}</StatusContext.Provider>;
}

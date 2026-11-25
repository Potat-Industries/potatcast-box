import { useState } from "react";
import Player from "./Player";
import { StreamSession } from "./session/StreamSession";
import { normalizeStreamKey } from "./session/streamKey";
import { useStreamSessionLifecycle } from "./session/useStreamSessionLifecycle";

interface StandalonePlayerProps {
  streamKey: string;
  startMuted?: boolean;
}

/** A self-contained player for pages that only need to show one stream, without chat. */
export function StandalonePlayer({ streamKey, startMuted = false }: StandalonePlayerProps) {
  const [session] = useState(() => new StreamSession(normalizeStreamKey(streamKey)));
  useStreamSessionLifecycle(session);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-md">
      <Player session={session} startMuted={startMuted} />
    </div>
  );
}

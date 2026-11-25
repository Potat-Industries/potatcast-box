import { useEffect } from "react";
import type { StreamSession } from "./StreamSession";

/** Keeps the session connected for as long as the calling component is mounted. */
export function useStreamSessionLifecycle(session: StreamSession): void {
  useEffect(() => {
    session.start();

    return () => session.stop();
  }, [session]);
}

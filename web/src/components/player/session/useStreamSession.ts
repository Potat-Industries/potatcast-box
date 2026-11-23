import { useSyncExternalStore } from "react";
import type { StreamSession, StreamSessionSnapshot } from "./StreamSession";

export function useStreamSession(session: StreamSession): StreamSessionSnapshot {
  return useSyncExternalStore(session.subscribe, session.getSnapshot);
}

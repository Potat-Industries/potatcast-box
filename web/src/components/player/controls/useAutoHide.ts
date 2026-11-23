import { useCallback, useEffect, useRef, useState } from "react";

const HIDE_DELAY_MS = 3_000;

/** Tracks whether the viewer recently interacted, so idle controls can fade out. */
export function useAutoHide() {
  const [isRevealed, setIsRevealed] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setIsRevealed(false);
  }, []);

  const reveal = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setIsRevealed(true);
    hideTimerRef.current = setTimeout(() => setIsRevealed(false), HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    hideTimerRef.current = setTimeout(() => setIsRevealed(false), HIDE_DELAY_MS);

    return () => clearTimeout(hideTimerRef.current);
  }, []);

  return { isRevealed, reveal, hide };
}

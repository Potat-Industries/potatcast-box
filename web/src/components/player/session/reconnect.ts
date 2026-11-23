const INITIAL_DELAY_MS = 1_000;
const MAX_DELAY_MS = 15_000;

/** Exponential backoff: 1s, 2s, 4s, 8s, then every 15s. */
export function reconnectDelayMs(failedAttempts: number): number {
  const exponent = Math.max(0, failedAttempts - 1);

  return Math.min(MAX_DELAY_MS, INITIAL_DELAY_MS * 2 ** exponent);
}

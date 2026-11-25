import toBase64Utf8 from "../../../utilities/base64";

const HEADER_SAFE_STREAM_KEY = /^[A-Za-z0-9_-]+$/;

/** The server treats spaces and underscores in stream keys as the same character. */
export function normalizeStreamKey(streamKey: string): string {
  return streamKey.trim().replace(/ /g, "_");
}

/**
 * Plain keys are sent as-is so they resolve exactly like the key a broadcaster typed into OBS.
 * Anything else is Base64 encoded, because HTTP headers cannot carry non-Latin-1 characters.
 */
export function streamKeyToBearerToken(streamKey: string): string {
  return HEADER_SAFE_STREAM_KEY.test(streamKey) ? streamKey : toBase64Utf8(streamKey);
}

export function isSameStreamKey(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

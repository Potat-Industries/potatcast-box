import { describe, expect, it } from "vitest";
import { isSameStreamKey, normalizeStreamKey, streamKeyToBearerToken } from "./streamKey";

describe("normalizeStreamKey", () => {
  it("replaces spaces with underscores and trims", () => {
    expect(normalizeStreamKey("  my stream key ")).toBe("my_stream_key");
  });
});

describe("streamKeyToBearerToken", () => {
  it("sends header-safe keys unchanged", () => {
    expect(streamKeyToBearerToken("Stream_Test-1")).toBe("Stream_Test-1");
  });

  it("Base64 encodes keys that a header cannot carry", () => {
    expect(streamKeyToBearerToken("strøm")).toBe("c3Ryw7ht");
    expect(streamKeyToBearerToken("a/b")).toBe("YS9i");
  });
});

describe("isSameStreamKey", () => {
  it("ignores case", () => {
    expect(isSameStreamKey("StreamTest", "streamtest")).toBe(true);
    expect(isSameStreamKey("StreamTest", "other")).toBe(false);
  });
});

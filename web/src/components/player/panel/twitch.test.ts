import { describe, expect, it } from "vitest";
import {
  getTwitchEmbedSupport,
  parseTwitchChannel,
  twitchChatEmbedUrl,
  twitchChatPopoutUrl,
} from "./twitch";

describe("parseTwitchChannel", () => {
  it.each([
    ["SomeChannel", "somechannel"],
    ["  some_channel  ", "some_channel"],
    ["@somechannel", "somechannel"],
    ["twitch.tv/SomeChannel", "somechannel"],
    ["https://www.twitch.tv/somechannel", "somechannel"],
    ["https://m.twitch.tv/somechannel/", "somechannel"],
    ["https://www.twitch.tv/somechannel?referrer=raid", "somechannel"],
    ["https://www.twitch.tv/popout/somechannel/chat?popout=", "somechannel"],
    ["https://www.twitch.tv/embed/somechannel/chat?parent=example.com", "somechannel"],
    ["https://www.twitch.tv/moderator/somechannel", "somechannel"],
  ])("reads %s as %s", (input, expected) => {
    expect(parseTwitchChannel(input)).toBe(expected);
  });

  it.each([
    "",
    "   ",
    "ab",
    "a".repeat(26),
    "has space",
    "bad-dash",
    "https://example.com/somechannel",
    "https://twitch.tv.evil.example/somechannel",
    "https://www.twitch.tv/",
    "https://www.twitch.tv/popout",
    "javascript:alert(1)",
    "some.channel",
  ])("rejects %j", (input) => {
    expect(parseTwitchChannel(input)).toBeNull();
  });
});

describe("getTwitchEmbedSupport", () => {
  it.each([
    [{ protocol: "https:", hostname: "stream.example.com" }, "supported"],
    [{ protocol: "http:", hostname: "localhost" }, "supported"],
    [{ protocol: "http:", hostname: "stream.example.com" }, "requires-https"],
    [{ protocol: "https:", hostname: "192.168.1.20" }, "requires-domain"],
    [{ protocol: "http:", hostname: "127.0.0.1" }, "requires-domain"],
    [{ protocol: "https:", hostname: "[::1]" }, "requires-domain"],
  ] as const)("%j is %s", (location, expected) => {
    expect(getTwitchEmbedSupport(location)).toBe(expected);
  });
});

describe("twitch URLs", () => {
  it("builds the embed URL with the parent host", () => {
    expect(twitchChatEmbedUrl("somechannel", "stream.example.com")).toBe(
      "https://www.twitch.tv/embed/somechannel/chat?parent=stream.example.com&darkpopout",
    );
  });

  it("builds the popout URL", () => {
    expect(twitchChatPopoutUrl("somechannel")).toBe(
      "https://www.twitch.tv/popout/somechannel/chat?popout=",
    );
  });
});

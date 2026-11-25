import { describe, expect, it } from "vitest";
import { linkify } from "./linkify";

describe("linkify", () => {
  it("returns plain text unchanged", () => {
    expect(linkify("hello world")).toEqual([{ kind: "text", text: "hello world" }]);
  });

  it("returns nothing for empty text", () => {
    expect(linkify("")).toEqual([]);
  });

  it("splits text around links", () => {
    expect(linkify("see https://example.com/a?b=1 and http://example.org now")).toEqual([
      { kind: "text", text: "see " },
      { kind: "link", text: "https://example.com/a?b=1" },
      { kind: "text", text: " and " },
      { kind: "link", text: "http://example.org" },
      { kind: "text", text: " now" },
    ]);
  });

  it("keeps sentence punctuation out of the link", () => {
    expect(linkify("go to https://example.com/page.")).toEqual([
      { kind: "text", text: "go to " },
      { kind: "link", text: "https://example.com/page" },
      { kind: "text", text: "." },
    ]);
    expect(linkify("(https://example.com)!")).toEqual([
      { kind: "text", text: "(" },
      { kind: "link", text: "https://example.com" },
      { kind: "text", text: ")!" },
    ]);
  });

  it("keeps balanced brackets inside the link", () => {
    expect(linkify("https://en.wikipedia.org/wiki/Rust_(programming_language)")).toEqual([
      { kind: "link", text: "https://en.wikipedia.org/wiki/Rust_(programming_language)" },
    ]);
  });

  it("does not link other schemes or bare text", () => {
    expect(linkify("javascript:alert(1) ftp://example.com example.com")).toEqual([
      { kind: "text", text: "javascript:alert(1) ftp://example.com example.com" },
    ]);
    expect(linkify("https://")).toEqual([{ kind: "text", text: "https://" }]);
  });
});

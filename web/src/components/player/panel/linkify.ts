export type TextSegment = { kind: "text"; text: string } | { kind: "link"; text: string };

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION = /[.,!?;:]+$/;

function trimTrailingPunctuation(url: string): string {
  let trimmed = url.replace(TRAILING_PUNCTUATION, "");

  // A closing bracket only belongs to the URL when the URL also opened it, as in Wikipedia links.
  if (trimmed.endsWith(")") && !trimmed.includes("(")) {
    trimmed = trimmed.slice(0, -1).replace(TRAILING_PUNCTUATION, "");
  }

  return trimmed;
}

function isHttpUrl(candidate: string): boolean {
  try {
    const { protocol } = new URL(candidate);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** Splits chat text into plain text and http(s) links. Nothing here is ever rendered as HTML. */
export function linkify(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;

  const pushText = (value: string) => {
    if (value) {
      segments.push({ kind: "text", text: value });
    }
  };

  for (const match of text.matchAll(URL_PATTERN)) {
    const url = trimTrailingPunctuation(match[0]);
    if (!isHttpUrl(url)) {
      continue;
    }

    pushText(text.slice(cursor, match.index));
    segments.push({ kind: "link", text: url });
    cursor = match.index + url.length;
  }

  pushText(text.slice(cursor));

  return segments;
}

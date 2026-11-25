const TWITCH_LOGIN = /^[a-z0-9_]{3,25}$/;
const TWITCH_HOSTS = new Set(["twitch.tv", "www.twitch.tv", "m.twitch.tv"]);
const PATHS_WITH_CHANNEL_SECOND = new Set(["popout", "embed", "moderator"]);
const IPV4_ADDRESS = /^\d{1,3}(\.\d{1,3}){3}$/;

export type TwitchEmbedSupport = "supported" | "requires-https" | "requires-domain";

function channelFromUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }

  if (!TWITCH_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const [first, second] = url.pathname.split("/").filter(Boolean);

  return (PATHS_WITH_CHANNEL_SECOND.has(first) ? second : first) ?? null;
}

/** Accepts a channel name, an @name, or any twitch.tv channel, popout or embed link. */
export function parseTwitchChannel(input: string): string | null {
  const trimmed = input.trim();
  const looksLikeUrl = /[./]/.test(trimmed);
  const candidate = looksLikeUrl ? channelFromUrl(trimmed) : trimmed.replace(/^[@#]/, "");
  const login = candidate?.toLowerCase() ?? "";

  return TWITCH_LOGIN.test(login) ? login : null;
}

/**
 * Twitch refuses to render inside a frame unless the embedding page is served over HTTPS from a
 * domain name that matches the `parent` parameter. `localhost` is the one documented exception.
 */
export function getTwitchEmbedSupport(location: {
  protocol: string;
  hostname: string;
}): TwitchEmbedSupport {
  if (location.hostname === "localhost") {
    return "supported";
  }

  const isIpAddress = IPV4_ADDRESS.test(location.hostname) || location.hostname.includes(":");
  if (isIpAddress) {
    return "requires-domain";
  }

  return location.protocol === "https:" ? "supported" : "requires-https";
}

export function twitchChatEmbedUrl(channel: string, parentHostname: string): string {
  return `https://www.twitch.tv/embed/${channel}/chat?parent=${encodeURIComponent(parentHostname)}&darkpopout`;
}

export function twitchChatPopoutUrl(channel: string): string {
  return `https://www.twitch.tv/popout/${channel}/chat?popout=`;
}

export function twitchChannelStorageKey(streamKey: string): string {
  return `twitch-channel:${streamKey.toLowerCase()}`;
}

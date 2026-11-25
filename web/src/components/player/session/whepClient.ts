import { parseLinkHeader } from "@web3-storage/parse-link-header";
import { streamKeyToBearerToken } from "./streamKey";
import type { AvailableLayers, LayerKind, StreamStatus } from "./types";

export const CHAT_DATA_CHANNEL_LABEL = "bb-chat-v1";
export const REACTION_DATA_CHANNEL_LABEL = "bb-data-v1";

const WHEP_ENDPOINT = "/api/whep";
const LAYER_LINK_REL = "urn:ietf:params:whep:ext:core:layer";
const EVENTS_LINK_REL = "urn:ietf:params:whep:ext:core:server-sent-events";

const MEDIA_ID_BY_LAYER_KIND: Record<LayerKind, string> = { video: "1", audio: "2" };

interface LayersEventPayload {
  [mediaId: string]: { layers: { encodingId: string }[] } | undefined;
}

export interface WhepDataChannels {
  chat: RTCDataChannel;
  reactions: RTCDataChannel;
}

export interface WhepConnectionEvents {
  /** Called before negotiation starts so no early message can arrive without a listener. */
  onDataChannels(channels: WhepDataChannels): void;
  onMediaStream(stream: MediaStream): void;
  onStreamStatus(status: StreamStatus): void;
  onLayers(layers: AvailableLayers): void;
  onConnectionStateChange(state: RTCPeerConnectionState): void;
}

export interface WhepConnection {
  selectLayer(kind: LayerKind, encodingId: string): Promise<void>;
  close(): void;
}

export class WhepRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`WHEP request failed with status ${status}`);
    this.name = "WhepRequestError";
    this.status = status;
  }

  /** The server refused this viewer, so retrying the same request cannot succeed. */
  get isRejection(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

// The server lists layers in a different order on every event, so they are sorted to keep the
// quality menu from reshuffling and to let unchanged lists be recognised as unchanged.
function parseLayerIds(payload: LayersEventPayload, kind: LayerKind): string[] {
  const layerIds = payload[MEDIA_ID_BY_LAYER_KIND[kind]]?.layers.map((layer) => layer.encodingId);

  return layerIds?.sort() ?? [];
}

function requireLinkUrl(linkHeader: string | null, rel: string): string {
  const url = parseLinkHeader(linkHeader)?.[rel]?.url;
  if (!url) {
    throw new Error(`WHEP response is missing the "${rel}" link`);
  }

  return url;
}

export async function connectWhep(
  streamKey: string,
  events: WhepConnectionEvents,
  signal: AbortSignal,
): Promise<WhepConnection> {
  const peerConnection = new RTCPeerConnection();
  let eventSource: EventSource | undefined;

  const close = () => {
    eventSource?.close();
    peerConnection.close();
  };

  try {
    events.onDataChannels({
      chat: peerConnection.createDataChannel(CHAT_DATA_CHANNEL_LABEL),
      reactions: peerConnection.createDataChannel(REACTION_DATA_CHANNEL_LABEL),
    });

    peerConnection.addTransceiver("audio", { direction: "recvonly" });
    peerConnection.addTransceiver("video", { direction: "recvonly" });

    const mediaStream = new MediaStream();
    peerConnection.addEventListener("track", (event) => {
      mediaStream.addTrack(event.track);
      event.track.addEventListener("ended", () => mediaStream.removeTrack(event.track));
    });

    peerConnection.addEventListener("connectionstatechange", () => {
      events.onConnectionStateChange(peerConnection.connectionState);
    });

    const offer = await peerConnection.createOffer();
    // Opus is negotiated as mono unless the receiver explicitly asks for stereo.
    offer.sdp = offer.sdp?.replace("useinbandfec=1", "useinbandfec=1;stereo=1");
    await peerConnection.setLocalDescription(offer);

    const response = await fetch(WHEP_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${streamKeyToBearerToken(streamKey)}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
      signal,
    });

    if (!response.ok) {
      throw new WhepRequestError(response.status);
    }

    const linkHeader = response.headers.get("Link");
    const layerEndpoint = requireLinkUrl(linkHeader, LAYER_LINK_REL);

    eventSource = new EventSource(requireLinkUrl(linkHeader, EVENTS_LINK_REL));
    eventSource.addEventListener("status", (event: MessageEvent<string>) => {
      events.onStreamStatus(JSON.parse(event.data) as StreamStatus);
    });
    eventSource.addEventListener("layers", (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as LayersEventPayload;
      events.onLayers({
        video: parseLayerIds(payload, "video"),
        audio: parseLayerIds(payload, "audio"),
      });
    });

    await peerConnection.setRemoteDescription({ type: "answer", sdp: await response.text() });
    signal.throwIfAborted();

    // Every track has been added by the time the answer is applied. Handing the stream over
    // earlier would let playback start on audio or video alone, which makes the browser's
    // autoplay decision depend on which track happened to arrive first.
    events.onMediaStream(mediaStream);

    return {
      close,
      selectLayer: async (kind, encodingId) => {
        const layerResponse = await fetch(layerEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId: MEDIA_ID_BY_LAYER_KIND[kind], encodingId }),
        });

        if (!layerResponse.ok) {
          throw new Error(`Layer change failed with status ${layerResponse.status}`);
        }
      },
    };
  } catch (error) {
    close();
    throw error;
  }
}

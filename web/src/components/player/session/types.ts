export interface StreamStatus {
  streamKey: string;
  motd: string;
  viewers: number;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  ts: number;
  text: string;
  displayName: string;
}

export type ChatStatus = "connecting" | "connected" | "disconnected";

export type LayerKind = "video" | "audio";

export interface AvailableLayers {
  video: string[];
  audio: string[];
}

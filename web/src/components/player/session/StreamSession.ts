import { ChatChannel, ChatSendError } from "./chatChannel";
import { reconnectDelayMs } from "./reconnect";
import type { AvailableLayers, ChatMessage, ChatStatus, LayerKind, StreamStatus } from "./types";
import {
  connectWhep,
  WhepRequestError,
  type WhepConnection,
  type WhepConnectionEvents,
  type WhepDataChannels,
} from "./whepClient";

const MAX_CHAT_MESSAGES = 1_000;
const REACTION_MESSAGE = JSON.stringify({ type: "reaction" });

/**
 * - `connecting`: first attempt, nothing has failed yet
 * - `connected`: media can flow; whether the broadcaster is live is in `streamStatus`
 * - `reconnecting`: the connection failed and is retried automatically
 * - `rejected`: the server refused this viewer; there is no retry timer, only `retryNow`
 *   (the retry button, or the browser coming back online) tries again
 */
export type ConnectionPhase = "connecting" | "connected" | "reconnecting" | "rejected";

export interface StreamSessionSnapshot {
  phase: ConnectionPhase;
  streamStatus: StreamStatus | null;
  mediaStream: MediaStream | null;
  layers: AvailableLayers;
  selectedLayers: Record<LayerKind, string | null>;
  chatStatus: ChatStatus;
  chatMessages: ChatMessage[];
  /** The last message that was already in the chat when this viewer first connected, if any. */
  chatBacklogEndId: string | null;
  chatError: string | null;
  canSendReaction: boolean;
}

type Connect = typeof connectWhep;

const NO_LAYERS: AvailableLayers = { video: [], audio: [] };
const NO_SELECTED_LAYERS: Record<LayerKind, string | null> = { video: null, audio: null };

const DISCONNECTED_STATE = {
  chatError: null,
  mediaStream: null,
  streamStatus: null,
  layers: NO_LAYERS,
  selectedLayers: NO_SELECTED_LAYERS,
  chatStatus: "disconnected",
  canSendReaction: false,
} satisfies Partial<StreamSessionSnapshot>;

function isSameStatus(left: StreamStatus | null, right: StreamStatus): boolean {
  return (
    left !== null &&
    left.isOnline === right.isOnline &&
    left.viewers === right.viewers &&
    left.motd === right.motd
  );
}

function isSameLayers(left: AvailableLayers, right: AvailableLayers): boolean {
  return left.video.join() === right.video.join() && left.audio.join() === right.audio.join();
}

function appendNewMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const knownIds = new Set(current.map((message) => message.id));
  const newMessages = incoming.filter((message) => !knownIds.has(message.id));
  if (newMessages.length === 0) {
    return current;
  }

  return [...current, ...newMessages].slice(-MAX_CHAT_MESSAGES);
}

/**
 * Owns everything that belongs to watching one stream: the WHEP connection and its automatic
 * reconnects, stream status, simulcast layers, chat and reactions. It lives outside React so the
 * player tile and the chat panel can both read it, and so it survives layout changes that remount
 * either of them.
 */
export class StreamSession {
  private snapshot: StreamSessionSnapshot = {
    phase: "connecting",
    chatMessages: [],
    chatBacklogEndId: null,
    ...DISCONNECTED_STATE,
  };

  private readonly listeners = new Set<() => void>();
  private readonly reactionListeners = new Set<() => void>();

  private isStarted = false;
  private chatConnectionCount = 0;
  private failedAttempts = 0;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private abortController: AbortController | null = null;
  private connection: WhepConnection | null = null;
  private chatChannel: ChatChannel | null = null;
  private reactionChannel: RTCDataChannel | null = null;

  constructor(
    readonly streamKey: string,
    private readonly connect: Connect = connectWhep,
  ) {}

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = () => this.snapshot;

  onReaction(listener: () => void): () => void {
    this.reactionListeners.add(listener);
    return () => {
      this.reactionListeners.delete(listener);
    };
  }

  start(): void {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;
    window.addEventListener("online", this.retryNow);
    window.addEventListener("pagehide", this.handlePageHide);
    window.addEventListener("pageshow", this.handlePageShow);
    void this.openConnection();
  }

  stop(): void {
    if (!this.isStarted) {
      return;
    }

    this.isStarted = false;
    window.removeEventListener("online", this.retryNow);
    window.removeEventListener("pagehide", this.handlePageHide);
    window.removeEventListener("pageshow", this.handlePageShow);
    this.failedAttempts = 0;
    this.closeConnection();
    this.update({ phase: "connecting" });
  }

  readonly retryNow = () => {
    const { phase } = this.snapshot;
    if (this.isStarted && (phase === "reconnecting" || phase === "rejected")) {
      void this.openConnection();
    }
  };

  async selectLayer(kind: LayerKind, encodingId: string): Promise<void> {
    const connection = this.connection;
    if (!connection) {
      return;
    }

    const previousSelection = this.snapshot.selectedLayers;
    this.update({ selectedLayers: { ...previousSelection, [kind]: encodingId } });

    try {
      await connection.selectLayer(kind, encodingId);
    } catch (error) {
      console.error("Failed to change layer", error);
      if (this.connection === connection) {
        this.update({ selectedLayers: previousSelection });
      }
    }
  }

  sendChatMessage(text: string, displayName: string): Promise<void> {
    if (!this.chatChannel) {
      return Promise.reject(new ChatSendError("not-connected"));
    }

    this.update({ chatError: null });
    return this.chatChannel.send(text, displayName);
  }

  sendReaction(): void {
    if (this.reactionChannel?.readyState !== "open") {
      return;
    }

    try {
      this.reactionChannel.send(REACTION_MESSAGE);
      this.emitReaction();
    } catch (error) {
      console.error("Failed to send reaction", error);
    }
  }

  private async openConnection(): Promise<void> {
    this.closeConnection();

    const abortController = new AbortController();
    this.abortController = abortController;
    this.update({ phase: this.failedAttempts === 0 ? "connecting" : "reconnecting" });

    const isCurrent = () => this.abortController === abortController;
    const events: WhepConnectionEvents = {
      onDataChannels: (channels) => isCurrent() && this.attachDataChannels(channels),
      onMediaStream: (mediaStream) => isCurrent() && this.update({ mediaStream }),
      onLayers: (layers) => {
        if (isCurrent() && !isSameLayers(this.snapshot.layers, layers)) {
          this.update({ layers });
        }
      },
      onStreamStatus: (streamStatus) => {
        if (isCurrent() && !isSameStatus(this.snapshot.streamStatus, streamStatus)) {
          this.update({ streamStatus });
        }
      },
      onConnectionStateChange: (state) => {
        if (!isCurrent()) {
          return;
        }

        if (state === "connected") {
          this.failedAttempts = 0;
          this.update({ phase: "connected" });
        } else if (state === "failed" || state === "closed") {
          this.scheduleReconnect();
        }
      },
    };

    try {
      const connection = await this.connect(this.streamKey, events, abortController.signal);
      if (isCurrent()) {
        this.connection = connection;
      } else {
        connection.close();
      }
    } catch (error) {
      if (!isCurrent()) {
        return;
      }

      if (error instanceof WhepRequestError && error.isRejection) {
        this.closeConnection();
        this.update({ phase: "rejected" });
        return;
      }

      console.error(`Failed to connect to stream "${this.streamKey}"`, error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.closeConnection();
    this.failedAttempts += 1;
    this.update({ phase: "reconnecting" });
    this.retryTimer = setTimeout(
      () => void this.openConnection(),
      reconnectDelayMs(this.failedAttempts),
    );
  }

  private closeConnection(): void {
    clearTimeout(this.retryTimer);
    this.retryTimer = undefined;

    this.abortController?.abort();
    this.abortController = null;

    this.chatChannel?.dispose();
    this.chatChannel = null;

    if (this.reactionChannel) {
      this.reactionChannel.removeEventListener("open", this.handleReactionChannelState);
      this.reactionChannel.removeEventListener("close", this.handleReactionChannelState);
      this.reactionChannel.removeEventListener("message", this.handleReactionMessage);
      this.reactionChannel = null;
    }

    this.connection?.close();
    this.connection = null;

    this.update(DISCONNECTED_STATE);
  }

  private attachDataChannels(channels: WhepDataChannels): void {
    this.chatChannel = new ChatChannel(channels.chat, {
      onStatus: (chatStatus) => {
        if (chatStatus === "connected") {
          this.chatConnectionCount += 1;
        }

        this.update({ chatStatus });
      },
      onError: (chatError) => this.update({ chatError }),
      onMessage: (message) => this.appendChatMessages([message]),
      onHistory: (messages) => {
        // History replayed after a reconnect holds messages this viewer missed, so only the replay
        // on the first chat connection counts as backlog.
        const isFirstConnection = this.chatConnectionCount <= 1;
        this.appendChatMessages(messages);

        if (isFirstConnection && messages.length > 0) {
          this.update({ chatBacklogEndId: messages[messages.length - 1].id });
        }
      },
    });

    this.reactionChannel = channels.reactions;
    this.reactionChannel.addEventListener("open", this.handleReactionChannelState);
    this.reactionChannel.addEventListener("close", this.handleReactionChannelState);
    this.reactionChannel.addEventListener("message", this.handleReactionMessage);

    this.update({ chatStatus: "connecting" });
  }

  private appendChatMessages(messages: ChatMessage[]): void {
    this.update({ chatMessages: appendNewMessages(this.snapshot.chatMessages, messages) });
  }

  private readonly handleReactionChannelState = () => {
    this.update({ canSendReaction: this.reactionChannel?.readyState === "open" });
  };

  // The reaction channel is a raw relay shared with third-party widgets, so unknown payloads are expected.
  private readonly handleReactionMessage = (event: MessageEvent) => {
    if (typeof event.data !== "string") {
      return;
    }

    try {
      if ((JSON.parse(event.data) as { type?: unknown }).type === "reaction") {
        this.emitReaction();
      }
    } catch {
      return;
    }
  };

  private readonly handlePageHide = () => {
    this.closeConnection();
  };

  private readonly handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted && this.isStarted) {
      void this.openConnection();
    }
  };

  private emitReaction(): void {
    this.reactionListeners.forEach((listener) => listener());
  }

  private update(patch: Partial<StreamSessionSnapshot>): void {
    const hasChange = (Object.keys(patch) as (keyof StreamSessionSnapshot)[]).some(
      (key) => this.snapshot[key] !== patch[key],
    );
    if (!hasChange) {
      return;
    }

    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
}

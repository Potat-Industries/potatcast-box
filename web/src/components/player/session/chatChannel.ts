import type { ChatMessage, ChatStatus } from "./types";

const ACK_TIMEOUT_MS = 10_000;

interface ChatSendPayload {
  type: "chat.send";
  clientMsgId: string;
  text: string;
  displayName: string;
}

type ChatServerPayload =
  | { type: "chat.connected" }
  | { type: "chat.history"; events: { type: string; message: ChatMessage }[] }
  | { type: "chat.message"; eventId: number; message: ChatMessage }
  | { type: "chat.ack"; clientMsgId: string }
  | { type: "chat.error"; error: string; clientMsgId?: string };

export type ChatSendFailureReason = "not-connected" | "timeout" | "rejected";

export class ChatSendError extends Error {
  readonly reason: ChatSendFailureReason;

  constructor(reason: ChatSendFailureReason, serverMessage?: string) {
    super(serverMessage ?? reason);
    this.name = "ChatSendError";
    this.reason = reason;
  }
}

export interface ChatChannelEvents {
  /** Messages replayed from before this viewer connected. */
  onHistory(messages: ChatMessage[]): void;
  onMessage(message: ChatMessage): void;
  onStatus(status: ChatStatus): void;
  /** A server error that is not tied to a message this client sent. */
  onError(error: string): void;
}

interface PendingSend {
  resolve(): void;
  reject(error: ChatSendError): void;
  timeout: ReturnType<typeof setTimeout>;
}

function createClientMessageId(): string {
  // randomUUID only exists in secure contexts; plain-HTTP LAN deployments need the fallback.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Speaks the `bb-chat-v1` protocol over one data channel. See internal/chat/CONNECTING.md. */
export class ChatChannel {
  private readonly pendingSends = new Map<string, PendingSend>();
  private isDisposed = false;

  constructor(
    private readonly channel: RTCDataChannel,
    private readonly events: ChatChannelEvents,
  ) {
    channel.addEventListener("message", this.handleMessage);
    channel.addEventListener("close", this.handleClose);
    channel.addEventListener("error", this.handleClose);
  }

  send(text: string, displayName: string): Promise<void> {
    if (this.isDisposed || this.channel.readyState !== "open") {
      return Promise.reject(new ChatSendError("not-connected"));
    }

    const payload: ChatSendPayload = {
      type: "chat.send",
      clientMsgId: createClientMessageId(),
      text,
      displayName,
    };

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => this.settle(payload.clientMsgId, new ChatSendError("timeout")),
        ACK_TIMEOUT_MS,
      );
      this.pendingSends.set(payload.clientMsgId, { resolve, reject, timeout });

      try {
        this.channel.send(JSON.stringify(payload));
      } catch {
        this.settle(payload.clientMsgId, new ChatSendError("not-connected"));
      }
    });
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
    this.channel.removeEventListener("message", this.handleMessage);
    this.channel.removeEventListener("close", this.handleClose);
    this.channel.removeEventListener("error", this.handleClose);
    this.rejectAllPending();
  }

  private readonly handleMessage = (event: MessageEvent) => {
    let payload: ChatServerPayload;
    try {
      payload = JSON.parse(String(event.data)) as ChatServerPayload;
    } catch {
      return;
    }

    switch (payload.type) {
      case "chat.connected":
        this.events.onStatus("connected");
        break;
      case "chat.history":
        this.events.onHistory(
          payload.events.filter((entry) => entry.type === "message").map((entry) => entry.message),
        );
        break;
      case "chat.message":
        this.events.onMessage(payload.message);
        break;
      case "chat.ack":
        this.settle(payload.clientMsgId);
        break;
      case "chat.error":
        if (payload.clientMsgId && this.pendingSends.has(payload.clientMsgId)) {
          this.settle(payload.clientMsgId, new ChatSendError("rejected", payload.error));
        } else {
          this.events.onError(payload.error);
        }
        break;
    }
  };

  private readonly handleClose = () => {
    this.events.onStatus("disconnected");
    this.rejectAllPending();
  };

  private settle(clientMsgId: string, error?: ChatSendError): void {
    const pendingSend = this.pendingSends.get(clientMsgId);
    if (!pendingSend) {
      return;
    }

    clearTimeout(pendingSend.timeout);
    this.pendingSends.delete(clientMsgId);

    if (error) {
      pendingSend.reject(error);
    } else {
      pendingSend.resolve();
    }
  }

  private rejectAllPending(): void {
    for (const clientMsgId of [...this.pendingSends.keys()]) {
      this.settle(clientMsgId, new ChatSendError("not-connected"));
    }
  }
}

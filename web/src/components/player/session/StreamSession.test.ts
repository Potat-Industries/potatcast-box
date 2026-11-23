import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StreamSession } from "./StreamSession";
import { FakeDataChannel } from "./testing";
import type { ChatMessage } from "./types";
import {
  WhepRequestError,
  type WhepConnection,
  type WhepConnectionEvents,
  type connectWhep,
} from "./whepClient";

interface Attempt {
  events: WhepConnectionEvents;
  signal: AbortSignal;
  chat: FakeDataChannel;
  reactions: FakeDataChannel;
  connection: { close: ReturnType<typeof vi.fn>; selectLayer: ReturnType<typeof vi.fn> };
  succeed(): Promise<void>;
  fail(error: unknown): Promise<void>;
}

const startedSessions: StreamSession[] = [];

function createHarness() {
  const attempts: Attempt[] = [];

  const connect: typeof connectWhep = (_streamKey, events, signal) => {
    const chat = new FakeDataChannel();
    const reactions = new FakeDataChannel();
    events.onDataChannels({ chat: chat.asDataChannel(), reactions: reactions.asDataChannel() });

    const connection = { close: vi.fn(), selectLayer: vi.fn().mockResolvedValue(undefined) };

    return new Promise<WhepConnection>((resolve, reject) => {
      attempts.push({
        events,
        signal,
        chat,
        reactions,
        connection,
        succeed: async () => {
          resolve(connection);
          await Promise.resolve();
        },
        fail: async (error) => {
          reject(error);
          await Promise.resolve();
        },
      });
    });
  };

  const session = new StreamSession("test", connect);
  startedSessions.push(session);

  return { session, attempts, latest: () => attempts[attempts.length - 1] };
}

async function connectSuccessfully(harness: ReturnType<typeof createHarness>) {
  const attempt = harness.latest();
  await attempt.succeed();
  attempt.events.onConnectionStateChange("connected");

  return attempt;
}

const message = (id: string): ChatMessage => ({ id, ts: 1, text: id, displayName: "alice" });

describe("StreamSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    startedSessions.splice(0).forEach((session) => session.stop());
    vi.useRealTimers();
  });

  it("moves from connecting to connected", async () => {
    const harness = createHarness();
    harness.session.start();
    expect(harness.session.getSnapshot().phase).toBe("connecting");

    await connectSuccessfully(harness);

    expect(harness.session.getSnapshot().phase).toBe("connected");
  });

  it("starts only one connection when started twice", () => {
    const harness = createHarness();

    harness.session.start();
    harness.session.start();

    expect(harness.attempts).toHaveLength(1);
  });

  it("retries with backoff when connecting fails", async () => {
    const harness = createHarness();
    harness.session.start();

    await harness.latest().fail(new Error("network down"));
    expect(harness.session.getSnapshot().phase).toBe("reconnecting");
    expect(harness.attempts).toHaveLength(1);

    vi.advanceTimersByTime(1_000);
    expect(harness.attempts).toHaveLength(2);

    await harness.latest().fail(new Error("network down"));
    vi.advanceTimersByTime(1_999);
    expect(harness.attempts).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(harness.attempts).toHaveLength(3);
  });

  it("reconnects and clears media when an established connection fails", async () => {
    const harness = createHarness();
    harness.session.start();
    const attempt = await connectSuccessfully(harness);
    attempt.events.onMediaStream({} as MediaStream);
    expect(harness.session.getSnapshot().mediaStream).not.toBeNull();

    attempt.events.onConnectionStateChange("failed");

    expect(harness.session.getSnapshot()).toMatchObject({
      phase: "reconnecting",
      mediaStream: null,
    });
    expect(attempt.connection.close).toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);
    expect(harness.attempts).toHaveLength(2);
  });

  it("resets the backoff after a successful connection", async () => {
    const harness = createHarness();
    harness.session.start();
    await harness.latest().fail(new Error("network down"));
    vi.advanceTimersByTime(1_000);
    await harness.latest().fail(new Error("network down"));
    vi.advanceTimersByTime(2_000);

    const attempt = await connectSuccessfully(harness);
    attempt.events.onConnectionStateChange("failed");

    vi.advanceTimersByTime(1_000);
    expect(harness.attempts).toHaveLength(4);
  });

  it("stops retrying when the server rejects the viewer", async () => {
    const harness = createHarness();
    harness.session.start();

    await harness.latest().fail(new WhepRequestError(401));
    vi.advanceTimersByTime(60_000);

    expect(harness.session.getSnapshot().phase).toBe("rejected");
    expect(harness.attempts).toHaveLength(1);

    harness.session.retryNow();
    expect(harness.attempts).toHaveLength(2);
  });

  it("retries immediately on request and when the browser comes back online", async () => {
    const harness = createHarness();
    harness.session.start();
    await harness.latest().fail(new Error("network down"));

    harness.session.retryNow();
    expect(harness.attempts).toHaveLength(2);

    await harness.latest().fail(new Error("network down"));
    window.dispatchEvent(new Event("online"));
    expect(harness.attempts).toHaveLength(3);
  });

  it("ignores events from a connection it has already replaced", async () => {
    const harness = createHarness();
    harness.session.start();
    const firstAttempt = harness.latest();
    await firstAttempt.fail(new Error("network down"));
    vi.advanceTimersByTime(1_000);

    firstAttempt.events.onConnectionStateChange("connected");
    firstAttempt.events.onMediaStream({} as MediaStream);

    expect(harness.session.getSnapshot()).toMatchObject({
      phase: "reconnecting",
      mediaStream: null,
    });
  });

  it("aborts the connection attempt and stops retrying when stopped", async () => {
    const harness = createHarness();
    harness.session.start();
    const attempt = harness.latest();

    harness.session.stop();
    expect(attempt.signal.aborted).toBe(true);

    await attempt.succeed();
    expect(attempt.connection.close).toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    expect(harness.attempts).toHaveLength(1);
  });

  it("can be started again after being stopped", async () => {
    const harness = createHarness();
    harness.session.start();
    harness.session.stop();
    harness.session.start();

    await connectSuccessfully(harness);

    expect(harness.attempts).toHaveLength(2);
    expect(harness.session.getSnapshot().phase).toBe("connected");
  });

  it("publishes stream status and layers", async () => {
    const harness = createHarness();
    harness.session.start();
    const attempt = await connectSuccessfully(harness);

    attempt.events.onStreamStatus({ streamKey: "test", motd: "hi", viewers: 3, isOnline: true });
    attempt.events.onLayers({ video: ["high", "low"], audio: [] });

    expect(harness.session.getSnapshot()).toMatchObject({
      streamStatus: { viewers: 3, isOnline: true },
      layers: { video: ["high", "low"] },
    });
  });

  it("does not notify subscribers when the status is unchanged", async () => {
    const harness = createHarness();
    harness.session.start();
    const attempt = await connectSuccessfully(harness);
    const status = { streamKey: "test", motd: "hi", viewers: 3, isOnline: true };
    attempt.events.onStreamStatus(status);

    const listener = vi.fn();
    harness.session.subscribe(listener);
    attempt.events.onStreamStatus({ ...status });

    expect(listener).not.toHaveBeenCalled();
  });

  it("selects a layer optimistically and reverts when the server refuses", async () => {
    const harness = createHarness();
    harness.session.start();
    const attempt = await connectSuccessfully(harness);

    await harness.session.selectLayer("video", "low");
    expect(attempt.connection.selectLayer).toHaveBeenCalledWith("video", "low");
    expect(harness.session.getSnapshot().selectedLayers.video).toBe("low");

    attempt.connection.selectLayer.mockRejectedValueOnce(new Error("nope"));
    await harness.session.selectLayer("video", "high");
    expect(harness.session.getSnapshot().selectedLayers.video).toBe("low");
  });

  it("keeps chat messages across reconnects without duplicating replayed history", async () => {
    const harness = createHarness();
    harness.session.start();
    const firstAttempt = await connectSuccessfully(harness);
    firstAttempt.chat.receive({ type: "chat.connected" });
    firstAttempt.chat.receive({
      type: "chat.history",
      events: [{ type: "message", message: message("1") }],
    });
    firstAttempt.chat.receive({ type: "chat.message", eventId: 2, message: message("2") });

    firstAttempt.events.onConnectionStateChange("failed");
    vi.advanceTimersByTime(1_000);
    const secondAttempt = await connectSuccessfully(harness);
    secondAttempt.chat.receive({ type: "chat.connected" });
    secondAttempt.chat.receive({
      type: "chat.history",
      events: ["1", "2", "3"].map((id) => ({ type: "message", message: message(id) })),
    });

    expect(harness.session.getSnapshot().chatMessages.map(({ id }) => id)).toEqual(["1", "2", "3"]);
    expect(harness.session.getSnapshot().chatBacklogEndId).toBe("1");
  });

  it("counts history as missed messages, not backlog, after a reconnect to an empty chat", async () => {
    const harness = createHarness();
    harness.session.start();
    const firstAttempt = await connectSuccessfully(harness);
    firstAttempt.chat.receive({ type: "chat.connected" });

    firstAttempt.events.onConnectionStateChange("failed");
    vi.advanceTimersByTime(1_000);
    const secondAttempt = await connectSuccessfully(harness);
    secondAttempt.chat.receive({ type: "chat.connected" });
    secondAttempt.chat.receive({
      type: "chat.history",
      events: [{ type: "message", message: message("1") }],
    });

    expect(harness.session.getSnapshot().chatBacklogEndId).toBeNull();
  });

  it("clears a chat error when the connection is replaced", async () => {
    const harness = createHarness();
    harness.session.start();
    const attempt = await connectSuccessfully(harness);
    attempt.chat.receive({ type: "chat.error", error: "room not found" });
    expect(harness.session.getSnapshot().chatError).toBe("room not found");

    attempt.events.onConnectionStateChange("failed");

    expect(harness.session.getSnapshot().chatError).toBeNull();
  });

  it("does not notify subscribers when the layers are unchanged", async () => {
    const harness = createHarness();
    harness.session.start();
    const attempt = await connectSuccessfully(harness);
    attempt.events.onLayers({ video: ["high", "low"], audio: [] });

    const listener = vi.fn();
    harness.session.subscribe(listener);
    attempt.events.onLayers({ video: ["high", "low"], audio: [] });

    expect(listener).not.toHaveBeenCalled();
  });

  it("has no chat backlog when the first messages arrive live", async () => {
    const harness = createHarness();
    harness.session.start();
    const attempt = await connectSuccessfully(harness);

    attempt.chat.receive({ type: "chat.message", eventId: 1, message: message("1") });

    expect(harness.session.getSnapshot().chatBacklogEndId).toBeNull();
  });

  it("tracks chat status and sends messages through the chat channel", async () => {
    const harness = createHarness();
    harness.session.start();
    const attempt = await connectSuccessfully(harness);
    expect(harness.session.getSnapshot().chatStatus).toBe("connecting");

    attempt.chat.open();
    attempt.chat.receive({ type: "chat.connected" });
    expect(harness.session.getSnapshot().chatStatus).toBe("connected");

    const sending = harness.session.sendChatMessage("hello", "alice");
    const { clientMsgId } = attempt.chat.lastSent<{ clientMsgId: string }>();
    attempt.chat.receive({ type: "chat.ack", clientMsgId });

    await expect(sending).resolves.toBeUndefined();
  });

  it("rejects chat messages while disconnected", async () => {
    const harness = createHarness();

    await expect(harness.session.sendChatMessage("hello", "alice")).rejects.toMatchObject({
      reason: "not-connected",
    });
  });

  it("relays reactions in both directions", async () => {
    const harness = createHarness();
    harness.session.start();
    const attempt = await connectSuccessfully(harness);
    const onReaction = vi.fn();
    harness.session.onReaction(onReaction);

    harness.session.sendReaction();
    expect(onReaction).not.toHaveBeenCalled();

    attempt.reactions.open();
    expect(harness.session.getSnapshot().canSendReaction).toBe(true);

    harness.session.sendReaction();
    expect(attempt.reactions.sent).toEqual(['{"type":"reaction"}']);
    expect(onReaction).toHaveBeenCalledTimes(1);

    attempt.reactions.receive({ type: "reaction" });
    attempt.reactions.receive({ type: "something-else" });
    attempt.reactions.receive("not json");
    expect(onReaction).toHaveBeenCalledTimes(2);
  });
});

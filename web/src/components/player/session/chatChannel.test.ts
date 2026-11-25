import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatChannel, ChatSendError, type ChatChannelEvents } from "./chatChannel";
import { FakeDataChannel } from "./testing";
import type { ChatMessage } from "./types";

const message = (id: string): ChatMessage => ({ id, ts: 1, text: `text ${id}`, displayName: "al" });

function setup() {
  const dataChannel = new FakeDataChannel();
  const events = {
    onHistory: vi.fn<ChatChannelEvents["onHistory"]>(),
    onMessage: vi.fn<ChatChannelEvents["onMessage"]>(),
    onStatus: vi.fn<ChatChannelEvents["onStatus"]>(),
    onError: vi.fn<ChatChannelEvents["onError"]>(),
  };
  const chatChannel = new ChatChannel(dataChannel.asDataChannel(), events);

  return { dataChannel, events, chatChannel };
}

describe("ChatChannel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports connected once the server confirms the subscription", () => {
    const { dataChannel, events } = setup();

    dataChannel.open();
    expect(events.onStatus).not.toHaveBeenCalled();

    dataChannel.receive({ type: "chat.connected" });
    expect(events.onStatus).toHaveBeenCalledWith("connected");
  });

  it("delivers history and live messages", () => {
    const { dataChannel, events } = setup();

    dataChannel.receive({
      type: "chat.history",
      events: [
        { type: "message", message: message("1") },
        { type: "message", message: message("2") },
      ],
    });
    dataChannel.receive({ type: "chat.message", eventId: 3, message: message("3") });

    expect(events.onHistory).toHaveBeenCalledExactlyOnceWith([message("1"), message("2")]);
    expect(events.onMessage).toHaveBeenCalledExactlyOnceWith(message("3"));
  });

  it("resolves a send when the server acknowledges it", async () => {
    const { dataChannel, chatChannel } = setup();
    dataChannel.open();

    const sending = chatChannel.send("hello", "alice");
    const sent = dataChannel.lastSent<{ type: string; clientMsgId: string; text: string }>();
    expect(sent).toMatchObject({ type: "chat.send", text: "hello", displayName: "alice" });

    dataChannel.receive({ type: "chat.ack", clientMsgId: sent.clientMsgId });
    await expect(sending).resolves.toBeUndefined();
  });

  it("rejects a send with the server's reason", async () => {
    const { dataChannel, chatChannel, events } = setup();
    dataChannel.open();

    const sending = chatChannel.send("hello", "alice");
    const { clientMsgId } = dataChannel.lastSent<{ clientMsgId: string }>();
    dataChannel.receive({ type: "chat.error", error: "invalid message length", clientMsgId });

    await expect(sending).rejects.toMatchObject({
      reason: "rejected",
      message: "invalid message length",
    });
    expect(events.onError).not.toHaveBeenCalled();
  });

  it("reports server errors that do not belong to a send", () => {
    const { dataChannel, events } = setup();

    dataChannel.receive({ type: "chat.error", error: "room not found" });

    expect(events.onError).toHaveBeenCalledWith("room not found");
  });

  it("rejects a send that is never acknowledged", async () => {
    const { dataChannel, chatChannel } = setup();
    dataChannel.open();

    const sending = chatChannel.send("hello", "alice");
    vi.advanceTimersByTime(10_000);

    await expect(sending).rejects.toMatchObject({ reason: "timeout" });
  });

  it("rejects sends while the channel is not open", async () => {
    const { chatChannel } = setup();

    await expect(chatChannel.send("hello", "alice")).rejects.toBeInstanceOf(ChatSendError);
  });

  it("rejects a send when the channel throws", async () => {
    const { dataChannel, chatChannel } = setup();
    dataChannel.open();
    dataChannel.failNextSend = true;

    await expect(chatChannel.send("hello", "alice")).rejects.toMatchObject({
      reason: "not-connected",
    });
  });

  it("rejects pending sends and reports disconnected when the channel closes", async () => {
    const { dataChannel, chatChannel, events } = setup();
    dataChannel.open();

    const sending = chatChannel.send("hello", "alice");
    dataChannel.close();

    await expect(sending).rejects.toMatchObject({ reason: "not-connected" });
    expect(events.onStatus).toHaveBeenCalledWith("disconnected");
  });

  it("ignores malformed payloads", () => {
    const { dataChannel, events } = setup();

    dataChannel.receive("not json");

    expect(events.onHistory).not.toHaveBeenCalled();
    expect(events.onMessage).not.toHaveBeenCalled();
    expect(events.onError).not.toHaveBeenCalled();
  });

  it("stops listening after dispose", () => {
    const { dataChannel, chatChannel, events } = setup();

    chatChannel.dispose();
    dataChannel.receive({ type: "chat.connected" });
    dataChannel.close();

    expect(events.onStatus).not.toHaveBeenCalled();
  });
});

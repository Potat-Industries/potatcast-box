import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../session/types";
import { useUnreadCount } from "./useUnreadCount";

const message = (id: string): ChatMessage => ({ id, ts: 1, text: id, displayName: "alice" });

interface Props {
  messages: ChatMessage[];
  isVisible: boolean;
  chatId?: string;
  backlogEndId?: string | null;
}

const renderUnreadCount = (initialProps: Props) =>
  renderHook(
    (props: Props) =>
      useUnreadCount({
        messages: props.messages,
        isVisible: props.isVisible,
        chatId: props.chatId ?? "chat",
        backlogEndId: props.backlogEndId ?? null,
      }),
    { initialProps },
  );

describe("useUnreadCount", () => {
  it("is zero while the chat is visible", () => {
    const { result } = renderUnreadCount({ messages: [message("1")], isVisible: true });

    expect(result.current).toBe(0);
  });

  it("counts messages that arrive while hidden", () => {
    const { result, rerender } = renderUnreadCount({ messages: [message("1")], isVisible: true });

    rerender({ messages: [message("1")], isVisible: false });
    expect(result.current).toBe(0);

    rerender({ messages: [message("1"), message("2"), message("3")], isVisible: false });
    expect(result.current).toBe(2);
  });

  it("resets when the chat becomes visible again", () => {
    const messages = [message("1"), message("2")];
    const { result, rerender } = renderUnreadCount({ messages: [], isVisible: false });

    rerender({ messages, isVisible: false });
    expect(result.current).toBe(2);

    rerender({ messages, isVisible: true });
    rerender({ messages, isVisible: false });
    expect(result.current).toBe(0);
  });

  it("does not count the backlog that predates the viewer as unread", () => {
    const backlog = [message("1"), message("2")];
    const { result, rerender } = renderUnreadCount({ messages: [], isVisible: false });

    rerender({ messages: backlog, isVisible: false, backlogEndId: "2" });
    expect(result.current).toBe(0);

    rerender({ messages: [...backlog, message("3")], isVisible: false, backlogEndId: "2" });
    expect(result.current).toBe(1);
  });

  it("starts counting afresh when switching to another chat", () => {
    const secondChat = [message("a"), message("b")];
    const { result, rerender } = renderUnreadCount({
      messages: [message("1")],
      isVisible: false,
      chatId: "first",
    });

    rerender({ messages: secondChat, isVisible: false, chatId: "second" });
    expect(result.current).toBe(0);

    rerender({ messages: [...secondChat, message("c")], isVisible: false, chatId: "second" });
    expect(result.current).toBe(1);
  });
});

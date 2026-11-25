import { useState } from "react";
import type { ChatMessage } from "../session/types";

interface UnreadCountOptions {
  messages: ChatMessage[];
  isVisible: boolean;
  /** Identifies whose messages these are; switching to another chat starts counting afresh. */
  chatId: string;
  /** The last message that predates the viewer joining; nothing up to it can be unread. */
  backlogEndId: string | null;
}

/** Counts messages that arrived while the chat was out of view. */
export function useUnreadCount(options: UnreadCountOptions): number {
  const { messages, isVisible, chatId, backlogEndId } = options;
  const latestMessageId = messages.at(-1)?.id ?? null;
  const [lastSeen, setLastSeen] = useState({ chatId, messageId: latestMessageId });

  const hasSwitchedChat = lastSeen.chatId !== chatId;
  if (hasSwitchedChat || (isVisible && lastSeen.messageId !== latestMessageId)) {
    setLastSeen({ chatId, messageId: latestMessageId });
  }

  if (isVisible || hasSwitchedChat) {
    return 0;
  }

  const lastReadMessageId = lastSeen.messageId ?? backlogEndId;
  const lastReadIndex = messages.findIndex((message) => message.id === lastReadMessageId);

  return messages.length - 1 - lastReadIndex;
}

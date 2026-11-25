import { ArrowDownIcon } from "@heroicons/react/20/solid";
import { memo, useContext, useLayoutEffect, useRef, useState } from "react";
import { LocaleContext } from "../../../providers/LocaleProvider";
import type { ChatMessage } from "../session/types";
import { linkify } from "./linkify";

const PINNED_TO_BOTTOM_THRESHOLD_PX = 48;
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

function getNameColor(displayName: string): string {
  let hash = 0;
  for (let index = 0; index < displayName.length; index += 1) {
    hash = displayName.charCodeAt(index) + ((hash << 5) - hash);
  }

  return `hsl(${Math.abs(hash) % 360}, 70%, 65%)`;
}

function continuesPreviousMessage(message: ChatMessage, previous: ChatMessage | undefined) {
  return (
    previous !== undefined &&
    previous.displayName === message.displayName &&
    message.ts - previous.ts < GROUPING_WINDOW_MS
  );
}

const ChatMessageItem = memo(function ChatMessageItem(props: {
  message: ChatMessage;
  isContinuation: boolean;
}) {
  const { message, isContinuation } = props;
  const time = new Date(message.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <li className={isContinuation ? "px-3 py-0.5" : "px-3 pt-2 pb-0.5"}>
      {!isContinuation && (
        <div className="flex items-baseline gap-2">
          <span
            className="truncate text-sm font-semibold"
            style={{ color: getNameColor(message.displayName) }}
          >
            {message.displayName}
          </span>
          <time
            className="shrink-0 text-xs text-gray-400"
            dateTime={new Date(message.ts).toISOString()}
          >
            {time}
          </time>
        </div>
      )}

      <p className="text-sm [overflow-wrap:anywhere] whitespace-pre-wrap text-gray-100">
        {linkify(message.text).map((segment, index) =>
          segment.kind === "link" ? (
            <a
              key={index}
              href={segment.text}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-blue-400 underline hover:text-blue-300"
            >
              {segment.text}
            </a>
          ) : (
            segment.text
          ),
        )}
      </p>
    </li>
  );
});

interface ChatMessageListProps {
  messages: ChatMessage[];
  /** False while the list is rendered but hidden, when it has no height to scroll. */
  isVisible: boolean;
  emptyText: string | null;
}

export function ChatMessageList({ messages, isVisible, emptyText }: ChatMessageListProps) {
  const { locale } = useContext(LocaleContext);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const [latestMessageIdWhenUnpinned, setLatestMessageIdWhenUnpinned] = useState<string>();
  const latestMessageId = messages.at(-1)?.id;

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller && isVisible && isPinnedToBottom) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [messages, isVisible, isPinnedToBottom]);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const distanceToBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    const isNowPinned = distanceToBottom <= PINNED_TO_BOTTOM_THRESHOLD_PX;

    if (isNowPinned !== isPinnedToBottom) {
      setIsPinnedToBottom(isNowPinned);
      setLatestMessageIdWhenUnpinned(latestMessageId);
    }
  };

  // Compared by id rather than by count, because the list stops growing once it is capped.
  const hasNewMessages = !isPinnedToBottom && latestMessageId !== latestMessageIdWhenUnpinned;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        role="log"
        aria-label={locale.chat.title}
        aria-live="polite"
        tabIndex={0}
        className="h-full overflow-y-auto overscroll-contain pb-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400"
      >
        {messages.length === 0 && emptyText && (
          <p className="px-3 py-4 text-center text-sm text-gray-400">{emptyText}</p>
        )}

        <ul>
          {messages.map((message, index) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isContinuation={continuesPreviousMessage(message, messages[index - 1])}
            />
          ))}
        </ul>
      </div>

      {hasNewMessages && (
        <button
          type="button"
          onClick={() => setIsPinnedToBottom(true)}
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-lg hover:bg-blue-500"
        >
          <ArrowDownIcon className="size-4" />
          {locale.chat.button_new_messages}
        </button>
      )}
    </div>
  );
}

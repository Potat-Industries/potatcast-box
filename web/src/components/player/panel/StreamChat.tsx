import { HeartIcon, PaperAirplaneIcon, PencilSquareIcon } from "@heroicons/react/20/solid";
import { useContext, useState, type FormEvent } from "react";
import { LocaleContext } from "../../../providers/LocaleProvider";
import { ChatSendError } from "../session/chatChannel";
import type { StreamSession } from "../session/StreamSession";
import { useStreamSession } from "../session/useStreamSession";
import { ChatMessageList } from "./ChatMessageList";
import { DisplayNameForm } from "./DisplayNameForm";

const MAX_MESSAGE_LENGTH = 2000;
const SHOW_COUNTER_FROM_LENGTH = 1800;

interface StreamChatProps {
  session: StreamSession;
  isVisible: boolean;
  displayName: string;
  onDisplayNameChange(displayName: string): void;
}

export function StreamChat({
  session,
  isVisible,
  displayName,
  onDisplayNameChange,
}: StreamChatProps) {
  const { locale } = useContext(LocaleContext);
  const { chatMessages, chatStatus, chatError, canSendReaction } = useStreamSession(session);

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  // True once the viewer has used the name form, so the field that replaces it takes over focus
  // instead of focus being dropped. It stays false on page load, which must not steal focus.
  const [hasUsedNameForm, setHasUsedNameForm] = useState(false);

  const isConnected = chatStatus === "connected";
  const trimmedText = text.trim();
  const canSend = isConnected && !isSending && trimmedText.length > 0;

  const describeSendError = (error: unknown): string => {
    if (error instanceof ChatSendError && error.reason === "not-connected") {
      return locale.chat.error_not_connected;
    }

    if (error instanceof ChatSendError && error.reason === "rejected") {
      return `${locale.chat.error_failed_to_send}: ${error.message}`;
    }

    return locale.chat.error_failed_to_send;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) {
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      await session.sendChatMessage(trimmedText, displayName);
      setText("");
    } catch (error) {
      setSendError(describeSendError(error));
    } finally {
      setIsSending(false);
    }
  };

  const errorMessage = sendError ?? chatError;
  const statusMessage = isConnected
    ? null
    : chatStatus === "connecting"
      ? locale.chat.status_connecting
      : locale.chat.status_disconnected;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatMessageList
        messages={chatMessages}
        isVisible={isVisible}
        emptyText={isConnected ? locale.chat.no_messages_yet : null}
      />

      <div className="shrink-0 border-t border-gray-700 bg-gray-900 p-2">
        {statusMessage && (
          <p role="status" className="mb-2 flex items-center gap-2 text-xs text-gray-300">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${chatStatus === "connecting" ? "animate-pulse bg-yellow-400" : "bg-red-500"}`}
            />
            {statusMessage}
          </p>
        )}

        {errorMessage && (
          <p role="alert" className="mb-2 rounded-md bg-red-950 px-2 py-1 text-xs text-red-200">
            {errorMessage}
          </p>
        )}

        {!displayName || isEditingName ? (
          <DisplayNameForm
            initialName={displayName}
            autoFocus={isEditingName}
            onSave={(name) => {
              onDisplayNameChange(name);
              setIsEditingName(false);
              setHasUsedNameForm(true);
            }}
            onCancel={
              displayName
                ? () => {
                    setIsEditingName(false);
                    setHasUsedNameForm(true);
                  }
                : undefined
            }
          />
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => session.sendReaction()}
                disabled={!canSendReaction}
                aria-label={locale.chat.button_reaction_title}
                title={locale.chat.button_reaction_title}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-gray-600 bg-gray-800 text-rose-400 hover:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-600"
              >
                <HeartIcon className="size-5" />
              </button>

              <input
                type="text"
                value={text}
                maxLength={MAX_MESSAGE_LENGTH}
                readOnly={isSending}
                enterKeyHint="send"
                autoFocus={hasUsedNameForm}
                autoComplete="off"
                aria-label={locale.chat.placeholder_input}
                placeholder={locale.chat.placeholder_input}
                onChange={(event) => setText(event.target.value)}
                className="h-10 min-w-0 flex-1 rounded-md border border-gray-600 bg-gray-800 px-3 text-base text-gray-100 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:outline-blue-400 sm:text-sm"
              />

              <button
                type="submit"
                disabled={!canSend}
                aria-label={locale.chat.button_send_title}
                title={locale.chat.button_send_title}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
              >
                <PaperAirplaneIcon className="size-5" />
              </button>
            </form>

            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-400">
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                title={locale.chat.button_change_display_name_title}
                className="flex min-w-0 items-center gap-1 rounded py-1 hover:text-gray-200"
              >
                <span className="truncate">
                  {locale.chat.chatting_as} <strong className="text-gray-200">{displayName}</strong>
                </span>
                <PencilSquareIcon className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="sr-only">{locale.chat.button_change_display_name_title}</span>
              </button>

              {text.length >= SHOW_COUNTER_FROM_LENGTH && (
                <span className="shrink-0">
                  {text.length}/{MAX_MESSAGE_LENGTH}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

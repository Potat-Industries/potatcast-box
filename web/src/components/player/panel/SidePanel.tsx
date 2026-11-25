import { XMarkIcon } from "@heroicons/react/20/solid";
import { useContext, useId, useRef, type KeyboardEvent } from "react";
import { LocaleContext } from "../../../providers/LocaleProvider";
import type { StreamSession } from "../session/StreamSession";
import { StreamChat } from "./StreamChat";
import { TwitchChat } from "./TwitchChat";

export type PanelTab = "chat" | "twitch";

const TABS: PanelTab[] = ["chat", "twitch"];

export function parsePanelTab(value: string): PanelTab {
  return value === "twitch" ? "twitch" : "chat";
}

interface SidePanelProps {
  sessions: StreamSession[];
  activeSession: StreamSession;
  onSelectStream(streamKey: string): void;
  activeTab: PanelTab;
  onSelectTab(tab: PanelTab): void;
  unreadCount: number;
  displayName: string;
  onDisplayNameChange(displayName: string): void;
  onClose(): void;
  className?: string;
}

export function SidePanel(props: SidePanelProps) {
  const { sessions, activeSession, activeTab, onSelectTab, unreadCount } = props;
  const { locale } = useContext(LocaleContext);
  const idPrefix = useId();
  const tabListRef = useRef<HTMLDivElement>(null);

  const tabLabels: Record<PanelTab, string> = {
    chat: locale.chat.tab_stream_chat,
    twitch: locale.chat.tab_twitch,
  };

  const handleTabKeyDown = (event: KeyboardEvent) => {
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (direction === 0) {
      return;
    }

    event.preventDefault();
    const nextTab = TABS[(TABS.indexOf(activeTab) + direction + TABS.length) % TABS.length];
    onSelectTab(nextTab);
    tabListRef.current?.querySelector<HTMLElement>(`[data-tab="${nextTab}"]`)?.focus();
  };

  return (
    <aside
      aria-label={locale.chat.title}
      className={`flex min-h-0 flex-col bg-gray-900 text-gray-100 ${props.className ?? ""}`}
    >
      {sessions.length > 1 && (
        <label className="flex shrink-0 items-center gap-2 border-b border-gray-700 px-3 py-2 text-xs text-gray-300">
          <span className="shrink-0">{locale.chat.stream_picker_label}</span>
          <select
            value={activeSession.streamKey}
            onChange={(event) => props.onSelectStream(event.target.value)}
            className="h-8 min-w-0 flex-1 rounded-md border border-gray-600 bg-gray-800 px-2 text-sm text-gray-100"
          >
            {sessions.map((session) => (
              <option key={session.streamKey} value={session.streamKey}>
                {session.streamKey}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex shrink-0 items-stretch border-b border-gray-700">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label={locale.chat.title}
          onKeyDown={handleTabKeyDown}
          className="flex min-w-0 flex-1"
        >
          {TABS.map((tab) => {
            const isSelected = tab === activeTab;

            return (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`${idPrefix}-tab-${tab}`}
                data-tab={tab}
                aria-selected={isSelected}
                aria-controls={`${idPrefix}-panel-${tab}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onSelectTab(tab)}
                className={`flex h-11 flex-1 items-center justify-center gap-2 border-b-2 px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400 ${
                  isSelected
                    ? "border-blue-500 text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                {tabLabels[tab]}
                {tab === "chat" && unreadCount > 0 && (
                  <span className="rounded-full bg-blue-600 px-1.5 text-xs leading-5 text-white">
                    <span aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>
                    <span className="sr-only">
                      {unreadCount} {locale.chat.unread_messages}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={props.onClose}
          aria-label={locale.chat.button_close_panel}
          title={locale.chat.button_close_panel}
          className="inline-flex w-11 shrink-0 items-center justify-center text-gray-300 hover:bg-gray-800 hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400"
        >
          <XMarkIcon className="size-5" />
        </button>
      </div>

      {/* Both panels stay mounted so switching tabs keeps the chat scroll position and does not reload Twitch. */}
      <div
        role="tabpanel"
        id={`${idPrefix}-panel-chat`}
        aria-labelledby={`${idPrefix}-tab-chat`}
        hidden={activeTab !== "chat"}
        className="min-h-0 flex-1"
      >
        <StreamChat
          key={activeSession.streamKey}
          session={activeSession}
          isVisible={activeTab === "chat"}
          displayName={props.displayName}
          onDisplayNameChange={props.onDisplayNameChange}
        />
      </div>

      <div
        role="tabpanel"
        id={`${idPrefix}-panel-twitch`}
        aria-labelledby={`${idPrefix}-tab-twitch`}
        hidden={activeTab !== "twitch"}
        className="min-h-0 flex-1"
      >
        <TwitchChat
          key={activeSession.streamKey}
          streamKey={activeSession.streamKey}
          isVisible={activeTab === "twitch"}
        />
      </div>
    </aside>
  );
}

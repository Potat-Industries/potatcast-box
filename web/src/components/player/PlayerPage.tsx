import { RectangleGroupIcon, SquaresPlusIcon } from "@heroicons/react/20/solid";
import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { setStoredValue, useStoredValue } from "../../hooks/useStoredValue";
import { LocaleContext } from "../../providers/LocaleProvider";
import { SiteHeader } from "../layout/SiteHeader";
import { MAIN_CONTENT_ID, SkipLink } from "../layout/SkipLink";
import { AddStreamDialog } from "./AddStreamDialog";
import type { ChatToggle } from "./controls/PlayerControls";
import { parsePanelTab, SidePanel, type PanelTab } from "./panel/SidePanel";
import { parseTwitchChannel, twitchChannelStorageKey } from "./panel/twitch";
import { useUnreadCount } from "./panel/useUnreadCount";
import Player from "./Player";
import { StreamSession } from "./session/StreamSession";
import { normalizeStreamKey } from "./session/streamKey";
import { useStreamSession } from "./session/useStreamSession";
import { useStreamSessionLifecycle } from "./session/useStreamSessionLifecycle";
import { StreamGrid } from "./StreamGrid";
import { useCinemaMode } from "./useCinemaMode";

const SITE_TITLE = "Broadcast Box";
const PANEL_OPEN_STORAGE_KEY = "chat-open";
const DISPLAY_NAME_STORAGE_KEY = "chatDisplayName";

// The panel sits beside the video on desktops and on phones held sideways, where stacking it
// below the video would leave it no height at all.
const SIDE_BY_SIDE_QUERY =
  "(min-width: 64rem), (orientation: landscape) and (min-width: 40rem) and (max-height: 33.75rem)";
const CAN_REARRANGE_TILES_QUERY = "(min-width: 48rem) and (pointer: fine)";

function panelTabStorageKey(streamKey: string): string {
  return `side-panel-tab:${streamKey.toLowerCase()}`;
}

function StreamSessionLifecycle({ session }: { session: StreamSession }) {
  useStreamSessionLifecycle(session);
  return null;
}

interface ToolbarButtonProps {
  label: string;
  ref?: React.Ref<HTMLButtonElement>;
  onClick(): void;
  children: React.ReactNode;
}

function ToolbarButton({ label, ref, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-600 px-3 text-sm font-medium text-gray-100 hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-blue-400"
    >
      {children}
      {label}
    </button>
  );
}

function PlayerPage({ primaryStreamKey }: { primaryStreamKey: string }) {
  const { locale } = useContext(LocaleContext);
  const [searchParams] = useSearchParams();
  const { isCinemaMode, toggleCinemaMode } = useCinemaMode();
  const isSideBySide = useMediaQuery(SIDE_BY_SIDE_QUERY);
  const canRearrangeTiles = useMediaQuery(CAN_REARRANGE_TILES_QUERY);

  const [sessions, setSessions] = useState(() => [new StreamSession(primaryStreamKey)]);
  const [chatStreamKey, setChatStreamKey] = useState(primaryStreamKey);
  const [isAddStreamOpen, setIsAddStreamOpen] = useState(false);
  // The single-stream and multi-view layouts each render their own "Add stream" button; this
  // always points at the one on screen so focus can return to it when the dialog closes.
  const addStreamButtonRef = useRef<HTMLButtonElement>(null);

  const chatSession =
    sessions.find((session) => session.streamKey === chatStreamKey) ?? sessions[0];
  const isMultiView = sessions.length > 1;

  const [storedPanelOpen, setStoredPanelOpen] = useStoredValue(PANEL_OPEN_STORAGE_KEY, "true");
  const [displayName, setDisplayName] = useStoredValue(DISPLAY_NAME_STORAGE_KEY);
  const [storedTab, setStoredTab] = useStoredValue(panelTabStorageKey(chatSession.streamKey));
  const isPanelOpen = storedPanelOpen !== "false";
  const activeTab = parsePanelTab(storedTab);

  const isChatVisible = isPanelOpen && activeTab === "chat";
  const { chatMessages, chatBacklogEndId, streamStatus } = useStreamSession(chatSession);
  const unreadCount = useUnreadCount({
    messages: chatMessages,
    isVisible: isChatVisible,
    chatId: chatSession.streamKey,
    backlogEndId: chatBacklogEndId,
  });

  const titleStreamKey = sessions[0].streamKey;
  useEffect(() => {
    document.title = `${titleStreamKey} - ${SITE_TITLE}`;

    return () => {
      document.title = SITE_TITLE;
    };
  }, [titleStreamKey]);

  // A shared link such as /StreamKey?twitch=channel opens straight into that Twitch chat.
  const linkedTwitchChannel = parseTwitchChannel(searchParams.get("twitch") ?? "");
  useEffect(() => {
    if (linkedTwitchChannel) {
      setStoredValue(twitchChannelStorageKey(primaryStreamKey), linkedTwitchChannel);
      setStoredValue(panelTabStorageKey(primaryStreamKey), "twitch" satisfies PanelTab);
      setStoredValue(PANEL_OPEN_STORAGE_KEY, "true");
    }
  }, [primaryStreamKey, linkedTwitchChannel]);

  const addStream = (streamKey: string) => {
    setSessions((current) => [...current, new StreamSession(streamKey)]);
    setIsAddStreamOpen(false);
  };

  const removeStream = (streamKey: string) => {
    setSessions((current) => current.filter((session) => session.streamKey !== streamKey));
  };

  const chatToggleFor = (session: StreamSession): ChatToggle => {
    const isShowingThisChat = isPanelOpen && session === chatSession;

    return {
      isOpen: isShowingThisChat,
      unreadCount: session === chatSession ? unreadCount : 0,
      onToggle: () => {
        setChatStreamKey(session.streamKey);
        setStoredPanelOpen(String(!isShowingThisChat));
      },
    };
  };

  const addStreamButton = (
    <ToolbarButton
      label={locale.player_page.modal_add_stream_title}
      ref={addStreamButtonRef}
      onClick={() => setIsAddStreamOpen(true)}
    >
      <SquaresPlusIcon className="size-5" aria-hidden="true" />
    </ToolbarButton>
  );

  const singleView = (
    <>
      <div className={isSideBySide ? "min-h-0 flex-1" : "aspect-video max-h-dvh w-full shrink-0"}>
        <Player
          session={sessions[0]}
          chat={chatToggleFor(sessions[0])}
          cinemaMode={{ isEnabled: isCinemaMode, onToggle: toggleCinemaMode }}
        />
      </div>

      {!isCinemaMode && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">{sessions[0].streamKey}</h1>
            {streamStatus?.isOnline && streamStatus.motd && (
              <p className="truncate text-sm text-gray-300">{streamStatus.motd}</p>
            )}
          </div>
          {addStreamButton}
        </div>
      )}
    </>
  );

  const multiView = (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-2 py-2">
        <h1 className="sr-only">{sessions.map((session) => session.streamKey).join(", ")}</h1>
        {addStreamButton}
        <ToolbarButton
          label={
            isCinemaMode
              ? locale.player_page.cinema_mode_disable
              : locale.player_page.cinema_mode_enable
          }
          onClick={toggleCinemaMode}
        >
          <RectangleGroupIcon className="size-5" aria-hidden="true" />
        </ToolbarButton>
      </div>

      <div className="px-2 pb-2">
        <StreamGrid
          sessions={sessions}
          canRearrange={canRearrangeTiles}
          renderTile={(session, index) => (
            <Player
              session={session}
              startMuted={index > 0}
              chat={chatToggleFor(session)}
              onClose={() => removeStream(session.streamKey)}
            />
          )}
        />
      </div>
    </>
  );

  const stageClassName = isSideBySide
    ? `flex min-w-0 flex-1 flex-col ${isMultiView ? "overflow-y-auto" : ""}`
    : "flex shrink-0 flex-col";
  const panelClassName = isSideBySide
    ? "w-[min(21.25rem,40vw)] shrink-0 border-l border-gray-700"
    : `border-t border-gray-700 ${isMultiView ? "h-[32rem] shrink-0" : "min-h-80 flex-1"}`;

  return (
    <div className="flex h-dvh flex-col">
      <SkipLink />
      {!isCinemaMode && <SiteHeader />}

      {sessions.map((session) => (
        <StreamSessionLifecycle key={session.streamKey} session={session} />
      ))}

      <main
        id={MAIN_CONTENT_ID}
        className={`flex min-h-0 flex-1 ${isSideBySide ? "flex-row" : "flex-col overflow-y-auto"}`}
      >
        <div className={stageClassName}>{isMultiView ? multiView : singleView}</div>

        {isPanelOpen && (
          <SidePanel
            className={panelClassName}
            sessions={sessions}
            activeSession={chatSession}
            onSelectStream={setChatStreamKey}
            activeTab={activeTab}
            onSelectTab={setStoredTab}
            unreadCount={unreadCount}
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            onClose={() => setStoredPanelOpen("false")}
          />
        )}
      </main>

      {isAddStreamOpen && (
        <AddStreamDialog
          watchedStreamKeys={sessions.map((session) => session.streamKey)}
          returnFocusRef={addStreamButtonRef}
          onAdd={addStream}
          onClose={() => setIsAddStreamOpen(false)}
        />
      )}
    </div>
  );
}

/** Remounts the page when the stream key in the URL changes, so no state leaks between streams. */
export default function PlayerRoute() {
  const streamKey = normalizeStreamKey(useParams()["*"] ?? "");

  return <PlayerPage key={streamKey} primaryStreamKey={streamKey} />;
}

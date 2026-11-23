import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { useContext, useId, useState, type FormEvent } from "react";
import { useStoredValue } from "../../../hooks/useStoredValue";
import { LocaleContext } from "../../../providers/LocaleProvider";
import {
  getTwitchEmbedSupport,
  parseTwitchChannel,
  twitchChannelStorageKey,
  twitchChatEmbedUrl,
  twitchChatPopoutUrl,
} from "./twitch";

interface ChannelFormProps {
  initialValue: string;
  autoFocus: boolean;
  onSave(channel: string): void;
}

function ChannelForm(props: ChannelFormProps) {
  const { locale } = useContext(LocaleContext);
  const [value, setValue] = useState(props.initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const inputId = useId();
  const errorId = useId();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const channel = parseTwitchChannel(value);
    if (channel) {
      props.onSave(channel);
    } else {
      setIsInvalid(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3">
      <label htmlFor={inputId} className="text-sm font-semibold">
        {locale.twitch.channel_label}
      </label>
      <p className="text-xs text-gray-300">{locale.twitch.channel_help}</p>
      <input
        id={inputId}
        type="text"
        value={value}
        autoFocus={props.autoFocus}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? errorId : undefined}
        placeholder={locale.twitch.channel_placeholder}
        onChange={(event) => {
          setValue(event.target.value);
          setIsInvalid(false);
        }}
        className="h-10 rounded-md border border-gray-600 bg-gray-800 px-3 text-base text-gray-100 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:outline-blue-400 sm:text-sm"
      />
      {isInvalid && (
        <p id={errorId} role="alert" className="text-xs text-red-300">
          {locale.twitch.error_invalid_channel}
        </p>
      )}
      <button
        type="submit"
        className="h-10 rounded-md bg-purple-600 px-3 text-sm font-semibold text-white hover:bg-purple-500"
      >
        {locale.twitch.button_open_chat}
      </button>
    </form>
  );
}

function PopoutLink({ channel, className }: { channel: string; className: string }) {
  const { locale } = useContext(LocaleContext);

  return (
    <a
      href={twitchChatPopoutUrl(channel)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {locale.twitch.button_open_popout}
      <ArrowTopRightOnSquareIcon className="size-4" aria-hidden="true" />
    </a>
  );
}

interface TwitchChatProps {
  streamKey: string;
  /** The iframe is only created once the tab is shown; viewers who never open it never contact Twitch. */
  isVisible: boolean;
}

export function TwitchChat({ streamKey, isVisible }: TwitchChatProps) {
  const { locale } = useContext(LocaleContext);
  const [channel, setChannel] = useStoredValue(twitchChannelStorageKey(streamKey));
  const [isEditing, setIsEditing] = useState(false);
  // True once the viewer has submitted the form, so the button that replaces it takes over focus.
  const [hasUsedForm, setHasUsedForm] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(isVisible);

  if (isVisible && !hasBeenVisible) {
    setHasBeenVisible(true);
  }

  if (!channel || isEditing) {
    return (
      <ChannelForm
        initialValue={channel}
        autoFocus={isEditing}
        onSave={(nextChannel) => {
          setChannel(nextChannel);
          setIsEditing(false);
          setHasUsedForm(true);
        }}
      />
    );
  }

  const embedSupport = getTwitchEmbedSupport(window.location);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 border-b border-gray-700 px-2 py-1 text-xs text-gray-200">
        <span className="min-w-0 truncate px-1 font-semibold">twitch.tv/{channel}</span>
        <span className="flex items-center">
          <button
            type="button"
            autoFocus={hasUsedForm}
            onClick={() => setIsEditing(true)}
            className="rounded px-2 py-1 hover:bg-gray-700"
          >
            {locale.twitch.button_change_channel}
          </button>
          {embedSupport === "supported" && (
            <PopoutLink channel={channel} className="rounded px-2 py-1 hover:bg-gray-700" />
          )}
        </span>
      </div>

      {embedSupport === "supported" ? (
        hasBeenVisible && (
          <iframe
            key={channel}
            src={twitchChatEmbedUrl(channel, window.location.hostname)}
            title={`${locale.twitch.iframe_title}: ${channel}`}
            className="min-h-0 w-full flex-1 border-0"
          />
        )
      ) : (
        <div className="flex flex-col items-start gap-3 p-3 text-sm text-gray-200">
          <p>
            {embedSupport === "requires-https"
              ? locale.twitch.embed_requires_https
              : locale.twitch.embed_requires_domain}
          </p>
          <p className="text-gray-300">{locale.twitch.embed_fallback}</p>
          <PopoutLink
            channel={channel}
            className="rounded-md bg-purple-600 px-3 py-2 font-semibold text-white hover:bg-purple-500"
          />
        </div>
      )}
    </div>
  );
}

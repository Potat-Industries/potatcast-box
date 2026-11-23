import { useContext, useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { LocaleContext } from "../../providers/LocaleProvider";
import Toggle from "../shared/Toggle";
import AvailableStreams from "./AvailableStreams";

type Intent = "watch" | "share";

export default function Frontpage() {
  const { locale } = useContext(LocaleContext);
  const navigate = useNavigate();
  const [intent, setIntent] = useState<Intent>("watch");
  const [streamKey, setStreamKey] = useState("");
  const inputId = useId();
  const trimmedStreamKey = streamKey.trim();

  const watchStream = (key: string) => navigate(`/${encodeURIComponent(key)}`);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmedStreamKey) {
      return;
    }

    if (intent === "share") {
      navigate(`/publish/${encodeURIComponent(trimmedStreamKey)}`);
    } else {
      watchStream(trimmedStreamKey);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-6 sm:py-12">
      <div className="flex flex-col gap-6 rounded-lg bg-gray-800 p-5 shadow-md sm:p-8">
        <div>
          <h1 className="mb-2 text-3xl leading-tight font-light sm:text-4xl">
            {locale.frontpage.welcome}
          </h1>
          <p className="text-gray-200">{locale.frontpage.welcome_subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Toggle
            titleLeft={locale.frontpage.toggle_watch}
            onClickLeft={() => setIntent("watch")}
            iconLeft="People"
            titleRight={locale.frontpage.toggle_stream}
            onClickRight={() => setIntent("share")}
            iconRight="Camera"
            selected={intent === "watch" ? "Left" : "Right"}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor={inputId} className="text-sm font-bold">
              {locale.frontpage.stream_input_label}
            </label>
            <input
              id={inputId}
              type="text"
              value={streamKey}
              autoFocus
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              placeholder={
                intent === "share"
                  ? locale.frontpage.stream_input_placeholder_share
                  : locale.frontpage.stream_input_placeholder_join
              }
              onChange={(event) => setStreamKey(event.target.value)}
              className="h-11 w-full rounded-md border border-gray-600 bg-gray-700 px-3 text-base text-white placeholder:text-gray-300 focus-visible:outline-2 focus-visible:outline-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={!trimmedStreamKey}
            className="h-11 w-full rounded-md bg-blue-700 px-4 font-bold text-white hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-300"
          >
            {intent === "share"
              ? locale.frontpage.stream_button_stream_start
              : locale.frontpage.stream_button_stream_join}
          </button>
        </form>

        <AvailableStreams onSelect={watchStream} />
      </div>
    </div>
  );
}

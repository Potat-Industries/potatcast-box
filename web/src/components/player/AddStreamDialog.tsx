import { useContext, useId, useState, type FormEvent, type RefObject } from "react";
import { LocaleContext } from "../../providers/LocaleProvider";
import AvailableStreams from "../selection/AvailableStreams";
import { Dialog } from "../shared/Dialog";
import { isSameStreamKey, normalizeStreamKey } from "./session/streamKey";

interface AddStreamDialogProps {
  watchedStreamKeys: string[];
  returnFocusRef: RefObject<HTMLElement | null>;
  onAdd(streamKey: string): void;
  onClose(): void;
}

export function AddStreamDialog(props: AddStreamDialogProps) {
  const { watchedStreamKeys, returnFocusRef, onAdd, onClose } = props;
  const { locale } = useContext(LocaleContext);
  const [value, setValue] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const inputId = useId();
  const errorId = useId();

  const addStream = (rawStreamKey: string) => {
    const streamKey = normalizeStreamKey(rawStreamKey);
    if (!streamKey) {
      return;
    }

    if (watchedStreamKeys.some((watchedKey) => isSameStreamKey(watchedKey, streamKey))) {
      setIsDuplicate(true);
      return;
    }

    onAdd(streamKey);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    addStream(value);
  };

  return (
    <Dialog
      title={locale.player_page.modal_add_stream_title}
      returnFocusRef={returnFocusRef}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm text-gray-200">
          {locale.player_page.modal_add_stream_message}
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="text"
            value={value}
            data-autofocus
            autoCapitalize="none"
            autoComplete="off"
            aria-invalid={isDuplicate}
            aria-describedby={isDuplicate ? errorId : undefined}
            placeholder={locale.player_page.modal_add_stream_placeholder}
            onChange={(event) => {
              setValue(event.target.value);
              setIsDuplicate(false);
            }}
            className="h-10 min-w-0 flex-1 rounded-md border border-gray-600 bg-gray-700 px-3 text-base text-white placeholder:text-gray-300 focus-visible:outline-2 focus-visible:outline-blue-400 sm:text-sm"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="h-10 rounded-md bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-300"
          >
            {locale.player_page.modal_add_stream_title}
          </button>
        </div>
        {isDuplicate && (
          <p id={errorId} role="alert" className="text-sm text-red-300">
            {locale.player_page.modal_add_stream_already_added}
          </p>
        )}
      </form>

      <AvailableStreams
        showHeader={false}
        hiddenStreamKeys={watchedStreamKeys}
        onSelect={addStream}
      />
    </Dialog>
  );
}

import { useContext, useId, useState, type FormEvent } from "react";
import { LocaleContext } from "../../../providers/LocaleProvider";

export const MAX_DISPLAY_NAME_LENGTH = 80;

interface DisplayNameFormProps {
  initialName: string;
  autoFocus?: boolean;
  onSave(displayName: string): void;
  onCancel?: () => void;
}

export function DisplayNameForm(props: DisplayNameFormProps) {
  const { initialName, autoFocus = false, onSave, onCancel } = props;
  const { locale } = useContext(LocaleContext);
  const [name, setName] = useState(initialName);
  const inputId = useId();
  const trimmedName = name.trim();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (trimmedName) {
      onSave(trimmedName);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-xs text-gray-300">
        {initialName ? locale.chat.display_name_label : locale.chat.display_name_prompt}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={name}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          autoFocus={autoFocus}
          autoComplete="nickname"
          placeholder={locale.chat.display_name_placeholder}
          onChange={(event) => setName(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-md border border-gray-600 bg-gray-800 px-3 text-base text-gray-100 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:outline-blue-400 sm:text-sm"
        />
        <button
          type="submit"
          disabled={!trimmedName}
          className="h-10 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
        >
          {locale.chat.button_save_display_name}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-md border border-gray-600 px-3 text-sm text-gray-100 hover:bg-gray-700"
          >
            {locale.chat.button_cancel}
          </button>
        )}
      </div>
    </form>
  );
}

import { XMarkIcon } from "@heroicons/react/20/solid";
import { useContext, useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { LocaleContext } from "../../providers/LocaleProvider";

interface DialogProps {
  title: string;
  /** Where focus goes on close when the control that opened the dialog may no longer exist. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  onClose(): void;
  children: ReactNode;
}

/**
 * A modal built on the native dialog element, which provides the focus trap and Escape handling.
 * Mark the field that should receive focus with `data-autofocus`: React's `autoFocus` runs before
 * the dialog is shown, when nothing inside it can take focus yet.
 */
export function Dialog({ title, returnFocusRef, onClose, children }: DialogProps) {
  const { locale } = useContext(LocaleContext);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);
  const pressStartedOnBackdropRef = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }

    // The browser only returns focus to the opener for dialog.close(); this dialog is closed by
    // unmounting it, so focus is handed back here.
    return () => {
      // Read at cleanup on purpose: it must name whichever control is on screen once the dialog
      // is gone, which is exactly the "changed since the effect ran" value the rule warns about.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const returnTarget = returnFocusRef?.current ?? openerRef.current;
      if (returnTarget instanceof HTMLElement) {
        returnTarget.focus();
      }
    };
  }, [returnFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onPointerDown={(event) => {
        pressStartedOnBackdropRef.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        // The dialog element is only the target itself on the backdrop. The press must start
        // there too, or dragging a text selection out of a field would close the dialog.
        if (event.target === event.currentTarget && pressStartedOnBackdropRef.current) {
          onClose();
        }
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-0 text-gray-100 shadow-xl backdrop:bg-black/60"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={locale.shared_component_text_input_modal.button_close}
            className="-mt-1 -mr-1 inline-flex size-9 items-center justify-center rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

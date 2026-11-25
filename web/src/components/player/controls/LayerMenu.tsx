import { CheckIcon } from "@heroicons/react/20/solid";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ControlButton } from "./ControlButton";

interface LayerMenuProps {
  label: string;
  icon: ReactNode;
  layers: string[];
  selectedLayer: string | null;
  automaticLabel: string;
  onSelect(layer: string): void;
  onOpenChange(isOpen: boolean): void;
}

/** A menu of simulcast layers. The server picks one itself until the viewer chooses. */
export function LayerMenu(props: LayerMenuProps) {
  const { label, icon, layers, selectedLayer, automaticLabel, onSelect, onOpenChange } = props;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const closeAndRefocusTrigger = () => {
    setIsOpen(false);
    containerRef.current?.querySelector<HTMLElement>("button")?.focus();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    onOpenChange(true);
    document.addEventListener("pointerdown", closeOnOutsidePress);
    containerRef.current?.querySelector<HTMLElement>('[role="menuitemradio"]')?.focus();

    // Runs on unmount too: the menu disappears while open when a reconnect clears the layer list.
    return () => {
      onOpenChange(false);
      document.removeEventListener("pointerdown", closeOnOutsidePress);
    };
  }, [isOpen, onOpenChange]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === "Escape") {
      closeAndRefocusTrigger();
    } else if (event.key === "ArrowDown") {
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        // Closes when focus moves elsewhere, such as tabbing out. Safari does not focus a button
        // that is clicked, so a blur without a new target is ignored or picking an item would
        // close the menu before the click lands.
        const focusMovedTo = event.relatedTarget;
        if (focusMovedTo && !event.currentTarget.contains(focusMovedTo)) {
          setIsOpen(false);
        }
      }}
    >
      <ControlButton
        label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon}
      </ControlButton>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className="player-drag-cancel absolute right-0 bottom-full z-30 mb-1 max-h-60 min-w-36 overflow-y-auto rounded-md border border-gray-700 bg-gray-900/95 py-1 text-sm shadow-lg"
        >
          {selectedLayer === null && (
            <button
              type="button"
              role="menuitemradio"
              aria-checked="true"
              aria-disabled="true"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-300 focus-visible:bg-white/15 focus-visible:outline-none"
            >
              <CheckIcon className="size-4" />
              {automaticLabel}
            </button>
          )}

          {layers.map((layer) => (
            <button
              key={layer}
              type="button"
              role="menuitemradio"
              aria-checked={layer === selectedLayer}
              onClick={() => {
                onSelect(layer);
                closeAndRefocusTrigger();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-white hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none"
            >
              <CheckIcon className={`size-4 ${layer === selectedLayer ? "" : "invisible"}`} />
              {layer}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useCallback, useSyncExternalStore } from "react";
import { readStored, removeStored, writeStored } from "../utilities/storage";

const sameTabListeners = new Set<() => void>();

function subscribe(listener: () => void) {
  sameTabListeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    sameTabListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Writes a stored value and updates every component that reads it through useStoredValue. */
export function setStoredValue(key: string, value: string | null): void {
  if (value === null) {
    removeStored(key);
  } else {
    writeStored(key, value);
  }

  sameTabListeners.forEach((listener) => listener());
}

/** A localStorage-backed string that stays in sync across components and browser tabs. */
export function useStoredValue(
  key: string,
  fallback = "",
): [string, (value: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => readStored(key) ?? fallback);
  const setValue = useCallback((nextValue: string | null) => setStoredValue(key, nextValue), [key]);

  return [value, setValue];
}

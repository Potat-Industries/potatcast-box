// localStorage can be unavailable (blocked by browser settings) or refuse writes (quota, some
// private browsing modes). Values that could not be saved are kept in memory for the lifetime of
// the page and take precedence over whatever is in localStorage.
const unsavedValues = new Map<string, string | null>();

export function readStored(key: string): string | null {
  if (unsavedValues.has(key)) {
    return unsavedValues.get(key) ?? null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
    unsavedValues.delete(key);
  } catch {
    unsavedValues.set(key, value);
  }
}

export function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(key);
    unsavedValues.delete(key);
  } catch {
    unsavedValues.set(key, null);
  }
}

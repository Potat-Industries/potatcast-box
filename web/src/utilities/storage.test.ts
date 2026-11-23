import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readStored, removeStored, writeStored } from "./storage";

// A hand-rolled Storage keeps these tests independent of how complete the test runtime's own
// localStorage is; newer Node versions expose a partial one that shadows jsdom's.
function createFakeStorage() {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void values.set(key, value)),
    removeItem: vi.fn((key: string) => void values.delete(key)),
  };
}

describe("storage", () => {
  let fakeStorage: ReturnType<typeof createFakeStorage>;

  beforeEach(() => {
    fakeStorage = createFakeStorage();
    vi.stubGlobal("localStorage", fakeStorage);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("round-trips through localStorage", () => {
    writeStored("plain", "value");

    expect(fakeStorage.setItem).toHaveBeenCalledWith("plain", "value");
    expect(readStored("plain")).toBe("value");

    removeStored("plain");
    expect(readStored("plain")).toBeNull();
  });

  it("keeps values for the page when the browser refuses to save them", () => {
    writeStored("quota", "saved earlier");
    fakeStorage.setItem.mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });

    writeStored("quota", "new value");

    expect(readStored("quota")).toBe("new value");
  });

  it("forgets a removed value even when the browser refuses the removal", () => {
    writeStored("locked", "value");
    fakeStorage.removeItem.mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    removeStored("locked");

    expect(readStored("locked")).toBeNull();
  });

  it("returns nothing when localStorage cannot be read at all", () => {
    fakeStorage.getItem.mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(readStored("blocked")).toBeNull();
  });
});

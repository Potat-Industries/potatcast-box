import { describe, expect, it } from "vitest";
import { reconnectDelayMs } from "./reconnect";

describe("reconnectDelayMs", () => {
  it("doubles from one second and caps at fifteen", () => {
    expect([1, 2, 3, 4, 5, 6, 20].map(reconnectDelayMs)).toEqual([
      1_000, 2_000, 4_000, 8_000, 15_000, 15_000, 15_000,
    ]);
  });

  it("never returns less than the initial delay", () => {
    expect(reconnectDelayMs(0)).toBe(1_000);
  });
});

import { describe, expect, it } from "vitest";
import { mayLog } from "./log-limited";

describe("mayLog", () => {
  it("lets a message through once per period, for each key", () => {
    expect(mayLog("a", 1000, 500)).toBe(true);
    expect(mayLog("a", 1200, 500)).toBe(false);
    expect(mayLog("b", 1200, 500)).toBe(true);
    expect(mayLog("a", 1500, 500)).toBe(true);
  });
});

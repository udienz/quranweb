import { describe, expect, it } from "vitest";
import { formatTime } from "./audio-time";

describe("formatTime", () => {
  it("shows minutes and seconds with two digits", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(18 * 60 + 12)).toBe("18:12");
    expect(formatTime(59.9)).toBe("00:59");
  });
  it("adds hours only past an hour", () => {
    expect(formatTime(3600)).toBe("1:00:00");
    expect(formatTime(3600 + 2 * 60 + 9)).toBe("1:02:09");
  });
  it("treats a missing or unusable value as zero", () => {
    expect(formatTime(Number.NaN)).toBe("00:00");
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("00:00");
    expect(formatTime(-5)).toBe("00:00");
  });
});

import { describe, expect, it } from "vitest";
import { dailySurah, SURAH_COUNT } from "./daily";

const DAY = 24 * 60 * 60 * 1000;
// Midnight in Jakarta (UTC+7) at the start of 2026-11-22 is 2026-11-21 17:00 UTC.
const MIDNIGHT = Date.UTC(2026, 10, 21, 17, 0, 0);

describe("dailySurah", () => {
  it("shows each of the 114 surahs once in 114 days", () => {
    const seen = new Set<number>();
    for (let i = 0; i < SURAH_COUNT; i++) seen.add(dailySurah(MIDNIGHT + i * DAY));
    expect(seen.size).toBe(SURAH_COUNT);
    expect(Math.min(...seen)).toBe(1);
    expect(Math.max(...seen)).toBe(SURAH_COUNT);
  });

  it("repeats after 114 days", () => {
    for (const i of [0, 1, 50, 113]) expect(dailySurah(MIDNIGHT + (i + SURAH_COUNT) * DAY)).toBe(dailySurah(MIDNIGHT + i * DAY));
  });

  it("stays the same all day in Jakarta and changes at its midnight", () => {
    const first = dailySurah(MIDNIGHT);
    expect(dailySurah(MIDNIGHT + 12 * 60 * 60 * 1000)).toBe(first);
    expect(dailySurah(MIDNIGHT + DAY - 1)).toBe(first);
    expect(dailySurah(MIDNIGHT + DAY)).not.toBe(first);
    expect(dailySurah(MIDNIGHT - 1)).not.toBe(first);
  });

  it("does not follow the mushaf order", () => {
    const [a, b] = [dailySurah(MIDNIGHT), dailySurah(MIDNIGHT + DAY)];
    expect(Math.abs(b - a)).not.toBe(1);
  });

  it("is a valid surah for a day before 1970 too", () => {
    const n = dailySurah(Date.UTC(1960, 0, 1));
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(SURAH_COUNT);
  });
});

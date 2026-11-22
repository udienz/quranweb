import { describe, expect, it } from "vitest";
import { dailyVerse, VERSES_OF_THE_DAY } from "./daily";
import { VERSE_COUNTS } from "./surah-number";

const DAY = 24 * 60 * 60 * 1000;
// Midnight in Jakarta (UTC+7) at the start of 2026-11-22 is 2026-11-21 17:00 UTC.
const MIDNIGHT = Date.UTC(2026, 10, 21, 17, 0, 0);
const N = VERSES_OF_THE_DAY.length;
const key = (v: { surah: number; verse: number }) => `${v.surah}:${v.verse}`;

describe("VERSES_OF_THE_DAY", () => {
  it("lists real verses, each once", () => {
    for (const [surah, verse] of VERSES_OF_THE_DAY) {
      expect(surah, `${surah}:${verse}`).toBeGreaterThanOrEqual(1);
      expect(surah).toBeLessThanOrEqual(114);
      expect(verse, `${surah}:${verse}`).toBeGreaterThanOrEqual(1);
      expect(verse, `${surah}:${verse}`).toBeLessThanOrEqual(VERSE_COUNTS[surah - 1]);
    }
    expect(new Set(VERSES_OF_THE_DAY.map(([s, v]) => `${s}:${v}`)).size).toBe(N);
  });
});

describe("dailyVerse", () => {
  it("shows each verse of the list once in a cycle", () => {
    const seen = new Set<string>();
    for (let i = 0; i < N; i++) seen.add(key(dailyVerse(MIDNIGHT + i * DAY)));
    expect(seen.size).toBe(N);
  });

  it("repeats after a cycle", () => {
    for (const i of [0, 1, 20, N - 1]) expect(dailyVerse(MIDNIGHT + (i + N) * DAY)).toEqual(dailyVerse(MIDNIGHT + i * DAY));
  });

  it("stays the same all day in Jakarta and changes at its midnight", () => {
    const first = key(dailyVerse(MIDNIGHT));
    expect(key(dailyVerse(MIDNIGHT + 12 * 60 * 60 * 1000))).toBe(first);
    expect(key(dailyVerse(MIDNIGHT + DAY - 1))).toBe(first);
    expect(key(dailyVerse(MIDNIGHT + DAY))).not.toBe(first);
    expect(key(dailyVerse(MIDNIGHT - 1))).not.toBe(first);
  });

  it("is a verse of the list for a day before 1970 too", () => {
    expect(VERSES_OF_THE_DAY.some(([s, v]) => key({ surah: s, verse: v }) === key(dailyVerse(Date.UTC(1960, 0, 1))))).toBe(true);
  });
});

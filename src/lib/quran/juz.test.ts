import { describe, expect, it } from "vitest";
import { checkJuzList } from "./juz";
import type { JuzRef, SurahMeta } from "./types";

// A small Qur'an: 114 surahs of 4 verses each would not matter, so give them real-looking but simple counts.
const surah = (number: number, verseCount: number): SurahMeta => ({
  number,
  verseCount,
  name: { arabic: "", latin: "", meaning: {} },
  revelation: "mecca",
  description: {},
});
const SURAHS = Array.from({ length: 114 }, (_, i) => surah(i + 1, 10));

/** 30 juz of 38 verses each (114 x 10 = 1,140 verses), cut where they fall. */
function valid(): JuzRef[] {
  const flat = SURAHS.flatMap((s) => Array.from({ length: s.verseCount }, (_, v) => ({ surah: s.number, verse: v + 1 })));
  return Array.from({ length: 30 }, (_, j) => {
    const slice = flat.slice(j * 38, j * 38 + 38);
    return { juz: j + 1, start: slice[0], end: slice[slice.length - 1] };
  });
}

describe("checkJuzList", () => {
  it("accepts a table that covers the Qur'an in order", () => {
    expect(() => checkJuzList(valid(), SURAHS)).not.toThrow();
  });

  it("refuses the wrong number of juz", () => {
    expect(() => checkJuzList(valid().slice(0, 29), SURAHS)).toThrow(/Expected 30 juz, got 29/);
  });

  it("refuses a juz out of order", () => {
    const list = valid();
    [list[3], list[4]] = [list[4], list[3]];
    expect(() => checkJuzList(list, SURAHS)).toThrow(/Juz 4 is listed as juz 5/);
  });

  it("refuses a verse that does not exist", () => {
    const list = valid();
    list[5].end = { surah: list[5].end.surah, verse: 99 };
    expect(() => checkJuzList(list, SURAHS)).toThrow(/Juz 6 ends at .*:99, which is not a verse/);
    const list2 = valid();
    list2[2].start = { surah: 200, verse: 1 };
    expect(() => checkJuzList(list2, SURAHS)).toThrow(/Juz 3 starts at 200:1/);
  });

  it("refuses a gap or an overlap between juz", () => {
    const gap = valid();
    gap[9].start = { ...gap[9].start, verse: gap[9].start.verse + 1 };
    expect(() => checkJuzList(gap, SURAHS)).toThrow(/Juz 10 starts at .*expected .* \(right after the previous juz\)/);
    const overlap = valid();
    overlap[9].start = { surah: overlap[8].end.surah, verse: overlap[8].end.verse };
    expect(() => checkJuzList(overlap, SURAHS)).toThrow(/Juz 10 starts at/);
  });

  it("refuses a juz that ends before it starts", () => {
    const list = valid();
    list[0].end = { surah: 1, verse: 1 };
    list[0].start = { surah: 2, verse: 1 };
    expect(() => checkJuzList(list, SURAHS)).toThrow(/before it starts|expected 1:1/);
  });

  it("refuses a table that does not reach the end of the last surah", () => {
    const list = valid();
    list[29].end = { surah: 114, verse: 9 };
    expect(() => checkJuzList(list, SURAHS)).toThrow(/The last juz ends at 114:9, not at the end of surah 114/);
  });

  it("checks the first juz starts at 1:1", () => {
    const list = valid();
    list[0].start = { surah: 1, verse: 2 };
    expect(() => checkJuzList(list, SURAHS)).toThrow(/Juz 1 starts at 1:2, expected 1:1/);
  });
});

import { describe, expect, it } from "vitest";
import { checkMushafPages, mushafPageOf } from "./mushaf-pages";
import type { MushafPageRef, SurahMeta } from "./types";

const surah = (number: number, verseCount: number): SurahMeta => ({
  number,
  verseCount,
  name: { arabic: "", latin: "", meaning: {} },
  revelation: "mecca",
  description: {},
});
// 114 surahs of 10 verses: 1,140 verses.
const SURAHS = Array.from({ length: 114 }, (_, i) => surah(i + 1, 10));
const FLAT = SURAHS.flatMap((s) => Array.from({ length: s.verseCount }, (_, v) => ({ surah: s.number, verse: v + 1 })));

/**
 * 604 pages: the first holds 13 verses (1:1 to 2:3, so it spans two surahs, as real pages do), then 524 pages of two
 * verses and 79 of one (13 + 1,048 + 79 = 1,140).
 */
function valid(): MushafPageRef[] {
  const sizes = [13, ...Array(524).fill(2), ...Array(79).fill(1)];
  let at = 0;
  return sizes.map((size, i) => {
    const page = { page: i + 1, start: FLAT[at], end: FLAT[at + size - 1] };
    at += size;
    return page;
  });
}

describe("checkMushafPages", () => {
  it("accepts a table that covers the Qur'an in order, with pages that span surahs", () => {
    const list = valid();
    expect(list[0].end).toEqual({ surah: 2, verse: 3 });
    expect(() => checkMushafPages(list, SURAHS)).not.toThrow();
  });

  it("refuses the wrong number of pages", () => {
    expect(() => checkMushafPages(valid().slice(0, 603), SURAHS)).toThrow(/Expected 604 pages, got 603/);
  });

  it("refuses a page out of order", () => {
    const list = valid();
    [list[9], list[10]] = [list[10], list[9]];
    expect(() => checkMushafPages(list, SURAHS)).toThrow(/Page 10 is listed as page 11/);
  });

  it("refuses a verse that does not exist", () => {
    const list = valid();
    list[4].end = { surah: list[4].end.surah, verse: 11 };
    expect(() => checkMushafPages(list, SURAHS)).toThrow(/Page 5 ends at .*:11, which is not a verse/);
  });

  it("refuses a gap or an overlap between pages", () => {
    const gap = valid();
    gap[100].start = { ...gap[100].start, verse: gap[100].start.verse + 1 };
    expect(() => checkMushafPages(gap, SURAHS)).toThrow(/Page 101 starts at .*expected .* \(right after the previous page\)/);
    const overlap = valid();
    overlap[100].start = overlap[99].end;
    expect(() => checkMushafPages(overlap, SURAHS)).toThrow(/Page 101 starts at/);
  });

  it("refuses a last page that repeats the verse before it", () => {
    const list = valid();
    list[603].end = { surah: 114, verse: 9 };
    list[603].start = { surah: 114, verse: 9 };
    expect(() => checkMushafPages(list, SURAHS)).toThrow(/Page 604 starts at 114:9, expected 114:10/);
  });
});

describe("mushafPageOf", () => {
  const list = valid();

  it("finds the page of the first and the last verse", () => {
    expect(mushafPageOf(list, { surah: 1, verse: 1 })).toBe(1);
    expect(mushafPageOf(list, { surah: 114, verse: 10 })).toBe(604);
  });

  it("finds a verse in the middle of a page and on the edges of a page", () => {
    expect(mushafPageOf(list, { surah: 1, verse: 10 })).toBe(1);
    expect(mushafPageOf(list, { surah: 2, verse: 3 })).toBe(1);
    expect(mushafPageOf(list, { surah: 2, verse: 4 })).toBe(2);
    expect(mushafPageOf(list, { surah: 2, verse: 5 })).toBe(2);
  });

  it("agrees with a plain scan for every verse", () => {
    for (const verse of FLAT) {
      const expected = list.find((p) => FLAT.indexOf(p.start) <= FLAT.indexOf(verse) && FLAT.indexOf(verse) <= FLAT.indexOf(p.end))?.page;
      expect(mushafPageOf(list, verse), `${verse.surah}:${verse.verse}`).toBe(expected);
    }
  });

  it("gives undefined for a verse outside the table", () => {
    expect(mushafPageOf(list, { surah: 115, verse: 1 })).toBeUndefined();
    expect(mushafPageOf(list, { surah: 0, verse: 1 })).toBeUndefined();
  });
});

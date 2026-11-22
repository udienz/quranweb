import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { mushafPageFromSegment, surahFromSegment, verseFromSegment, VERSE_COUNTS } from "./surah-number";

describe("surahFromSegment", () => {
  it("accepts the 114 surahs, also with leading zeros", () => {
    expect(surahFromSegment("1")).toBe(1);
    expect(surahFromSegment("114")).toBe(114);
    expect(surahFromSegment("007")).toBe(7);
  });
  it("refuses anything else", () => {
    for (const s of ["0", "115", "-1", "2.5", "abc", "", " ", "1e2", "0x10", "Infinity", "+5", "5 "]) expect(surahFromSegment(s)).toBeNull();
  });
});

describe("mushafPageFromSegment", () => {
  it("accepts the 604 pages, also with leading zeros", () => {
    expect(mushafPageFromSegment("1")).toBe(1);
    expect(mushafPageFromSegment("604")).toBe(604);
    expect(mushafPageFromSegment("042")).toBe(42);
  });
  it("refuses anything else", () => {
    for (const s of ["0", "605", "-1", "2.5", "abc", "", " ", "1e2", "0x10", "+5", "99999"]) expect(mushafPageFromSegment(s), s).toBeNull();
  });
});

describe("VERSE_COUNTS and verseFromSegment", () => {
  it("has the 114 surahs and 6,236 verses, as the sources do", () => {
    expect(VERSE_COUNTS).toHaveLength(114);
    expect(VERSE_COUNTS.reduce((a, b) => a + b, 0)).toBe(6236);
    const fixture = JSON.parse(readFileSync("e2e/fixtures/api/v2/surat.json", "utf8")).data as { nomor: number; jumlahAyat: number }[];
    expect(fixture.map((s) => s.jumlahAyat)).toEqual([...VERSE_COUNTS]);
  });

  it("accepts the verses of a surah and nothing else", () => {
    expect(verseFromSegment(1, "1")).toBe(1);
    expect(verseFromSegment(1, "7")).toBe(7);
    expect(verseFromSegment(2, "255")).toBe(255);
    expect(verseFromSegment(2, "286")).toBe(286);
    expect(verseFromSegment(2, "0255")).toBe(255);
    for (const bad of ["0", "8", "287", "-1", "2.5", "abc", "", "1e2", "0x1", " 1"]) expect(verseFromSegment(1, bad), bad).toBeNull();
    expect(verseFromSegment(2, "287")).toBeNull();
    expect(verseFromSegment(114, "6")).toBe(6);
    expect(verseFromSegment(114, "7")).toBeNull();
  });
});

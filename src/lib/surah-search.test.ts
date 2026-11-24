import { describe, expect, it } from "vitest";
import type { SurahMeta } from "./quran/types";
import { MAX_SUGGESTIONS, searchSurahs, westernDigits } from "./surah-search";

const surah = (number: number, latin: string, arabic: string, meaning: string): SurahMeta => ({
  number,
  verseCount: 7,
  name: { latin, arabic, meaning: { en: meaning } },
  revelation: "mecca",
  description: {},
});

const SURAHS: SurahMeta[] = [
  surah(1, "Al-Fatihah", "الفاتحة", "The Opening"),
  surah(2, "Al-Baqarah", "البقرة", "The Cow"),
  surah(3, "Ali 'Imran", "آل عمران", "The Family of Imran"),
  surah(4, "An-Nisa'", "النساء", "The Women"),
  surah(5, "Al-Ma'idah", "المائدة", "The Table Spread"),
  surah(6, "Al-An'am", "الأنعام", "The Cattle"),
  surah(36, "Yasin", "يس", "Ya Sin"),
  surah(110, "An-Nasr", "النصر", "Divine Support"),
  surah(112, "Al-Ikhlas", "الإخلاص", "Sincerity"),
  surah(113, "Al-Falaq", "الفلق", "The Daybreak"),
  surah(114, "An-Nas", "الناس", "Mankind"),
];
const meaning = (s: SurahMeta) => s.name.meaning.en;
const find = (query: string, limit?: number) => searchSurahs(SURAHS, query, meaning, limit).map((s) => s.number);

describe("searchSurahs: Latin names", () => {
  it("finds a whole name, with or without the article, hyphen, apostrophe and case", () => {
    expect(find("Al-Baqarah")).toEqual([2]);
    expect(find("al baqarah")).toEqual([2]);
    expect(find("baqarah")).toEqual([2]);
    expect(find("MAIDAH")).toEqual([5]);
    expect(find("al-ma'idah")).toEqual([5]);
    expect(find("nisa")).toEqual([4]);
  });
  it("finds a word of a longer name", () => {
    expect(find("imran")).toEqual([3]);
  });
  it("finds the start of a name as it is typed", () => {
    expect(find("baq")).toEqual([2]);
    expect(find("fat")).toEqual([1]);
    expect(find("ikh")).toEqual([112]);
  });
  it("puts a name that starts with the text before one that only holds it", () => {
    // "nas" starts An-Nasr and An-Nas (as their word) and sits inside none else; the exact word An-Nas comes first.
    expect(find("nas")).toEqual([114, 110]);
  });
  it("ignores accents", () => {
    expect(find("Fātihah")).toEqual([1]);
  });
  it("does not match a single letter inside a name", () => {
    expect(find("t")).toEqual([]);
    expect(find("f")).toEqual([1, 113]);
  });
  it("falls back to the meaning of the name", () => {
    expect(find("opening")).toEqual([1]);
    expect(find("cattle")).toEqual([6]);
  });
});

describe("searchSurahs: Arabic names", () => {
  it("finds a whole name and the name without its article", () => {
    expect(find("البقرة")).toEqual([2]);
    expect(find("بقرة")).toEqual([2]);
  });
  it("finds the start of a name", () => {
    expect(find("الفا")).toEqual([1]);
    expect(find("الن")).toEqual([4, 110, 114]);
  });
  it("ignores vowel marks and the forms of alif, ya and ha", () => {
    expect(find("ٱلْبَقَرَةِ")).toEqual([2]);
    expect(find("البقره")).toEqual([2]);
    expect(find("الاخلاص")).toEqual([112]);
    expect(find("ال عمران")).toEqual([3]);
  });
});

describe("searchSurahs: numbers", () => {
  it("puts the surah with that number first", () => {
    expect(find("2")).toEqual([2]);
    expect(find("36")).toEqual([36]);
  });
  it("then the numbers that start with the digits", () => {
    expect(find("11")).toEqual([110, 112, 113, 114]);
    expect(find("1")).toEqual([1, 110, 112, 113, 114]);
  });
  it("reads leading zeros and Arabic-Indic and Persian digits", () => {
    expect(find("002")).toEqual([2]);
    expect(find("٢")).toEqual([2]);
    expect(find("۳۶")).toEqual([36]);
    expect(westernDigits("٠١٢٣٤٥٦٧٨٩ ۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789 0123456789");
  });
});

describe("searchSurahs: nothing to find", () => {
  it("gives nothing for an empty or blank query", () => {
    expect(find("")).toEqual([]);
    expect(find("   ")).toEqual([]);
  });
  it("gives nothing for text that matches no surah", () => {
    expect(find("zzzz")).toEqual([]);
    expect(find("طط")).toEqual([]);
    expect(find("999")).toEqual([]);
    expect(find("!!!")).toEqual([]);
  });
  it("gives at most the limit", () => {
    expect(find("a", 3)).toHaveLength(3);
    expect(MAX_SUGGESTIONS).toBe(8);
  });
});

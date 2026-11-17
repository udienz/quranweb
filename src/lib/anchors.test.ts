import { describe, expect, it } from "vitest";
import { normalizeHash, pageHref, verseFromHash, verseFromId, verseHref, verseId } from "./anchors";

describe("verse anchors", () => {
  it("builds IDs and links", () => {
    expect(verseId(12)).toBe("verse-12");
    expect(pageHref(2, 1)).toBe("/surah/2");
    expect(pageHref(2, 3)).toBe("/surah/2?page=3");
  });

  it("a verse link carries the page that contains the verse", () => {
    expect(verseHref(2, 5)).toBe("/surah/2#verse-5");
    expect(verseHref(2, 10)).toBe("/surah/2#verse-10");
    expect(verseHref(2, 11)).toBe("/surah/2?page=2#verse-11");
    expect(verseHref(2, 255)).toBe("/surah/2?page=26#verse-255");
  });

  it("reads the verse from a location hash, also a legacy one", () => {
    expect(verseFromHash("#verse-12")).toBe(12);
    expect(verseFromHash("#ayat-12")).toBe(12);
    expect(verseFromHash("#other")).toBeNull();
    expect(verseFromHash("")).toBeNull();
  });

  it("reads the verse number from an element ID", () => {
    expect(verseFromId("verse-40")).toBe(40);
    expect(verseFromId("verse-")).toBeNull();
    expect(verseFromId("ayat-40")).toBeNull();
    expect(verseFromId("verse-4a")).toBeNull();
  });

  it("rewrites legacy Indonesian hashes and leaves everything else alone", () => {
    expect(normalizeHash("#ayat-12")).toBe("#verse-12");
    expect(normalizeHash("#verse-12")).toBe("#verse-12");
    expect(normalizeHash("#ayat-x")).toBe("#ayat-x");
    expect(normalizeHash("")).toBe("");
  });
});

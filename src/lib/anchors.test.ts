import { describe, expect, it } from "vitest";
import { normalizeHash, verseFromId, verseHref, verseId } from "./anchors";

describe("verse anchors", () => {
  it("builds IDs and links", () => {
    expect(verseId(12)).toBe("verse-12");
    expect(verseHref(2, 255)).toBe("/surah/2#verse-255");
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

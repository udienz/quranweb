import { describe, expect, it } from "vitest";
import { ayahNumber, VERSE_COUNTS } from "./ayah-number";

describe("ayahNumber", () => {
  it("has 114 surahs and 6,236 verses", () => {
    expect(VERSE_COUNTS).toHaveLength(114);
    expect(VERSE_COUNTS.reduce((a, b) => a + b, 0)).toBe(6236);
    expect([VERSE_COUNTS[0], VERSE_COUNTS[1], VERSE_COUNTS[8], VERSE_COUNTS[113]]).toEqual([7, 286, 129, 6]);
  });

  it("numbers the verses across the whole Qur'an", () => {
    expect(ayahNumber(1, 1)).toBe(1);
    expect(ayahNumber(1, 7)).toBe(7);
    expect(ayahNumber(2, 1)).toBe(8);
    expect(ayahNumber(2, 255)).toBe(262); // the example in AlQuran.cloud's CDN documentation
    expect(ayahNumber(114, 6)).toBe(6236);
  });

  it("refuses a verse that does not exist", () => {
    expect(() => ayahNumber(1, 8)).toThrow(/no verse 1:8/);
    expect(() => ayahNumber(0, 1)).toThrow();
    expect(() => ayahNumber(115, 1)).toThrow();
    expect(() => ayahNumber(2, 0)).toThrow();
  });
});

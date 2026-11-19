import { describe, expect, it } from "vitest";
import { surahFromSegment } from "./surah-number";

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

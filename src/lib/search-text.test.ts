import { describe, expect, it } from "vitest";
import { foldText, matchesQuery } from "./search-text";

describe("matchesQuery", () => {
  it("ignores case, accents and Arabic vowel marks", () => {
    expect(foldText("Türkçe")).toBe("turkce");
    expect(matchesQuery("Français", "francais")).toBe(true);
    expect(matchesQuery("الْعَرَبِيَّة", "العربية")).toBe(true);
  });

  it("needs every word, in any order, and matches anything when empty", () => {
    expect(matchesQuery("Al-Mukhtasar fi Tafsir (English)", "english mukhtasar")).toBe(true);
    expect(matchesQuery("Al-Mukhtasar fi Tafsir (English)", "english kathir")).toBe(false);
    expect(matchesQuery("Bahasa Indonesia", "  ")).toBe(true);
  });
});

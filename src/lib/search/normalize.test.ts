import { describe, expect, it } from "vitest";
import { arabicExpression, hasArabic, normalizeArabic, queryWords, spellings, wordExpression } from "./normalize";

describe("normalizeArabic", () => {
  it("drops the vowel marks and tatweel and unifies alif, ya and ta marbuta", () => {
    expect(normalizeArabic("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ")).toBe("بسم الله الرحمن الرحيم");
    expect(normalizeArabic("أَإِآ")).toBe("ااا");
    expect(normalizeArabic("مُوسَىٰ")).toBe("موسي");
    expect(normalizeArabic("رَحْمَة")).toBe("رحمه");
    expect(normalizeArabic("الـلـه")).toBe("الله");
  });
  it("leaves Latin text alone", () => {
    expect(normalizeArabic("Allah 2:255")).toBe("Allah 2:255");
  });
});

describe("hasArabic", () => {
  it("tells the script", () => {
    expect(hasArabic("الله")).toBe(true);
    expect(hasArabic("Allah الله")).toBe(true);
    expect(hasArabic("Allah")).toBe(false);
  });
});

describe("queryWords", () => {
  it("lower-cases, splits on anything that is not a letter or a digit and drops a lone letter", () => {
    expect(queryWords("Sabar, dan Shalat!")).toEqual(["sabar", "dan", "shalat"]);
    expect(queryWords("a 40 b")).toEqual(["40"]);
    expect(queryWords("  ")).toEqual([]);
    expect(queryWords("тот, кто")).toEqual(["тот", "кто"]);
  });
});

describe("spellings", () => {
  it("gives the other spellings of a word, also with accents", () => {
    expect(spellings("shalat")).toEqual(expect.arrayContaining(["salat", "sholat", "solat"]));
    expect(spellings("Salāt".toLowerCase())).toContain("shalat");
    expect(spellings("zakat")).toContain("zakah");
    expect(spellings("sabar")).toEqual(["sabar"]);
  });
});

describe("wordExpression", () => {
  it("quotes every word, cuts the last short and offers the spellings of a word", () => {
    expect(wordExpression("sabar")).toBe('"sabar"*');
    expect(wordExpression("sabar dan")).toBe('"sabar" "dan"*');
    expect(wordExpression("shalat")).toBe('("shalat"* OR "salat"* OR "sholat"* OR "solat"* OR "salah"*)');
  });
  it("never lets a word be read as the query language", () => {
    expect(wordExpression('AND OR NOT NEAR "x" ( )')).toBe('"and" "or" "not" "near"*');
    expect(wordExpression("ab* cd-ef")).toBe('"ab" "cd" "ef"*');
  });
  it("is null when nothing is left", () => {
    expect(wordExpression("")).toBeNull();
    expect(wordExpression("a ! ?")).toBeNull();
  });
});

describe("arabicExpression", () => {
  it("is the whole text, normalized, as one quoted phrase", () => {
    expect(arabicExpression("النِّيَّاتِ")).toBe('"النيات"');
    expect(arabicExpression("  الله   اكبر ")).toBe('"الله اكبر"');
  });
  it("is null under three letters", () => {
    expect(arabicExpression("ال")).toBeNull();
    expect(arabicExpression("")).toBeNull();
  });
});

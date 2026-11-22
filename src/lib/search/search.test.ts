import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { VERSE_COUNTS } from "../surah-number";
import { normalizeArabic } from "./normalize";
import { closeSearchIndex, MARK_END, MARK_START, search, searchIndexPath, sourcesFor, SEARCH_FILE } from "./search";

// The index is built from the e2e fixtures (surahs 1, 2 and 112 to 114 with their translations) in a temporary folder.
const fixtures = resolve("e2e/fixtures");
let dir: string;
let index: string;
let builder: { buildSearchIndex: (dir: string) => Promise<Record<string, number>>; normalizeArabic: (s: string) => string; VERSE_COUNTS: number[] };

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "quranweb-search-"));
  symlinkSync(join(fixtures, "api"), join(dir, "api"));
  // The fixtures have no fawazahmed0 editions: a small English one, so the other tables are searched too.
  const english = join(dir, "quran-api", "editions", "eng-abdullahyusufal");
  mkdirSync(english, { recursive: true });
  const verse = (chapter: number, v: number, text: string) => ({ chapter, verse: v, text });
  writeFileSync(join(english, "1.min.json"), JSON.stringify({ chapter: [
    verse(1, 1, "In the name of Allah, Most Gracious, Most Merciful"),
    verse(1, 2, "Praise be to Allah, the Cherisher and Sustainer of the worlds"),
    verse(1, 3, "Most Gracious, Most Merciful"),
  ] }));
  writeFileSync(join(english, "112.min.json"), JSON.stringify({ chapter: [
    verse(112, 1, "Say: He is Allah, the One and Only"),
    verse(112, 2, "Allah, the Eternal, Absolute"),
  ] }));
  // The private QuranEnc copy: a French translation of the first surah, and the same layout as the real one.
  const french = join(dir, "quranenc", "translation", "sura", "french_rashid");
  mkdirSync(french, { recursive: true });
  const enc = (aya: number, translation: string) => ({ sura: "1", aya: String(aya), translation });
  writeFileSync(join(french, "1.json"), JSON.stringify({ result: [
    enc(1, "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux."),
    enc(2, "Louange à Allah, Seigneur de l'univers."),
  ] }));
  // A computed path: TypeScript has no types for the script, and a script is not part of the app.
  const script = resolve("scripts", "build-search-index.mjs");
  builder = await import(/* @vite-ignore */ script);
  await builder.buildSearchIndex(dir);
  index = join(dir, SEARCH_FILE);
});

afterAll(() => closeSearchIndex());

const plain = (snippet: string) => snippet.replaceAll(MARK_START, "").replaceAll(MARK_END, "");
const marked = (snippet: string) => [...snippet.matchAll(new RegExp(`${MARK_START}(.*?)${MARK_END}`, "g"))].map((m) => m[1]);

describe("the index builder", () => {
  it("normalizes Arabic as the app does, and has the same verse table", () => {
    for (const text of ["بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "مُوسَىٰ رَحْمَة أَإِآ الـلـه", "Allah 2:255"]) expect(builder.normalizeArabic(text)).toBe(normalizeArabic(text));
    expect(builder.VERSE_COUNTS).toEqual([...VERSE_COUNTS]);
  });
});

describe("search", () => {
  it("is unavailable without an index", () => {
    expect(search({ query: "sabar", locale: "id" }, null).status).toBe("unavailable");
    expect(search({ query: "sabar", locale: "id" }, join(dir, "nothing.sqlite")).status).toBe("unavailable");
  });

  it("finds a word in the Indonesian translation, marked, with the verse's place", () => {
    const r = search({ query: "sabar", locale: "id" }, index);
    expect(r.status).toBe("ok");
    if (r.status !== "ok") return;
    expect(r.total).toBeGreaterThan(0);
    for (const hit of r.hits) {
      expect(hit.source).toBe("id");
      expect(marked(hit.snippet).join(" ").toLowerCase()).toContain("sabar");
      expect(hit.surah).toBeGreaterThanOrEqual(1);
      expect(hit.verse).toBeLessThanOrEqual(VERSE_COUNTS[hit.surah - 1]);
    }
    expect(r.hits.map((h) => [h.surah, h.verse]).slice(0, 2)).toEqual([[2, 45], [2, 153]]);
  });

  it("shows each hit with the text of its own verse", () => {
    const equran = (surah: number) =>
      (JSON.parse(readFileSync(join(fixtures, "api", "v2", "surat", `${surah}.json`), "utf8")).data.ayat as { nomorAyat: number; teksIndonesia: string }[]);
    const r = search({ query: "sabar", locale: "id" }, index);
    if (r.status !== "ok") throw new Error("no index");
    expect(r.hits.length).toBeGreaterThan(3);
    const snippets = new Set<string>();
    for (const hit of r.hits) {
      const verse = equran(hit.surah).find((a) => a.nomorAyat === hit.verse)!;
      const text = plain(hit.snippet).replace(/^…/, "").replace(/…$/, "");
      expect(verse.teksIndonesia, `${hit.surah}:${hit.verse}`).toContain(text);
      snippets.add(hit.snippet);
    }
    expect(snippets.size).toBe(r.hits.length);
  });

  it("finds the other spellings of a word", () => {
    const shalat = search({ query: "shalat", locale: "id" }, index);
    const salat = search({ query: "salat", locale: "id" }, index);
    if (shalat.status !== "ok" || salat.status !== "ok") throw new Error("no index");
    expect(shalat.total).toBeGreaterThan(0);
    expect(shalat.total).toBe(salat.total);
  });

  it("finds an Arabic word without its vowel marks and with the article attached", () => {
    const r = search({ query: "الرَّحْمَٰنِ", locale: "id" }, index);
    if (r.status !== "ok") throw new Error("no index");
    expect(r.hits[0]).toMatchObject({ surah: 1, verse: 1, source: "ar" });
    expect(marked(r.hits[0].snippet)[0]).toBe("الرحمن");
    // "رحمن" is inside "الرحمن": a substring search finds it.
    const inner = search({ query: "رحمن", locale: "en" }, index);
    if (inner.status !== "ok") throw new Error("no index");
    expect(inner.hits.some((h) => h.surah === 1 && h.verse === 1)).toBe(true);
  });

  it("searches the English translation for an English interface, and the cut-short last word", () => {
    const r = search({ query: "merci", locale: "en" }, index);
    if (r.status !== "ok") throw new Error("no index");
    expect(r.hits.map((h) => [h.surah, h.verse, h.source])).toEqual([[1, 1, "en"], [1, 3, "en"]]);
    expect(marked(r.hits[0].snippet)).toEqual(["Merciful"]);
    expect(plain(r.hits[0].snippet)).toBe("In the name of Allah, Most Gracious, Most Merciful");
  });

  it("limits a search to one surah", () => {
    const all = search({ query: "Allah", locale: "en" }, index);
    const one = search({ query: "Allah", locale: "en", surah: 112 }, index);
    if (all.status !== "ok" || one.status !== "ok") throw new Error("no index");
    // The English edition has "Allah" in four verses and the Indonesian text of the fixtures in many more.
    expect(one.total).toBeGreaterThan(0);
    expect(one.total).toBeLessThan(all.total);
    expect(one.hits.every((h) => h.surah === 112)).toBe(true);
  });

  it("is short for an empty query, a lone letter and three Arabic letters missing", () => {
    for (const query of ["", "  ", "a", "!?", "ال"]) expect(search({ query, locale: "id" }, index).status, query).toBe("short");
  });

  it("finds nothing, without an error, for a query the index cannot read or a word that is not there", () => {
    for (const query of ['"', "(((", "zzzqqqxxx", "NEAR/2 foo", "foo OR bar", "foo*"]) {
      const r = search({ query, locale: "en" }, index);
      expect(r.status === "ok" || r.status === "short", query).toBe(true);
      if (r.status === "ok") expect(r.total).toBe(0);
    }
  });

  it("pages the results, 20 to a page, and keeps the page in range", () => {
    const r = search({ query: "Allah", locale: "en", page: 1 }, index);
    if (r.status !== "ok") throw new Error("no index");
    expect(r.hits).toHaveLength(20);
    expect(r.pages).toBe(Math.ceil(r.total / 20));
    const last = search({ query: "Allah", locale: "en", page: 9999 }, index);
    if (last.status !== "ok") throw new Error("no index");
    expect(last.page).toBe(r.pages);
    expect(last.hits).toHaveLength(r.total - 20 * (r.pages - 1));
    // The pages follow each other in the order of the Qur'an, with no verse twice.
    const second = search({ query: "Allah", locale: "en", page: 2 }, index);
    if (second.status !== "ok") throw new Error("no index");
    const keys = [...r.hits, ...second.hits].map((h) => h.surah * 1000 + h.verse);
    expect(keys).toEqual([...new Set(keys)].sort((a, b) => a - b));
    expect(search({ query: "Allah", locale: "en", page: -3 }, index)).toMatchObject({ page: 1 });
  });
});

describe("sourcesFor", () => {
  it("puts the interface language's translation first, then Indonesian and English, then the transliteration", () => {
    expect(sourcesFor("tr", false)).toEqual(["tr", "id", "en", "translit"]);
    expect(sourcesFor("id", false)).toEqual(["id", "en", "translit"]);
    expect(sourcesFor("en", false)).toEqual(["en", "id", "translit"]);
    expect(sourcesFor("ja", false)).toEqual(["en", "id", "translit"]);
    expect(sourcesFor("tr", true)).toEqual(["ar"]);
    expect(sourcesFor("fr", false)).toEqual(["fr", "id", "en", "translit"]);
    expect(sourcesFor("ur", false)).toEqual(["ur", "id", "en", "translit"]);
  });
});

describe("searchIndexPath", () => {
  it("is next to the mirror when the data is a local folder, and none when it is read from the internet", () => {
    const before = { ...process.env };
    try {
      delete process.env.QURAN_SEARCH_INDEX;
      process.env.QURAN_API_URL = "/data/api/v2";
      expect(searchIndexPath()).toBe("/data/quranweb-search.sqlite");
      process.env.QURAN_API_URL = "https://equran.id/api/v2";
      expect(searchIndexPath()).toBeNull();
      process.env.QURAN_SEARCH_INDEX = "/x/y.sqlite";
      expect(searchIndexPath()).toBe("/x/y.sqlite");
    } finally {
      process.env = before;
    }
  });
});

describe("the translations of the private QuranEnc copy", () => {
  it("are found, shown with the interface language's own text first", () => {
    const outcome = search({ query: "univers", locale: "fr" }, index);
    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.hits.map((h) => `${h.surah}:${h.verse}`)).toEqual(["1:2"]);
    expect(outcome.hits[0].source).toBe("fr");
    expect(plain(outcome.hits[0].snippet)).toContain("Seigneur de l'univers");
  });

  it("are not searched in another interface language", () => {
    const outcome = search({ query: "univers", locale: "en" }, index);
    expect(outcome.status === "ok" && outcome.total).toBe(0);
  });
});

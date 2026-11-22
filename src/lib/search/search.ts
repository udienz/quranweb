// Full-text search over the Arabic text and the translations that are in our mirror, from the SQLite FTS5 index that
// scripts/build-search-index.mjs writes next to the mirror (quranweb-search.sqlite). Server only.
//
// The index exists only where the data is a local folder (our mirror, or the e2e fixtures): with the data read from the
// internet there is nothing to search, and the page says so. A missing file is looked for again on the next search, and a
// file that was replaced (the index is rebuilt and renamed over the old one) is opened again, so a new index is picked up
// without a restart.

import { existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { VERSE_COUNTS } from "../surah-number";
import { arabicExpression, hasArabic, wordExpression } from "./normalize";

export const SEARCH_FILE = "quranweb-search.sqlite";
export const SEARCH_PAGE_SIZE = 20;
/** Start and end of a match in a snippet: control characters, which the texts never contain. */
export const MARK_START = "\u0001";
export const MARK_END = "\u0002";
/** The most verses one table gives for one search; a search that matches more than this is too general to be of use. */
const MAX_CANDIDATES = 3000;

/** The kinds of text that are searched: the Arabic, the transliteration and the translations in the mirror. */
export type SearchSource = "ar" | "translit" | "id" | "en" | "tr" | "ms" | "bn" | "ru";

/** The FTS5 table of each source. A fixed list: a table name is never taken from a request. */
const TABLE: Record<SearchSource, string> = { ar: "ar", translit: "translit", id: "t_id", en: "t_en", tr: "t_tr", ms: "t_ms", bn: "t_bn", ru: "t_ru" };
const OWN_LANGUAGE: readonly string[] = ["tr", "ms", "bn", "ru"];

export interface SearchHit {
  surah: number;
  verse: number;
  /** Which text the match is in, so the page can set its language and direction. */
  source: SearchSource;
  /** The text around the match, with each match between MARK_START and MARK_END. */
  snippet: string;
}

export type SearchOutcome =
  | { status: "unavailable" }
  | { status: "short" }
  | { status: "ok"; total: number; page: number; pages: number; hits: SearchHit[] };

/**
 * Where the index is: `QURAN_SEARCH_INDEX`, else next to the mirror (`QURAN_API_URL` is `<mirror>/api/v2`, so two levels up).
 * Null when the data is not a local folder.
 */
export function searchIndexPath(): string | null {
  if (process.env.QURAN_SEARCH_INDEX) return process.env.QURAN_SEARCH_INDEX;
  const api = process.env.QURAN_API_URL;
  if (!api || /^https?:\/\//i.test(api)) return null;
  const dir = api.startsWith("file://") ? fileURLToPath(api) : api;
  return resolve(dir, "..", "..", SEARCH_FILE);
}

/**
 * The texts to look in, in the order that decides which one a verse is shown with when it matches in several: the interface
 * language's own translation first (where there is one), then Indonesian and English, then the transliteration. Arabic text
 * is searched alone.
 */
export function sourcesFor(locale: string, arabic: boolean): SearchSource[] {
  if (arabic) return ["ar"];
  if (OWN_LANGUAGE.includes(locale)) return [locale as SearchSource, "id", "en", "translit"];
  return locale === "id" ? ["id", "en", "translit"] : ["en", "id", "translit"];
}

/** The verse numbers (in the whole Qur'an) of a surah: from, to. */
function ayahRange(surah: number | undefined): [number, number] {
  if (!surah) return [1, 6236];
  const before = VERSE_COUNTS.slice(0, surah - 1).reduce((a, b) => a + b, 0);
  return [before + 1, before + VERSE_COUNTS[surah - 1]];
}

let open: { path: string; mtime: number; db: DatabaseSync } | null = null;

function openIndex(path: string): DatabaseSync | null {
  if (!existsSync(path)) return null;
  const mtime = statSync(path).mtimeMs;
  if (open && open.path === path && open.mtime === mtime) return open.db;
  try {
    open?.db.close();
  } catch {}
  open = null;
  const db = new DatabaseSync(path, { readOnly: true });
  open = { path, mtime, db };
  return db;
}

/** Close the open index (tests that replace the file). */
export function closeSearchIndex(): void {
  try {
    open?.db.close();
  } catch {}
  open = null;
}

export function search(
  input: { query: string; locale: string; surah?: number; page?: number },
  indexPath: string | null = searchIndexPath(),
): SearchOutcome {
  const db = indexPath ? openIndex(indexPath) : null;
  if (!db) return { status: "unavailable" };

  const arabic = hasArabic(input.query);
  const expression = arabic ? arabicExpression(input.query) : wordExpression(input.query);
  if (!expression) return { status: "short" };

  const [from, to] = ayahRange(input.surah);
  const sources = sourcesFor(input.locale, arabic);

  // Which text each matching verse is shown with: the first source, in order, that matches it.
  const found = new Map<number, SearchSource>();
  try {
    for (const source of sources) {
      const table = TABLE[source];
      const rows = db
        .prepare(`SELECT rowid AS ayah FROM ${table} WHERE ${table} MATCH ? AND rowid BETWEEN ? AND ? ORDER BY rowid LIMIT ${MAX_CANDIDATES}`)
        .all(expression, from, to) as { ayah: number }[];
      for (const { ayah } of rows) if (!found.has(ayah)) found.set(ayah, source);
    }
  } catch {
    // An expression the index cannot read: nothing matches.
    return { status: "ok", total: 0, page: 1, pages: 0, hits: [] };
  }

  const ayahs = [...found.keys()].sort((a, b) => a - b);
  const pages = Math.ceil(ayahs.length / SEARCH_PAGE_SIZE);
  const page = Math.min(Math.max(1, Math.floor(input.page ?? 1)), Math.max(1, pages));
  const slice = ayahs.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE);

  const place = db.prepare("SELECT surah, verse FROM verse WHERE ayah = ?");
  const hits: SearchHit[] = slice.map((ayah) => {
    const source = found.get(ayah)!;
    const table = TABLE[source];
    const where = place.get(ayah) as { surah: number; verse: number };
    const row = db
      .prepare(`SELECT snippet(${table}, -1, '${MARK_START}', '${MARK_END}', '…', 24) AS snippet FROM ${table} WHERE ${table} MATCH ? AND rowid = ?`)
      .get(expression, ayah) as { snippet: string } | undefined;
    return { surah: where.surah, verse: where.verse, source, snippet: row?.snippet ?? "" };
  });
  return { status: "ok", total: ayahs.length, page, pages, hits };
}

/** The folder that holds the index, for messages. */
export const searchIndexDir = (): string | null => {
  const path = searchIndexPath();
  return path ? dirname(path) : null;
};

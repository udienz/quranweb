#!/usr/bin/env node
// Build the search index of the site from the mirror (or the e2e fixtures).
//
//   node scripts/build-search-index.mjs <dir>
//
// Reads <dir>/api/v2/surat/{n}.json (EQuran.id: Arabic, transliteration, Indonesian) and
// <dir>/quran-api/editions/{edition}/{n}.min.json (fawazahmed0) and writes <dir>/quranweb-search.sqlite: one SQLite database
// with a FTS5 table per kind of text, every row numbered by the verse's place in the whole Qur'an (1 to 6,236, `ayah`).
//
// - `ar` holds the Arabic text of two sources without vowel marks and with one form of each letter (normalizeArabic), as
//   trigrams, because Arabic attaches the article and prepositions to a word: a word search for النيات would not find بالنيات,
//   a trigram search does. The app normalizes the query the same way (src/lib/search/normalize.ts, which has a test that the two
//   agree).
// - `translit`, `t_id`, `t_en`, `t_tr`, `t_ms`, `t_bn`, `t_ru` hold the Latin transliteration and the translations as words,
//   compared without accents.
//
// Indexed: the editions in the public mirror, and the translations in our private QuranEnc copy (<dir>/quranenc: French by Rachid
// Maach, Urdu by Junagarhi and Persian by Rowwad; the owner's answer of 2026-11-22). The text goes in as published, markers of
// footnotes included, and the index is not served. Not indexed: what is read live from QuranEnc (the owner's rule of 2026-11-21:
// new translations are not downloaded) and tafsir, Al-Mukhtasar included.
//
// The index is written next to the old one and renamed over it, so a running app never reads a half-written file. A surah
// that is missing from the folder (the e2e fixtures hold only a few) is skipped. Uses node:sqlite (Node.js 24 or later).

import { mkdir, readFile, rename, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

export const SEARCH_FILE = "quranweb-search.sqlite";

/** The verses of each surah, in order (the same table as VERSE_COUNTS in src/lib/surah-number.ts; a test compares them). */
export const VERSE_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88,
  69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

/** The number of the first verse of each surah in the whole Qur'an, minus one. */
const OFFSETS = VERSE_COUNTS.map((_, i) => VERSE_COUNTS.slice(0, i).reduce((a, b) => a + b, 0));

/** Arabic text as it is indexed and searched: no vowel marks or tatweel, one form of alif, ya and ta marbuta. */
export function normalizeArabic(text) {
  return text
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ‎‏]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

/** The translations of fawazahmed0 that are indexed, and the table and column each goes to. */
const FAWAZ = [
  { edition: "ara-quranuthmanihaf", table: "ar", column: "uthmani", arabic: true },
  { edition: "eng-abdullahyusufal", table: "t_en", column: "yusufali" },
  { edition: "eng-mohammedmarmadu", table: "t_en", column: "pickthall" },
  { edition: "tur-diyanetisleri", table: "t_tr", column: "text" },
  { edition: "msa-abdullahmuhamma", table: "t_ms", column: "text" },
  { edition: "ben-muhiuddinkhan", table: "t_bn", column: "text" },
  { edition: "rus-elmirkuliev", table: "t_ru", column: "text" },
];

/** The translations of the private QuranEnc copy that are indexed: <dir>/quranenc/translation/sura/<key>/<surah>.json. */
const QURANENC = [
  { key: "french_rashid", table: "t_fr", column: "text" },
  { key: "urdu_junagarhi", table: "t_ur", column: "text" },
  { key: "persian_ih", table: "t_fa", column: "text" },
];

const WORDS = "unicode61 remove_diacritics 2";

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

/** Build <dir>/quranweb-search.sqlite from the data in <dir>. Returns how many verses of each table were indexed. */
export async function buildSearchIndex(dir) {
  const root = resolve(dir);
  const target = join(root, SEARCH_FILE);
  const temp = `${target}.tmp-${process.pid}`;
  await mkdir(root, { recursive: true });
  await rm(temp, { force: true });

  const done = {};
  const count = (key) => (done[key] = (done[key] ?? 0) + 1);

  const db = new DatabaseSync(temp);
  try {
    db.exec(`
      PRAGMA journal_mode = OFF;
      CREATE TABLE verse (ayah INTEGER PRIMARY KEY, surah INTEGER NOT NULL, verse INTEGER NOT NULL);
      CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE VIRTUAL TABLE ar USING fts5(equran, uthmani, tokenize = 'trigram');
      CREATE VIRTUAL TABLE translit USING fts5(text, tokenize = '${WORDS}');
      CREATE VIRTUAL TABLE t_id USING fts5(text, tokenize = '${WORDS}');
      CREATE VIRTUAL TABLE t_en USING fts5(yusufali, pickthall, tokenize = '${WORDS}');
      CREATE VIRTUAL TABLE t_tr USING fts5(text, tokenize = '${WORDS}');
      CREATE VIRTUAL TABLE t_ms USING fts5(text, tokenize = '${WORDS}');
      CREATE VIRTUAL TABLE t_bn USING fts5(text, tokenize = '${WORDS}');
      CREATE VIRTUAL TABLE t_ru USING fts5(text, tokenize = '${WORDS}');
      CREATE VIRTUAL TABLE t_fr USING fts5(text, tokenize = '${WORDS}');
      CREATE VIRTUAL TABLE t_ur USING fts5(text, tokenize = '${WORDS}');
      CREATE VIRTUAL TABLE t_fa USING fts5(text, tokenize = '${WORDS}');
    `);

    // One row per verse in every table, so every table can be asked about any verse; a text that is missing stays empty.
    const rows = {}; // table -> ayah -> { column: text }
    const set = (table, ayah, column, text) => ((rows[table] ??= {})[ayah] ??= {})[column] = text;
    for (let surah = 1; surah <= 114; surah++) {
      const equran = await readJson(join(root, "api", "v2", "surat", `${surah}.json`));
      for (const a of equran?.data?.ayat ?? []) {
        const ayah = OFFSETS[surah - 1] + a.nomorAyat;
        set("ar", ayah, "equran", normalizeArabic(a.teksArab ?? ""));
        set("translit", ayah, "text", a.teksLatin ?? "");
        set("t_id", ayah, "text", a.teksIndonesia ?? "");
        count("equran");
      }
      for (const { edition, table, column, arabic } of FAWAZ) {
        const data = await readJson(join(root, "quran-api", "editions", edition, `${surah}.min.json`));
        for (const v of data?.chapter ?? []) {
          const ayah = OFFSETS[surah - 1] + v.verse;
          set(table, ayah, column, arabic ? normalizeArabic(v.text ?? "") : (v.text ?? ""));
          count(edition);
        }
      }
      for (const { key, table, column } of QURANENC) {
        const data = await readJson(join(root, "quranenc", "translation", "sura", key, `${surah}.json`));
        for (const v of data?.result ?? []) {
          if (Number(v.sura) !== surah) continue;
          set(table, OFFSETS[surah - 1] + Number(v.aya), column, String(v.translation ?? "").trim());
          count(key);
        }
      }
    }

    const columns = {
      ar: ["equran", "uthmani"],
      translit: ["text"],
      t_id: ["text"],
      t_en: ["yusufali", "pickthall"],
      t_tr: ["text"],
      t_ms: ["text"],
      t_bn: ["text"],
      t_ru: ["text"],
      t_fr: ["text"],
      t_ur: ["text"],
      t_fa: ["text"],
    };
    db.exec("BEGIN");
    const insertVerse = db.prepare("INSERT INTO verse (ayah, surah, verse) VALUES (?, ?, ?)");
    for (let surah = 1; surah <= 114; surah++) {
      for (let verse = 1; verse <= VERSE_COUNTS[surah - 1]; verse++) insertVerse.run(OFFSETS[surah - 1] + verse, surah, verse);
    }
    for (const [table, cols] of Object.entries(columns)) {
      const insert = db.prepare(`INSERT INTO ${table} (rowid, ${cols.join(", ")}) VALUES (?, ${cols.map(() => "?").join(", ")})`);
      for (const [ayah, texts] of Object.entries(rows[table] ?? {})) insert.run(Number(ayah), ...cols.map((c) => texts[c] ?? ""));
    }
    db.prepare("INSERT INTO meta (key, value) VALUES ('built', ?)").run(new Date().toISOString());
    db.exec("COMMIT");
    for (const table of Object.keys(columns)) db.exec(`INSERT INTO ${table}(${table}) VALUES ('optimize')`);
    db.close();
    await rename(temp, target);
  } catch (error) {
    try {
      db.close();
    } catch {}
    await rm(temp, { force: true });
    throw error;
  }
  return done;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: node scripts/build-search-index.mjs <dir>   (the mirror directory, with api/v2 and quran-api)");
    process.exit(2);
  }
  const started = Date.now();
  const done = await buildSearchIndex(dir);
  console.log(`wrote ${join(resolve(dir), SEARCH_FILE)} in ${((Date.now() - started) / 1000).toFixed(1)} s`);
  for (const [key, n] of Object.entries(done)) console.log(`  ${key}: ${n} verses`);
}

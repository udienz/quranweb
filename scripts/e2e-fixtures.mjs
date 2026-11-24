#!/usr/bin/env node
// Copy the small part of the data mirror that the browser tests (e2e/) read into e2e/fixtures, so CI needs no network and
// no server. Run it again when a test needs another surah, and commit the result.
//
//   node scripts/e2e-fixtures.mjs [/srv/quranweb-mirror]
//
// What is copied: the EQuran.id surah list, the text and tafsir of the surahs the tests use, fawazahmed0's editions.json,
// and info.json reduced to what the app reads from it (the English surah meanings, the juz boundaries and the 604 mushaf pages).
// And a made-up QUL copy (see below).

import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const MIRROR = process.argv[2] ?? "/srv/quranweb-mirror";
const OUT = new URL("../e2e/fixtures/", import.meta.url).pathname;
export const SURAHS = [1, 2, 112, 113, 114];

async function copy(rel) {
  await mkdir(dirname(join(OUT, rel)), { recursive: true });
  await copyFile(join(MIRROR, rel), join(OUT, rel));
}

await rm(OUT, { recursive: true, force: true });
await copy("api/v2/surat.json");
for (const n of SURAHS) {
  await copy(`api/v2/surat/${n}.json`);
  await copy(`api/v2/tafsir/${n}.json`);
}
await copy("quran-api/editions.json");
const info = JSON.parse(await readFile(join(MIRROR, "quran-api/info.json"), "utf8"));
const slim = {
  chapters: info.chapters.map((c) => ({ chapter: c.chapter, englishname: c.englishname })),
  juzs: info.juzs,
  pages: info.pages,
};
await writeFile(join(OUT, "quran-api/info.json"), JSON.stringify(slim));
// The QuranEnc copy is private and not needed: the tests read no QuranEnc edition. The directory exists so the provider
// reads files (and finds none) instead of calling the live API.
await mkdir(join(OUT, "quranenc"), { recursive: true });
await writeFile(join(OUT, "quranenc/README"), "Empty on purpose: the browser tests use no QuranEnc edition.\n");
// The QUL copy is private (QUL publishes no licence), so it is not copied into this public repository. A made-up one in its
// format stands in: the tajweed "text" is the EQuran.id Arabic of the fixture surahs with its first word marked `ghunnah`,
// and every surah is one ruku. Enough to test that the colours, the ع mark and their settings work.
const surahList = JSON.parse(await readFile(join(MIRROR, "api/v2/surat.json"), "utf8")).data;
await mkdir(join(OUT, "qul/tajweed"), { recursive: true });
for (const n of SURAHS) {
  const surah = JSON.parse(await readFile(join(MIRROR, `api/v2/surat/${n}.json`), "utf8")).data;
  const verses = surah.ayat.map((a) => {
    const [first, ...rest] = a.teksArab.split(" ");
    return { verse: a.nomorAyat, runs: rest.length ? [[first, "ghunnah"], [` ${rest.join(" ")}`]] : [[first, "ghunnah"]] };
  });
  await writeFile(join(OUT, `qul/tajweed/${n}.json`), JSON.stringify({ surah: n, verses }));
}
const rukus = surahList.map((s) => ({ ruku: s.nomor, start: { chapter: s.nomor, verse: 1 }, end: { chapter: s.nomor, verse: s.jumlahAyat } }));
await writeFile(join(OUT, "qul/ruku.json"), JSON.stringify({ count: rukus.length, references: rukus }));
console.log(`fixtures written to ${OUT}`);

#!/usr/bin/env node
// Sync a static mirror of the EQuran.id API v2 text as JSON files.
//
//   node scripts/sync-mirror.mjs [--out mirror] [--only 1,2,114] [--delay 500] [--force]
//
// Output (under <out>/api/v2/):
//   surat.json          the list of 114 surahs      <- GET /surat
//   surat/<n>.json      a surah with its verses     <- GET /surat/<n>
//   tafsir/<n>.json     the tafsir per verse        <- GET /tafsir/<n>
//   ../../MANIFEST.json when it was fetched, number of requests, data source
//
// Serve it with nginx (see scripts/mirror-nginx.conf.example) and set QURAN_API_URL to
// https://<domain>/api/v2. The app code does not change.
//
// Polite to the source: sequential (no parallel requests), a pause between requests,
// a clear User-Agent, Retry-After is honoured, and files that are already valid are
// skipped unless --force is given. Scope: text only; audio is NOT copied.
//
// No dependencies, needs Node 18+.

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";

const { values: opt } = parseArgs({
  options: {
    out: { type: "string", default: "mirror" },
    base: { type: "string", default: "https://equran.id/api/v2" },
    only: { type: "string" },
    delay: { type: "string", default: "500" },
    force: { type: "boolean", default: false },
  },
});

const BASE = opt.base.replace(/\/$/, "");
const DELAY = Number(opt.delay);
const API_DIR = join(opt.out, "api", "v2");
const UA = "quranweb-mirror-sync (+https://quranweb.udienz.web.id)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(path) {
  const url = `${BASE}${path}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (res.ok) return await res.json();
      if (res.status === 429 || res.status >= 500) {
        const wait = Number(res.headers.get("retry-after")) * 1000 || 2000 * attempt;
        console.warn(`  ${url} -> ${res.status}, retrying in ${wait} ms`);
        await sleep(wait);
        continue;
      }
      throw new Error(`${url} -> HTTP ${res.status}`);
    } catch (err) {
      if (attempt === 5) throw err;
      await sleep(2000 * attempt);
    }
  }
  throw new Error(`${url} failed after 5 attempts`);
}

// Atomic write: write to a temporary file, then rename, so that nginx never serves a
// half-written file.
async function writeJson(file, data) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(data));
  await rename(tmp, file);
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

function assertEnvelope(json, what) {
  if (!json || json.code !== 200 || json.data == null) {
    throw new Error(`${what}: the response is not a valid {code:200,data} envelope`);
  }
  return json;
}

const checks = {
  list(json) {
    if (!Array.isArray(json.data) || json.data.length !== 114) {
      throw new Error(`the surah list must have 114 items, got ${json.data?.length}`);
    }
  },
  surat(json, n) {
    const d = json.data;
    if (d.nomor !== n || !Array.isArray(d.ayat) || d.ayat.length !== d.jumlahAyat) {
      throw new Error(`surah ${n}: the number or the verse count does not match`);
    }
    for (const a of d.ayat) {
      if (!a.teksArab || !a.teksIndonesia || !a.audio) throw new Error(`surah ${n} verse ${a.nomorAyat}: an empty field`);
    }
  },
  tafsir(json, n) {
    const d = json.data;
    if (d.nomor !== n || !Array.isArray(d.tafsir) || d.tafsir.length !== d.jumlahAyat) {
      throw new Error(`tafsir ${n}: the number or the verse count does not match`);
    }
  },
};

async function sync(path, file, check, n) {
  if (!opt.force) {
    const existing = await readJson(file);
    if (existing) {
      try {
        check(assertEnvelope(existing, path), n);
        console.log(`skip   ${path} (already there and valid)`);
        return false;
      } catch {
        /* broken file: fetch it again */
      }
    }
  }
  const json = assertEnvelope(await fetchJson(path), path);
  check(json, n);
  await writeJson(file, json);
  console.log(`ok     ${path}`);
  await sleep(DELAY);
  return true;
}

const numbers = opt.only
  ? opt.only.split(",").map((s) => Number(s.trim()))
  : Array.from({ length: 114 }, (_, i) => i + 1);
if (numbers.some((n) => !Number.isInteger(n) || n < 1 || n > 114)) {
  console.error("--only must be a comma-separated list of surah numbers from 1 to 114");
  process.exit(2);
}

let fetched = 0;
if (await sync("/surat", join(API_DIR, "surat.json"), checks.list)) fetched++;
for (const n of numbers) {
  if (await sync(`/surat/${n}`, join(API_DIR, "surat", `${n}.json`), checks.surat, n)) fetched++;
  if (await sync(`/tafsir/${n}`, join(API_DIR, "tafsir", `${n}.json`), checks.tafsir, n)) fetched++;
}

await writeJson(join(opt.out, "MANIFEST.json"), {
  fetchedAt: new Date().toISOString(),
  source: BASE,
  surahs: numbers.length,
  requestsMade: fetched,
  attribution: {
    quranText: "Indonesian Ministry of Religious Affairs (Kemenag), via EQuran.id",
    notes: "The translation and tafsir belong to their owners. Credit the source (EQuran.id) when showing them.",
  },
});
console.log(`\nDone: ${fetched} new requests, ${numbers.length} surahs in ${API_DIR}`);

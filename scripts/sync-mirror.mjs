#!/usr/bin/env node
// Sinkronisasi mirror teks eQuran.id API v2 ke file JSON statis.
//
//   node scripts/sync-mirror.mjs [--out mirror] [--only 1,2,114] [--delay 500] [--force]
//
// Hasil (di bawah <out>/api/v2/):
//   surat.json          daftar 114 surat       <- GET /surat
//   surat/<n>.json      detail surat + ayat    <- GET /surat/<n>
//   tafsir/<n>.json     tafsir per ayat        <- GET /tafsir/<n>
//   ../../MANIFEST.json waktu ambil, jumlah file, sumber data
//
// Sajikan dengan nginx (lihat scripts/mirror-nginx.conf.example), lalu set
// QURAN_API_URL ke https://<domain>/api/v2. Kode aplikasi tidak berubah.
//
// Sopan terhadap sumber: berurutan (tanpa paralel), jeda antar request,
// User-Agent yang jelas, hormati Retry-After, dan lewati file yang sudah
// valid kecuali --force. Cakupan: hanya teks; audio TIDAK disalin.
//
// Tanpa dependensi, butuh Node 18+.

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
        console.warn(`  ${url} -> ${res.status}, coba lagi dalam ${wait} ms`);
        await sleep(wait);
        continue;
      }
      throw new Error(`${url} -> HTTP ${res.status}`);
    } catch (err) {
      if (attempt === 5) throw err;
      await sleep(2000 * attempt);
    }
  }
  throw new Error(`${url} gagal setelah 5 percobaan`);
}

// Tulis atomik: tulis ke file sementara lalu rename, supaya nginx tidak pernah
// menyajikan file setengah jadi.
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
    throw new Error(`${what}: respons bukan envelope {code:200,data} yang valid`);
  }
  return json;
}

const checks = {
  list(json) {
    if (!Array.isArray(json.data) || json.data.length !== 114) {
      throw new Error(`daftar surat harus 114 item, dapat ${json.data?.length}`);
    }
  },
  surat(json, n) {
    const d = json.data;
    if (d.nomor !== n || !Array.isArray(d.ayat) || d.ayat.length !== d.jumlahAyat) {
      throw new Error(`surat ${n}: nomor atau jumlah ayat tidak cocok`);
    }
    for (const a of d.ayat) {
      if (!a.teksArab || !a.teksIndonesia || !a.audio) throw new Error(`surat ${n} ayat ${a.nomorAyat}: field kosong`);
    }
  },
  tafsir(json, n) {
    const d = json.data;
    if (d.nomor !== n || !Array.isArray(d.tafsir) || d.tafsir.length !== d.jumlahAyat) {
      throw new Error(`tafsir ${n}: nomor atau jumlah ayat tidak cocok`);
    }
  },
};

async function sync(path, file, check, n) {
  if (!opt.force) {
    const existing = await readJson(file);
    if (existing) {
      try {
        check(assertEnvelope(existing, path), n);
        console.log(`lewati ${path} (sudah ada dan valid)`);
        return false;
      } catch {
        /* file rusak: ambil ulang */
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
  console.error("--only harus berisi nomor surat 1-114 dipisah koma");
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
    quranText: "Kementerian Agama Republik Indonesia (via EQuran.id)",
    notes: "Terjemahan dan tafsir dilindungi hak cipta pemiliknya. Cantumkan sumber (EQuran.id) saat menampilkan.",
  },
});
console.log(`\nSelesai: ${fetched} request baru, ${numbers.length} surat di ${API_DIR}`);

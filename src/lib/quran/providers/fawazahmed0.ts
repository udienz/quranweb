// Adaptor fawazahmed0/quran-api (https://github.com/fawazahmed0/quran-api).
// Repo berlisensi Unlicense, tetapi tiap edisi punya sumber aslinya sendiri
// (field `source` di editions.json): cek lisensinya sebelum mengaktifkan edisi
// baru dan catat di daftar sumber (project/quranweb/ROADMAP.md, repo workspace).
//
// Hanya teks: tidak ada audio, tidak ada metadata surat (daftar surat tetap dari
// provider lain). Format per surat: {"chapter":[{"chapter":1,"verse":1,"text":"…"}]}.
// Base URL bisa diarahkan ke mirror sendiri yang berstruktur sama (QURAN_FAWAZ_URL).

import type { TextProvider } from "../provider";
import type { Edition, EditionText } from "../types";

export const FAWAZ_API_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1";
// Cadangan: repo ini sekitar 4,2 GB sehingga jsDelivr kadang menolak berkas tertentu
// ("Package size exceeded the configured limit of 50 MB", diamati pada
// editions/ind-indonesianislam/45.min.json). Lihat catatan di createFawazTextProvider.
export const FAWAZ_RAW_URL = "https://raw.githubusercontent.com/fawazahmed0/quran-api/1";

const via = "melalui fawazahmed0/quran-api";

/**
 * Edisi yang diaktifkan. ID = nama edisi di fawazahmed0 (`{iso3}-{nama}`).
 * Menambah edisi = tambah satu baris di sini setelah lisensinya dicek.
 */
export const FAWAZ_EDITIONS: Edition[] = [
  {
    id: "ara-quranuthmanihaf",
    kind: "arabic",
    language: "ar",
    direction: "rtl",
    name: "Arab Uthmani Hafs",
    author: "Quran Complex (Raja Fahd)",
    source: {
      name: "fawazahmed0/quran-api",
      url: "https://qurancomplex.gov.sa/",
      attribution: `King Fahd Quran Complex, ${via}`,
    },
  },
  {
    id: "ind-indonesianislam",
    kind: "translation",
    language: "id",
    direction: "ltr",
    name: "Terjemahan Kemenag RI (QuranEnc)",
    author: "Kementerian Agama RI",
    source: {
      name: "fawazahmed0/quran-api",
      url: "https://quranenc.com/check/indonesian_affairs/v1",
      attribution: `Kementerian Agama RI melalui QuranEnc, ${via}`,
    },
  },
  {
    // Teksnya bersifat menjelaskan (rata-rata sekitar 400 huruf per ayat), jadi
    // digolongkan tafsir. Perlu dipastikan pemilik.
    id: "ind-muhammadquraish",
    kind: "tafsir",
    language: "id",
    direction: "ltr",
    name: "Tafsir Quraish Shihab dkk.",
    author: "Muhammad Quraish Shihab dkk.",
    source: {
      name: "fawazahmed0/quran-api",
      url: "http://tanzil.net",
      attribution: `Muhammad Quraish Shihab dkk. via Tanzil, ${via}`,
    },
  },
  {
    id: "ind-jalaladdinalmah",
    kind: "tafsir",
    language: "id",
    direction: "ltr",
    name: "Tafsir Jalalayn",
    author: "Jalaluddin al-Mahalli dan Jalaluddin as-Suyuthi",
    source: {
      name: "fawazahmed0/quran-api",
      url: "http://tanzil.net",
      attribution: `Jalaluddin al-Mahalli dan Jalaluddin as-Suyuthi via Tanzil, ${via}`,
    },
  },
  {
    id: "eng-abdullahyusufal",
    kind: "translation",
    language: "en",
    direction: "ltr",
    name: "Translation by Yusuf Ali",
    author: "Abdullah Yusuf Ali",
    source: {
      name: "fawazahmed0/quran-api",
      url: "http://tanzil.net",
      attribution: `Abdullah Yusuf Ali via Tanzil, ${via}`,
    },
  },
  {
    id: "eng-mohammedmarmadu",
    kind: "translation",
    language: "en",
    direction: "ltr",
    name: "Translation by Pickthall",
    author: "Mohammed Marmaduke William Pickthall",
    source: {
      name: "fawazahmed0/quran-api",
      url: "http://tanzil.net",
      attribution: `Mohammed Marmaduke William Pickthall via Tanzil, ${via}`,
    },
  },
];

interface RawChapter {
  chapter: { chapter: number; verse: number; text: string }[];
}

export interface FawazOptions {
  /**
   * Base URL tunggal, mis. mirror sendiri; kalau diisi, hanya ini yang dipakai.
   * Kosong = jsDelivr, lalu raw GitHub sebagai cadangan. Untuk produksi sebaiknya
   * mirror sendiri (QURAN_FAWAZ_URL), bukan CDN publik.
   */
  baseUrl?: string;
}

async function fetchChapter(bases: string[], edition: string, surah: number): Promise<RawChapter> {
  // README fawazahmed0: sediakan fallback `.min.json` <-> `.json`; kita tambah
  // fallback antar base URL (jsDelivr lalu raw GitHub).
  const urls = bases.flatMap((base) => [
    `${base}/editions/${edition}/${surah}.min.json`,
    `${base}/editions/${edition}/${surah}.json`,
  ]);
  const errors: string[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      return (await res.json()) as RawChapter;
    } catch (err) {
      errors.push(`${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(`Gagal memuat ${edition} surat ${surah} (${errors.join("; ")})`);
}

export function createFawazTextProvider(options: FawazOptions = {}): TextProvider {
  const bases = (options.baseUrl ? [options.baseUrl] : [FAWAZ_API_URL, FAWAZ_RAW_URL]).map((b) => b.replace(/\/$/, ""));
  const known = new Set(FAWAZ_EDITIONS.map((e) => e.id));

  return {
    id: "fawazahmed0",
    editions: () => FAWAZ_EDITIONS,

    async text(edition, surah): Promise<EditionText> {
      if (!known.has(edition)) throw new Error(`Provider fawazahmed0 tidak melayani edisi "${edition}"`);
      const raw = await fetchChapter(bases, edition, surah);
      if (!Array.isArray(raw.chapter) || raw.chapter.some((v) => v.chapter !== surah)) {
        throw new Error(`Respons ${edition} surat ${surah} tidak sesuai format`);
      }
      return {
        edition,
        surah,
        verses: raw.chapter.map((v) => ({ number: v.verse, text: v.text.trim() })),
      };
    },
  };
}

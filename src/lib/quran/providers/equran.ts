// Adaptor EQuran.id API v2 (https://equran.id/apidev/v2). Bisa diarahkan ke
// mirror sendiri yang berformat sama lewat `baseUrl` (env QURAN_API_URL).
// Sumber ayat dan tafsir: Kementerian Agama RI; audio: Verse By Verse Quran.

import { cache } from "react";
import type { AudioProvider, TextProvider } from "../provider";
import type { Edition, EditionText, Qari, SourceInfo, SurahMeta } from "../types";

export const EQURAN_API_URL = "https://equran.id/api/v2";
export const EQURAN_AUDIO_URL = "https://cdn.equran.id";

const SOURCE: SourceInfo = {
  name: "EQuran.id",
  url: "https://equran.id",
  attribution: "Kementerian Agama RI, melalui EQuran.id",
};

export const EQURAN_EDITIONS: Edition[] = [
  {
    id: "ara-equran",
    kind: "arabic",
    language: "ar",
    direction: "rtl",
    name: "Teks Arab",
    source: SOURCE,
  },
  {
    id: "ara-equran-la",
    kind: "transliteration",
    language: "ar",
    direction: "ltr",
    name: "Transliterasi Latin",
    source: SOURCE,
  },
  {
    id: "ind-kemenag",
    kind: "translation",
    language: "id",
    direction: "ltr",
    name: "Terjemahan Kemenag RI",
    author: "Kementerian Agama RI",
    source: SOURCE,
  },
  {
    id: "ind-kemenag-tafsir",
    kind: "tafsir",
    language: "id",
    direction: "ltr",
    name: "Tafsir Kemenag RI",
    author: "Kementerian Agama RI",
    source: SOURCE,
  },
];

// Kunci qari di API EQuran ("01".."06") dan nama folder di CDN-nya.
const QARIS = [
  { id: "abdullah-al-juhany", name: "Abdullah Al-Juhany", folder: "Abdullah-Al-Juhany" },
  { id: "abdul-muhsin-al-qasim", name: "Abdul Muhsin Al-Qasim", folder: "Abdul-Muhsin-Al-Qasim" },
  { id: "abdurrahman-as-sudais", name: "Abdurrahman As-Sudais", folder: "Abdurrahman-as-Sudais" },
  { id: "ibrahim-al-dossari", name: "Ibrahim Al-Dossari", folder: "Ibrahim-Al-Dossari" },
  { id: "misyari-rasyid-al-afasi", name: "Misyari Rasyid Al-Afasi", folder: "Misyari-Rasyid-Al-Afasi" },
  { id: "yasser-al-dosari", name: "Yasser Al-Dosari", folder: "Yasser-Al-Dosari" },
];

const AUDIO_SOURCE: SourceInfo = {
  name: "Verse By Verse Quran, melalui EQuran.id",
  url: "https://equran.id",
  attribution: "Verse By Verse Quran, melalui EQuran.id",
};

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

interface RawSurah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
}

interface RawAyat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
}

interface RawSurahDetail extends RawSurah {
  ayat: RawAyat[];
}

interface RawTafsir {
  tafsir: { ayat: number; teks: string }[];
}

// Dibungkus cache() React supaya satu permintaan halaman yang butuh beberapa
// edisi dari surat yang sama (Arab, Latin, terjemahan) hanya mengambil sekali.
// Di luar React Server Components fungsi ini langsung dipanggil apa adanya.
const fetchData = cache(async (url: string): Promise<unknown> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal memuat ${url} (status ${res.status})`);
  const json = (await res.json()) as ApiEnvelope<unknown>;
  if (json.code !== 200 || json.data == null) throw new Error(`Respons tidak valid dari ${url}`);
  return json.data;
});

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toRevelation(place: string): SurahMeta["revelation"] {
  if (place === "Mekah") return "mecca";
  if (place === "Madinah") return "medina";
  throw new Error(`Tempat turun tidak dikenal: "${place}"`);
}

export function toSurahMeta(raw: RawSurah): SurahMeta {
  return {
    number: raw.nomor,
    ayatCount: raw.jumlahAyat,
    name: { arabic: raw.nama, latin: raw.namaLatin, meaning: { id: raw.arti } },
    revelation: toRevelation(raw.tempatTurun),
    description: { id: stripHtml(raw.deskripsi) },
  };
}

export interface EquranOptions {
  baseUrl?: string;
  audioBaseUrl?: string;
}

const trimSlash = (s: string) => s.replace(/\/$/, "");

export function createEquranTextProvider(options: EquranOptions = {}): TextProvider {
  const base = trimSlash(options.baseUrl || EQURAN_API_URL);

  return {
    id: "equran",
    editions: () => EQURAN_EDITIONS,

    async surahs() {
      const list = (await fetchData(`${base}/surat`)) as RawSurah[];
      return list.map(toSurahMeta);
    },

    async text(edition, surah): Promise<EditionText> {
      if (edition === "ind-kemenag-tafsir") {
        const raw = (await fetchData(`${base}/tafsir/${surah}`)) as RawTafsir;
        return {
          edition,
          surah,
          verses: raw.tafsir.map((t) => ({ number: t.ayat, text: t.teks.trim() })),
        };
      }

      const pick: Record<string, (a: RawAyat) => string> = {
        "ara-equran": (a) => a.teksArab,
        "ara-equran-la": (a) => a.teksLatin,
        "ind-kemenag": (a) => a.teksIndonesia,
      };
      const field = pick[edition];
      if (!field) throw new Error(`Provider equran tidak melayani edisi "${edition}"`);

      const raw = (await fetchData(`${base}/surat/${surah}`)) as RawSurahDetail;
      return {
        edition,
        surah,
        verses: raw.ayat.map((a) => ({ number: a.nomorAyat, text: field(a).trim() })),
      };
    },
  };
}

export function createEquranAudioProvider(options: EquranOptions = {}): AudioProvider {
  const base = trimSlash(options.audioBaseUrl || EQURAN_AUDIO_URL);
  const qaris: Qari[] = QARIS.map((q) => ({ id: q.id, name: q.name, source: AUDIO_SOURCE }));
  const pad = (n: number) => String(n).padStart(3, "0");

  return {
    id: "equran-audio",
    qaris: () => qaris,
    urls(qari, surah, ayat) {
      const found = QARIS.find((q) => q.id === qari);
      if (!found) throw new Error(`Provider equran-audio tidak melayani qari "${qari}"`);
      return [`${base}/audio-partial/${found.folder}/${pad(surah)}${pad(ayat)}.mp3`];
    },
  };
}

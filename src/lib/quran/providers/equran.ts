// Adapter for the EQuran.id API v2 (https://equran.id/apidev/v2). It can also be
// pointed to our own mirror of the same format through `baseUrl` (QURAN_API_URL).
// Verses and tafsir come from the Indonesian Ministry of Religious Affairs (Kemenag);
// the audio is by Verse By Verse Quran. The field names below (nomor, namaLatin, ...)
// are the API's own and are only used inside this file.

import { cache } from "react";
import type { AudioProvider, TextProvider } from "../provider";
import type { Edition, EditionText, Qari, SourceInfo, SurahMeta } from "../types";

export const EQURAN_API_URL = "https://equran.id/api/v2";
export const EQURAN_AUDIO_URL = "https://cdn.equran.id";

const SOURCE: SourceInfo = {
  name: "EQuran.id",
  url: "https://equran.id",
  attribution: {
    en: "Indonesian Ministry of Religious Affairs (Kemenag), via EQuran.id",
    id: "Kementerian Agama RI, melalui EQuran.id",
  },
};

export const EQURAN_EDITIONS: Edition[] = [
  {
    id: "ara-equran",
    kind: "arabic",
    language: "ar",
    direction: "rtl",
    name: { en: "Arabic text (EQuran.id)", id: "Teks Arab (EQuran.id)" },
    source: SOURCE,
  },
  {
    id: "ara-equran-la",
    kind: "transliteration",
    language: "ar",
    direction: "ltr",
    name: { en: "Latin transliteration", id: "Transliterasi Latin" },
    source: SOURCE,
  },
  {
    id: "ind-kemenag",
    kind: "translation",
    language: "id",
    direction: "ltr",
    name: { en: "Indonesian translation (Kemenag)", id: "Terjemahan Kemenag RI" },
    author: "Kementerian Agama RI",
    source: SOURCE,
  },
  {
    id: "ind-kemenag-tafsir",
    kind: "tafsir",
    language: "id",
    direction: "ltr",
    name: { en: "Tafsir (Kemenag, Indonesian)", id: "Tafsir Kemenag RI" },
    author: "Kementerian Agama RI",
    source: SOURCE,
  },
];

// The API's reciter keys ("01".."06") map to these folders on its CDN.
const QARIS = [
  { id: "abdullah-al-juhany", name: "Abdullah Al-Juhany", folder: "Abdullah-Al-Juhany" },
  { id: "abdul-muhsin-al-qasim", name: "Abdul Muhsin Al-Qasim", folder: "Abdul-Muhsin-Al-Qasim" },
  { id: "abdurrahman-as-sudais", name: "Abdurrahman As-Sudais", folder: "Abdurrahman-as-Sudais" },
  { id: "ibrahim-al-dossari", name: "Ibrahim Al-Dossari", folder: "Ibrahim-Al-Dossari" },
  { id: "misyari-rasyid-al-afasi", name: "Misyari Rasyid Al-Afasi", folder: "Misyari-Rasyid-Al-Afasi" },
  { id: "yasser-al-dosari", name: "Yasser Al-Dosari", folder: "Yasser-Al-Dosari" },
];

const AUDIO_SOURCE: SourceInfo = {
  name: "Verse By Verse Quran, via EQuran.id",
  url: "https://equran.id",
  attribution: {
    en: "Verse By Verse Quran, via EQuran.id",
    id: "Verse By Verse Quran, melalui EQuran.id",
  },
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

interface RawVerse {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
}

interface RawSurahDetail extends RawSurah {
  ayat: RawVerse[];
}

interface RawTafsir {
  tafsir: { ayat: number; teks: string }[];
}

// Wrapped in React's cache() so that one page request that needs several editions of
// the same surah (Arabic, Latin, translation) fetches it only once. Outside React
// Server Components the function is simply called as is.
const fetchData = cache(async (url: string): Promise<unknown> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url} (status ${res.status})`);
  const json = (await res.json()) as ApiEnvelope<unknown>;
  if (json.code !== 200 || json.data == null) throw new Error(`Invalid response from ${url}`);
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
  throw new Error(`Unknown place of revelation: "${place}"`);
}

export function toSurahMeta(raw: RawSurah): SurahMeta {
  return {
    number: raw.nomor,
    verseCount: raw.jumlahAyat,
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

      const pick: Record<string, (v: RawVerse) => string> = {
        "ara-equran": (v) => v.teksArab,
        "ara-equran-la": (v) => v.teksLatin,
        "ind-kemenag": (v) => v.teksIndonesia,
      };
      const field = pick[edition];
      if (!field) throw new Error(`The equran provider does not serve edition "${edition}"`);

      const raw = (await fetchData(`${base}/surat/${surah}`)) as RawSurahDetail;
      return {
        edition,
        surah,
        verses: raw.ayat.map((v) => ({ number: v.nomorAyat, text: field(v).trim() })),
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
    urls(qari, surah, verse) {
      const found = QARIS.find((q) => q.id === qari);
      if (!found) throw new Error(`The equran-audio provider does not serve reciter "${qari}"`);
      return [`${base}/audio-partial/${found.folder}/${pad(surah)}${pad(verse)}.mp3`];
    },
  };
}

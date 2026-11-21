// Adapter for the EQuran.id API v2 (https://equran.id/apidev/v2). It can also be
// pointed to our own mirror of the same format through `baseUrl` (QURAN_API_URL): an
// HTTP URL, or a directory with the mirror's files (`<dir>/surat.json`, ...).
// Verses and tafsir come from the Indonesian Ministry of Religious Affairs (Kemenag);
// the audio is by Verse By Verse Quran. The field names below (nomor, namaLatin, ...)
// are the API's own and are only used inside this file.

import { cache } from "react";
import { completeEditions } from "../edition-names";
import type { AudioProvider, TextProvider } from "../provider";
import { isRemote, loadJson, toFilePath } from "../transport";
import type { Edition, EditionText, Qari, SourceInfo, SurahMeta } from "../types";

export const EQURAN_API_URL = "https://equran.id/api/v2";
export const EQURAN_AUDIO_URL = "https://cdn.equran.id";

const SOURCE: SourceInfo = {
  name: "EQuran.id",
  url: "https://equran.id",
  attribution: {
    en: "Indonesian Ministry of Religious Affairs (Kemenag), via EQuran.id",
    id: "Kementerian Agama RI, melalui EQuran.id",
    tr: "Endonezya Din İşleri Bakanlığı (Kemenag), EQuran.id üzerinden",
    ms: "Kementerian Hal Ehwal Agama Indonesia (Kemenag), melalui EQuran.id",
    bn: "ইন্দোনেশিয়ার ধর্ম মন্ত্রণালয় (Kemenag), EQuran.id-এর মাধ্যমে",
    fr: "Ministère indonésien des Affaires religieuses (Kemenag), via EQuran.id",
    ru: "Министерство по делам религий Индонезии (Kemenag), через EQuran.id",
    ur: "انڈونیشیا کی وزارتِ مذہبی امور (Kemenag)، بذریعہ EQuran.id",
    ar: "وزارة الشؤون الدينية الإندونيسية (Kemenag)، عبر EQuran.id",
    fa: "وزارت امور دینی اندونزی (Kemenag)، از طریق EQuran.id",
  },
};

export const EQURAN_EDITIONS: Edition[] = completeEditions([
  {
    id: "ara-equran",
    kind: "arabic",
    language: "ar",
    direction: "rtl",
    name: {
      en: "Arabic text (EQuran.id)",
      id: "Teks Arab (EQuran.id)",
      tr: "Arapça metin (EQuran.id)",
      ms: "Teks Arab (EQuran.id)",
      bn: "আরবি পাঠ (EQuran.id)",
      fr: "Texte arabe (EQuran.id)",
      ru: "Арабский текст (EQuran.id)",
      ur: "عربی متن (EQuran.id)",
      ar: "النص العربي (EQuran.id)",
      fa: "متن عربی (EQuran.id)",
      es: "Texto árabe (EQuran.id)",
      bs: "Arapski tekst (EQuran.id)",
      zh: "阿拉伯语原文 (EQuran.id)",
      th: "ตัวบทภาษาอาหรับ (EQuran.id)",
      uz: "Arabcha matn (EQuran.id)",
      ta: "அரபு மூலம் (EQuran.id)",
      ml: "അറബി പാഠം (EQuran.id)",
    },
    source: SOURCE,
  },
  {
    id: "ara-equran-la",
    kind: "transliteration",
    language: "ar",
    direction: "ltr",
    name: {
      en: "Latin transliteration",
      id: "Transliterasi Latin",
      tr: "Latin harfleriyle okunuş",
      ms: "Transliterasi Latin",
      bn: "লাতিন প্রতিবর্ণীকরণ",
      fr: "Translittération latine",
      ru: "Латинская транслитерация",
      ur: "رومن نقل حرفی",
      ar: "الكتابة بالحروف اللاتينية",
      fa: "آوانویسی لاتین",
      es: "Transliteración latina",
      bs: "Latinična transliteracija",
      zh: "拉丁字母转写",
      th: "การถอดอักษรละติน",
      uz: "Lotin transliteratsiyasi",
      ta: "லத்தீன் ஒலிபெயர்ப்பு",
      ml: "ലാറ്റിൻ ലിപ്യന്തരണം",
    },
    source: SOURCE,
  },
  {
    id: "ind-kemenag",
    kind: "translation",
    language: "id",
    direction: "ltr",
    name: {
      en: "Indonesian translation (Kemenag)",
      id: "Terjemahan Kemenag RI",
      tr: "Endonezce meal (Kemenag)",
      ms: "Terjemahan Indonesia (Kemenag)",
      bn: "ইন্দোনেশীয় অনুবাদ (Kemenag)",
      fr: "Traduction indonésienne (Kemenag)",
      ru: "Индонезийский перевод (Kemenag)",
      ur: "انڈونیشیائی ترجمہ (Kemenag)",
      ar: "الترجمة الإندونيسية (Kemenag)",
      fa: "ترجمهٔ اندونزیایی (Kemenag)",
      es: "Traducción indonesia (Kemenag)",
      bs: "Indonezijski prijevod (Kemenag)",
      zh: "印度尼西亚语译本 (Kemenag)",
      th: "คำแปลภาษาอินโดนีเซีย (Kemenag)",
      uz: "Indonezcha tarjima (Kemenag)",
      ta: "இந்தோனேசிய மொழிபெயர்ப்பு (Kemenag)",
      ml: "ഇന്തോനേഷ്യൻ പരിഭാഷ (Kemenag)",
    },
    author: "Kementerian Agama RI",
    source: SOURCE,
  },
  {
    id: "ind-kemenag-tafsir",
    kind: "tafsir",
    language: "id",
    direction: "ltr",
    name: {
      en: "Tafsir (Kemenag, Indonesian)",
      id: "Tafsir Kemenag RI",
      tr: "Tefsir (Kemenag, Endonezce)",
      ms: "Tafsir (Kemenag, bahasa Indonesia)",
      bn: "তাফসির (Kemenag, ইন্দোনেশীয়)",
      fr: "Tafsir (Kemenag, indonésien)",
      ru: "Тафсир (Kemenag, индонезийский)",
      ur: "تفسیر (Kemenag، انڈونیشیائی)",
      ar: "التفسير (Kemenag، بالإندونيسية)",
      fa: "تفسیر (Kemenag، اندونزیایی)",
      es: "Tafsir (Kemenag, indonesio)",
      bs: "Tefsir (Kemenag, indonezijski)",
      zh: "经注 (Kemenag，印度尼西亚语)",
      th: "ตัฟซีร (Kemenag, ภาษาอินโดนีเซีย)",
      uz: "Tafsir (Kemenag, indonezcha)",
      ta: "தஃப்ஸீர் (Kemenag, இந்தோனேசியம்)",
      ml: "തഫ്സീർ (Kemenag, ഇന്തോനേഷ്യൻ)",
    },
    author: "Kementerian Agama RI",
    source: SOURCE,
  },
]);

// The API's reciter keys ("01".."06") map to these folders on its CDN.
const QARIS = [
  { id: "abdullah-al-juhany", name: "Abdullah Al-Juhany", arabicName: "عبد الله الجهني", folder: "Abdullah-Al-Juhany" },
  { id: "abdul-muhsin-al-qasim", name: "Abdul Muhsin Al-Qasim", arabicName: "عبد المحسن القاسم", folder: "Abdul-Muhsin-Al-Qasim" },
  { id: "abdurrahman-as-sudais", name: "Abdurrahman As-Sudais", arabicName: "عبد الرحمن السديس", folder: "Abdurrahman-as-Sudais" },
  { id: "ibrahim-al-dossari", name: "Ibrahim Al-Dossari", arabicName: "إبراهيم الدوسري", folder: "Ibrahim-Al-Dossari" },
  { id: "misyari-rasyid-al-afasi", name: "Misyari Rasyid Al-Afasi", arabicName: "مشاري راشد العفاسي", folder: "Misyari-Rasyid-Al-Afasi" },
  { id: "yasser-al-dosari", name: "Yasser Al-Dosari", arabicName: "ياسر الدوسري", folder: "Yasser-Al-Dosari" },
];

const AUDIO_SOURCE: SourceInfo = {
  name: "Verse By Verse Quran, via EQuran.id",
  url: "https://equran.id",
  attribution: {
    en: "Verse By Verse Quran, via EQuran.id",
    id: "Verse By Verse Quran, melalui EQuran.id",
    tr: "Verse By Verse Quran, EQuran.id üzerinden",
    ms: "Verse By Verse Quran, melalui EQuran.id",
    bn: "Verse By Verse Quran, EQuran.id-এর মাধ্যমে",
    fr: "Verse By Verse Quran, via EQuran.id",
    ru: "Verse By Verse Quran, через EQuran.id",
    ur: "Verse By Verse Quran، بذریعہ EQuran.id",
    ar: "Verse By Verse Quran، عبر EQuran.id",
    fa: "Verse By Verse Quran، از طریق EQuran.id",
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
const fetchData = cache(async (location: string): Promise<unknown> => {
  const json = (await loadJson(location)) as ApiEnvelope<unknown>;
  if (json.code !== 200 || json.data == null) throw new Error(`Invalid response from ${location}`);
  return json.data;
});

// A remote base serves `<base>/surat/1`; a local copy (the files of the mirror) stores
// the same responses as `<dir>/surat/1.json`.
const endpoint = (base: string, path: string) => (isRemote(base) ? `${base}${path}` : `${toFilePath(base)}${path}.json`);

/**
 * Plain text from the HTML of a surah description. Tags are removed until none is left, because one pass can leave a
 * tag behind (`<scr<script>ipt>` becomes `<script>`), and any `<` or `>` still there is dropped, so no markup survives.
 * The result is only ever shown as text (React escapes it); this is a second line of defence.
 */
export function stripHtml(html: string): string {
  let text = html.replace(/<br\s*\/?>/gi, " ");
  let previous: string;
  do {
    previous = text;
    text = text.replace(/<[^<>]*>/g, "");
  } while (text !== previous);
  return text.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
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
      const list = (await fetchData(endpoint(base, "/surat"))) as RawSurah[];
      return list.map(toSurahMeta);
    },

    async text(edition, surah): Promise<EditionText> {
      if (edition === "ind-kemenag-tafsir") {
        const raw = (await fetchData(endpoint(base, `/tafsir/${surah}`))) as RawTafsir;
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

      const raw = (await fetchData(endpoint(base, `/surat/${surah}`))) as RawSurahDetail;
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
  const qaris: Qari[] = QARIS.map((q) => ({ id: q.id, name: q.name, arabicName: q.arabicName, source: AUDIO_SOURCE }));
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

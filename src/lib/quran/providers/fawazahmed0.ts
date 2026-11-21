// Adapter for fawazahmed0/quran-api (https://github.com/fawazahmed0/quran-api).
// The repository is licensed under the Unlicense, but every edition has its own
// original source (the `source` field in editions.json): check the licence before
// enabling a new edition and record it in the source register of the roadmap
// (project/quranweb/ROADMAP.md in the workspace repository).
//
// Text only: no audio and no surah names or descriptions (the surah list comes from
// another provider; English meanings of the names come from info.json). Chapter
// format: {"chapter":[{"chapter":1,"verse":1,"text":"…"}]}. The base URL can point to
// our own mirror with the same structure (QURAN_FAWAZ_URL).

import { cache } from "react";
import type { TextProvider } from "../provider";
import { loadJson } from "../transport";
import { completeEditions } from "../edition-names";
import type { Edition, EditionText, JuzRef, MushafPageRef, SourceInfo } from "../types";

export const FAWAZ_API_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1";
// Fallback: that repository is about 4.2 GB, so jsDelivr sometimes refuses specific
// files ("Package size exceeded the configured limit of 50 MB", seen on
// editions/ind-indonesianislam/45.min.json). See createFawazTextProvider.
export const FAWAZ_RAW_URL = "https://raw.githubusercontent.com/fawazahmed0/quran-api/1";

/**
 * The credit in every interface language. `who` is the source as it reads in any language (a name, "X through Tanzil" is
 * built from it); the English, Indonesian and Turkish texts are written out because some explain the name.
 */
const via = (en: string, id: string, tr: string, who = en.replace(/ through Tanzil$/, "")): SourceInfo["attribution"] => {
  const tanzil = en.endsWith(" through Tanzil");
  return {
    en: `${en}, via fawazahmed0/quran-api`,
    id: `${id}, melalui fawazahmed0/quran-api`,
    tr: `${tr}, fawazahmed0/quran-api üzerinden`,
    ms: `${who}${tanzil ? " melalui Tanzil" : ""}, melalui fawazahmed0/quran-api`,
    bn: `${who}${tanzil ? ", Tanzil-এর মাধ্যমে" : ""}, fawazahmed0/quran-api-এর মাধ্যমে`,
    fr: `${who}${tanzil ? " via Tanzil" : ""}, via fawazahmed0/quran-api`,
    ru: `${who}${tanzil ? " через Tanzil" : ""}, через fawazahmed0/quran-api`,
    ur: `${who}${tanzil ? "، بذریعہ Tanzil" : ""}، بذریعہ fawazahmed0/quran-api`,
    ar: `${who}${tanzil ? "، عبر Tanzil" : ""}، عبر fawazahmed0/quran-api`,
    fa: `${who}${tanzil ? "، از طریق Tanzil" : ""}، از طریق fawazahmed0/quran-api`,
  };
};

const source = (url: string, attribution: SourceInfo["attribution"]): SourceInfo => ({
  name: "fawazahmed0/quran-api",
  url,
  attribution,
});

/**
 * The enabled editions. The ID is the edition's name at fawazahmed0
 * (`{iso3}-{name}`). Enabling another edition = one more entry here, after its
 * licence has been checked.
 */
export const FAWAZ_EDITIONS: Edition[] = completeEditions([
  {
    id: "ara-quranuthmanihaf",
    kind: "arabic",
    language: "ar",
    direction: "rtl",
    name: { en: "Arabic, Uthmani Hafs", id: "Arab Uthmani Hafs", tr: "Arapça, Osmani Hafs", ms: "Arab, Uthmani Hafs", bn: "আরবি, উসমানি হাফস", fr: "Arabe, uthmani Hafs", ru: "Арабский, усмани Хафс", ur: "عربی، عثمانی حفص", ar: "العربية، الرسم العثماني (حفص)", fa: "عربی، رسم عثمانی (حفص)" },
    author: "King Fahd Quran Complex",
    source: source("https://qurancomplex.gov.sa/", via("King Fahd Quran Complex", "King Fahd Quran Complex", "King Fahd Quran Complex")),
  },
  {
    // Its text explains rather than translates (about 400 characters per verse), so it
    // is classified as a tafsir. The owner confirmed this.
    id: "ind-muhammadquraish",
    kind: "tafsir",
    language: "id",
    direction: "ltr",
    name: {
      en: "Tafsir by Quraish Shihab and others (Indonesian)",
      id: "Tafsir Quraish Shihab dkk.",
      tr: "Quraish Shihab ve diğerlerinin tefsiri (Endonezce)",
      ms: "Tafsir Quraish Shihab dan lain-lain (bahasa Indonesia)",
      bn: "কুরাইশ শিহাব প্রমুখের তাফসির (ইন্দোনেশীয়)",
      fr: "Tafsir de Quraish Shihab et al. (indonésien)",
      ru: "Тафсир Курайша Шихаба и др. (индонезийский)",
      ur: "تفسیر قریش شہاب و دیگر (انڈونیشیائی)",
      ar: "تفسير قريش شهاب وآخرين (بالإندونيسية)",
      fa: "تفسیر قریش شهاب و دیگران (اندونزیایی)",
    },
    author: "Muhammad Quraish Shihab et al.",
    source: source("https://tanzil.net/trans/", via("Muhammad Quraish Shihab et al. through Tanzil", "Muhammad Quraish Shihab dkk. melalui Tanzil", "Muhammad Quraish Shihab ve diğerleri, Tanzil")),
  },
  {
    id: "ind-jalaladdinalmah",
    kind: "tafsir",
    language: "id",
    direction: "ltr",
    name: {
      en: "Tafsir Jalalayn (Indonesian)",
      id: "Tafsir Jalalayn",
      tr: "Tafsir Jalalayn (Endonezce)",
      ms: "Tafsir Jalalayn (bahasa Indonesia)",
      bn: "তাফসির জালালাইন (ইন্দোনেশীয়)",
      fr: "Tafsir Jalalayn (indonésien)",
      ru: "Тафсир Джалалайн (индонезийский)",
      ur: "تفسیر جلالین (انڈونیشیائی)",
      ar: "تفسير الجلالين (بالإندونيسية)",
      fa: "تفسیر جلالین (اندونزیایی)",
    },
    author: "Jalaluddin al-Mahalli and Jalaluddin as-Suyuthi",
    source: source(
      "https://tanzil.net/trans/",
      via("Jalaluddin al-Mahalli and Jalaluddin as-Suyuthi through Tanzil", "Jalaluddin al-Mahalli dan Jalaluddin as-Suyuthi melalui Tanzil", "Jalaluddin al-Mahalli ve Jalaluddin as-Suyuthi, Tanzil"),
    ),
  },
  {
    id: "eng-abdullahyusufal",
    kind: "translation",
    language: "en",
    direction: "ltr",
    name: {
      en: "English translation by Yusuf Ali",
      id: "Terjemahan Inggris oleh Yusuf Ali",
      tr: "Yusuf Ali'nin İngilizce meali",
      ms: "Terjemahan Inggeris oleh Yusuf Ali",
      bn: "ইউসুফ আলীর ইংরেজি অনুবাদ",
      fr: "Traduction anglaise de Yusuf Ali",
      ru: "Английский перевод Юсуфа Али",
      ur: "یوسف علی کا انگریزی ترجمہ",
      ar: "ترجمة يوسف علي الإنجليزية",
      fa: "ترجمهٔ انگلیسی یوسف علی",
    },
    author: "Abdullah Yusuf Ali",
    source: source("https://tanzil.net/trans/", via("Abdullah Yusuf Ali through Tanzil", "Abdullah Yusuf Ali melalui Tanzil", "Abdullah Yusuf Ali, Tanzil")),
  },
  {
    id: "eng-mohammedmarmadu",
    kind: "translation",
    language: "en",
    direction: "ltr",
    name: {
      en: "English translation by Pickthall",
      id: "Terjemahan Inggris oleh Pickthall",
      tr: "Pickthall'ın İngilizce meali",
      ms: "Terjemahan Inggeris oleh Pickthall",
      bn: "পিকথলের ইংরেজি অনুবাদ",
      fr: "Traduction anglaise de Pickthall",
      ru: "Английский перевод Пиктхолла",
      ur: "پکتھال کا انگریزی ترجمہ",
      ar: "ترجمة بيكتال الإنجليزية",
      fa: "ترجمهٔ انگلیسی پیکتال",
    },
    author: "Mohammed Marmaduke William Pickthall",
    source: source(
      "https://tanzil.net/trans/",
      via("Mohammed Marmaduke William Pickthall through Tanzil", "Mohammed Marmaduke William Pickthall melalui Tanzil", "Mohammed Marmaduke William Pickthall, Tanzil"),
    ),
  },
  {
    // The default translation with the Turkish interface (chosen by the owner, 2026-11-18). Tanzil's terms: non-commercial
    // use, and a link back to https://tanzil.net/trans/ when more than three of its translations are used on a site, so
    // the About page links there rather than to the front page of Tanzil.
    id: "tur-diyanetisleri",
    kind: "translation",
    language: "tr",
    direction: "ltr",
    name: {
      en: "Turkish translation by Diyanet İşleri",
      id: "Terjemahan Turki oleh Diyanet İşleri",
      tr: "Diyanet İşleri meali",
      ms: "Terjemahan Turki oleh Diyanet İşleri",
      bn: "দিয়ানেত ইশলেরির তুর্কি অনুবাদ",
      fr: "Traduction turque de la Diyanet İşleri",
      ru: "Турецкий перевод Диянет Ишлери",
      ur: "دیانت اشلری کا ترکی ترجمہ",
      ar: "ترجمة رئاسة الشؤون الدينية التركية (ديانت)",
      fa: "ترجمهٔ ترکی دیانت",
    },
    author: "Diyanet İşleri Başkanlığı",
    source: source(
      "https://tanzil.net/trans/",
      via(
        "Diyanet İşleri (Presidency of Religious Affairs of Türkiye) through Tanzil",
        "Diyanet İşleri (Kepresidenan Urusan Agama Turki) melalui Tanzil",
        "Diyanet İşleri Başkanlığı, Tanzil",
        "Diyanet İşleri Başkanlığı",
      ),
    ),
  },
  {
    // The default translation with the Malay interface (2026-11-21). Through Tanzil, like the Turkish one.
    id: "msa-abdullahmuhamma",
    kind: "translation",
    language: "ms",
    direction: "ltr",
    name: {
      en: "Malay translation by Abdullah Basmeih",
      id: "Terjemahan Melayu oleh Abdullah Basmeih",
      tr: "Abdullah Basmeih'in Malayca meali",
      ms: "Terjemahan Melayu oleh Abdullah Basmeih",
      bn: "আবদুল্লাহ বাসমেইহের মালয় অনুবাদ",
      fr: "Traduction malaise d'Abdullah Basmeih",
      ru: "Малайский перевод Абдуллаха Басмейха",
      ur: "عبداللہ بسمیہ کا مالے ترجمہ",
      ar: "ترجمة عبد الله بسميه الملايوية",
      fa: "ترجمهٔ مالایی عبدالله بسمیه",
    },
    author: "Abdullah Muhammad Basmeih",
    source: source("https://tanzil.net/trans/", via("Abdullah Muhammad Basmeih through Tanzil", "Abdullah Muhammad Basmeih melalui Tanzil", "Abdullah Muhammad Basmeih, Tanzil")),
  },
  {
    // The default translation with the Bengali interface (2026-11-21). Through Tanzil.
    id: "ben-muhiuddinkhan",
    kind: "translation",
    language: "bn",
    direction: "ltr",
    name: {
      en: "Bengali translation by Muhiuddin Khan",
      id: "Terjemahan Bengali oleh Muhiuddin Khan",
      tr: "Muhiuddin Khan'ın Bengalce meali",
      ms: "Terjemahan Bengali oleh Muhiuddin Khan",
      bn: "মুহিউদ্দীন খানের বাংলা অনুবাদ",
      fr: "Traduction bengalie de Muhiuddin Khan",
      ru: "Бенгальский перевод Мухиуддина Хана",
      ur: "محی الدین خان کا بنگالی ترجمہ",
      ar: "ترجمة محيي الدين خان البنغالية",
      fa: "ترجمهٔ بنگالی محی‌الدین خان",
    },
    author: "Muhiuddin Khan",
    source: source("https://tanzil.net/trans/", via("Muhiuddin Khan through Tanzil", "Muhiuddin Khan melalui Tanzil", "Muhiuddin Khan, Tanzil")),
  },
  {
    // The default translation with the Russian interface (2026-11-21). Through Tanzil.
    id: "rus-elmirkuliev",
    kind: "translation",
    language: "ru",
    direction: "ltr",
    name: {
      en: "Russian translation by Elmir Kuliev",
      id: "Terjemahan Rusia oleh Elmir Kuliev",
      tr: "Elmir Kuliev'in Rusça meali",
      ms: "Terjemahan Rusia oleh Elmir Kuliev",
      bn: "এলমির কুলিয়েভের রুশ অনুবাদ",
      fr: "Traduction russe d'Elmir Kouliev",
      ru: "Перевод смыслов Эльмира Кулиева",
      ur: "المیر کولیف کا روسی ترجمہ",
      ar: "ترجمة إلمير كولييف الروسية",
      fa: "ترجمهٔ روسی المیر کولیف",
    },
    author: "Elmir Kuliev",
    source: source("https://tanzil.net/trans/", via("Elmir Kuliev through Tanzil", "Elmir Kuliev melalui Tanzil", "Elmir Kuliev, Tanzil")),
  },
]);
interface RawChapter {
  chapter: { chapter: number; verse: number; text: string }[];
}

interface RawVerse {
  chapter: number;
  verse: number;
}

interface RawInfo {
  chapters: { chapter: number; englishname: string }[];
  juzs?: { references: { juz: number; start: RawVerse; end: RawVerse }[] };
  pages?: { references: { page: number; start: RawVerse; end: RawVerse }[] };
}

export interface FawazOptions {
  /**
   * A single base URL, e.g. our own mirror (an HTTP URL, or a directory with the
   * mirror's files); when set, only this one is used. Empty = jsDelivr, then raw GitHub
   * as a fallback. Production should use our own mirror (QURAN_FAWAZ_URL), not a public CDN.
   */
  baseUrl?: string;
  /** IDs of the editions to enable. Empty = all the editions listed above. */
  editions?: string[];
}

/**
 * Fetch `{path}.min.json`, then `{path}.json` (the source's README asks for this
 * fallback), on each base URL in turn.
 */
async function fetchJson<T>(bases: string[], path: string): Promise<T> {
  const urls = bases.flatMap((base) => [`${base}/${path}.min.json`, `${base}/${path}.json`]);
  const errors: string[] = [];
  for (const url of urls) {
    try {
      return (await loadJson(url)) as T;
    } catch (err) {
      errors.push(`${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(`Failed to load ${path} (${errors.join("; ")})`);
}

// One request per page render is enough: share the result like the EQuran provider does.
const fetchInfo = cache((bases: string) => fetchJson<RawInfo>(bases.split("|"), "info"));

export function createFawazTextProvider(options: FawazOptions = {}): TextProvider {
  const bases = (options.baseUrl ? [options.baseUrl] : [FAWAZ_API_URL, FAWAZ_RAW_URL]).map((b) => b.replace(/\/$/, ""));
  const enabled = options.editions?.length
    ? options.editions.map((id) => {
        const found = FAWAZ_EDITIONS.find((e) => e.id === id);
        if (!found) throw new Error(`Unknown fawazahmed0 edition "${id}"`);
        return found;
      })
    : FAWAZ_EDITIONS;
  const known = new Set(enabled.map((e) => e.id));

  return {
    id: "fawazahmed0",
    editions: () => enabled,

    async surahMeanings() {
      const info = await fetchInfo(bases.join("|"));
      return Object.fromEntries(info.chapters.map((c) => [c.chapter, { en: c.englishname }]));
    },

    async juzs(): Promise<JuzRef[]> {
      const info = await fetchInfo(bases.join("|"));
      const references = info.juzs?.references;
      if (!Array.isArray(references)) throw new Error("info.json has no juz boundaries");
      return references.map((r) => ({
        juz: r.juz,
        start: { surah: r.start.chapter, verse: r.start.verse },
        end: { surah: r.end.chapter, verse: r.end.verse },
      }));
    },

    async mushafPages(): Promise<MushafPageRef[]> {
      const info = await fetchInfo(bases.join("|"));
      const references = info.pages?.references;
      if (!Array.isArray(references)) throw new Error("info.json has no mushaf pages");
      return references.map((r) => ({
        page: r.page,
        start: { surah: r.start.chapter, verse: r.start.verse },
        end: { surah: r.end.chapter, verse: r.end.verse },
      }));
    },

    async text(edition, surah): Promise<EditionText> {
      if (!known.has(edition)) throw new Error(`The fawazahmed0 provider does not serve edition "${edition}"`);
      const raw = await fetchJson<RawChapter>(bases, `editions/${edition}/${surah}`);
      if (!Array.isArray(raw.chapter) || raw.chapter.some((v) => v.chapter !== surah)) {
        throw new Error(`The response for ${edition} surah ${surah} has an unexpected format`);
      }
      return {
        edition,
        surah,
        verses: raw.chapter.map((v) => ({ number: v.verse, text: v.text.trim() })),
      };
    },
  };
}

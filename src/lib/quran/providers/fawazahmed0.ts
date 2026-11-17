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
import type { Edition, EditionText, SourceInfo } from "../types";

export const FAWAZ_API_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1";
// Fallback: that repository is about 4.2 GB, so jsDelivr sometimes refuses specific
// files ("Package size exceeded the configured limit of 50 MB", seen on
// editions/ind-indonesianislam/45.min.json). See createFawazTextProvider.
export const FAWAZ_RAW_URL = "https://raw.githubusercontent.com/fawazahmed0/quran-api/1";

const via = (en: string, id: string): SourceInfo["attribution"] => ({
  en: `${en}, via fawazahmed0/quran-api`,
  id: `${id}, melalui fawazahmed0/quran-api`,
});

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
export const FAWAZ_EDITIONS: Edition[] = [
  {
    id: "ara-quranuthmanihaf",
    kind: "arabic",
    language: "ar",
    direction: "rtl",
    name: { en: "Arabic, Uthmani Hafs", id: "Arab Uthmani Hafs" },
    author: "King Fahd Quran Complex",
    source: source("https://qurancomplex.gov.sa/", via("King Fahd Quran Complex", "King Fahd Quran Complex")),
  },
  {
    id: "ind-indonesianislam",
    kind: "translation",
    language: "id",
    direction: "ltr",
    name: { en: "Indonesian translation (Kemenag, QuranEnc)", id: "Terjemahan Kemenag RI (QuranEnc)" },
    author: "Kementerian Agama RI",
    source: source(
      "https://quranenc.com/check/indonesian_affairs/v1",
      via("Indonesian Ministry of Religious Affairs (Kemenag) through QuranEnc", "Kementerian Agama RI melalui QuranEnc"),
    ),
  },
  {
    // Its text explains rather than translates (about 400 characters per verse), so it
    // is classified as a tafsir. The owner confirmed this.
    id: "ind-muhammadquraish",
    kind: "tafsir",
    language: "id",
    direction: "ltr",
    name: { en: "Tafsir by Quraish Shihab and others (Indonesian)", id: "Tafsir Quraish Shihab dkk." },
    author: "Muhammad Quraish Shihab et al.",
    source: source("http://tanzil.net", via("Muhammad Quraish Shihab et al. through Tanzil", "Muhammad Quraish Shihab dkk. melalui Tanzil")),
  },
  {
    id: "ind-jalaladdinalmah",
    kind: "tafsir",
    language: "id",
    direction: "ltr",
    name: { en: "Tafsir Jalalayn (Indonesian)", id: "Tafsir Jalalayn" },
    author: "Jalaluddin al-Mahalli and Jalaluddin as-Suyuthi",
    source: source(
      "http://tanzil.net",
      via("Jalaluddin al-Mahalli and Jalaluddin as-Suyuthi through Tanzil", "Jalaluddin al-Mahalli dan Jalaluddin as-Suyuthi melalui Tanzil"),
    ),
  },
  {
    id: "eng-abdullahyusufal",
    kind: "translation",
    language: "en",
    direction: "ltr",
    name: { en: "English translation by Yusuf Ali", id: "Terjemahan Inggris oleh Yusuf Ali" },
    author: "Abdullah Yusuf Ali",
    source: source("http://tanzil.net", via("Abdullah Yusuf Ali through Tanzil", "Abdullah Yusuf Ali melalui Tanzil")),
  },
  {
    id: "eng-mohammedmarmadu",
    kind: "translation",
    language: "en",
    direction: "ltr",
    name: { en: "English translation by Pickthall", id: "Terjemahan Inggris oleh Pickthall" },
    author: "Mohammed Marmaduke William Pickthall",
    source: source(
      "http://tanzil.net",
      via("Mohammed Marmaduke William Pickthall through Tanzil", "Mohammed Marmaduke William Pickthall melalui Tanzil"),
    ),
  },
];

interface RawChapter {
  chapter: { chapter: number; verse: number; text: string }[];
}

interface RawInfo {
  chapters: { chapter: number; englishname: string }[];
}

export interface FawazOptions {
  /**
   * A single base URL, e.g. our own mirror; when set, only this one is used.
   * Empty = jsDelivr, then raw GitHub as a fallback. Production should use our own
   * mirror (QURAN_FAWAZ_URL), not a public CDN.
   */
  baseUrl?: string;
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
      const res = await fetch(url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      return (await res.json()) as T;
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
  const known = new Set(FAWAZ_EDITIONS.map((e) => e.id));

  return {
    id: "fawazahmed0",
    editions: () => FAWAZ_EDITIONS,

    async surahMeanings() {
      const info = await fetchInfo(bases.join("|"));
      return Object.fromEntries(info.chapters.map((c) => [c.chapter, { en: c.englishname }]));
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

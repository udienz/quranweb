// Adapter for QuranEnc.com (https://quranenc.com/en/home/api): reviewed translations of the meanings of the Qur'an, with
// footnotes, and Al-Mukhtasar fi Tafsir al-Qur'an in many languages. Production reads a private copy of the API's answers
// (QURAN_QURANENC_URL=/data/quranenc, made by sync-quranenc.mjs in the data repository), not the live API.
//
// QuranEnc's terms: no modification, addition or deletion; name the publisher and QuranEnc.com; give the version number;
// keep each translation up to date; no inappropriate advertisements. So the text is passed on as received (the footnote
// markers such as "[252]" stay in it, and the footnotes come with it), and each edition's credit names its version.
//
// Sura format: {"result":[{"sura":"1","aya":"1","translation":"…","footnotes":"[1] …" | null}, …]}.

import { cache } from "react";
import type { TextProvider } from "../provider";
import { loadJson } from "../transport";
import type { Edition, EditionText, SourceInfo } from "../types";

export const QURANENC_API_URL = "https://quranenc.com/api/v1";

const credit = (key: string, attribution: SourceInfo["attribution"]): SourceInfo => ({
  name: "QuranEnc.com",
  url: `https://quranenc.com/en/browse/${key}`,
  attribution,
});

/** A translation credit in every interface language: who, through QuranEnc.com, which version. */
const translationCredit = (key: string, version: string, who: Record<string, string>): SourceInfo =>
  credit(key, {
    en: `${who.en}, via QuranEnc.com, version ${version}`,
    id: `${who.id}, melalui QuranEnc.com, versi ${version}`,
    tr: `${who.tr}, QuranEnc.com üzerinden, sürüm ${version}`,
    ms: `${who.ms}, melalui QuranEnc.com, versi ${version}`,
    bn: `${who.bn}, QuranEnc.com-এর মাধ্যমে, সংস্করণ ${version}`,
    fr: `${who.fr}, via QuranEnc.com, version ${version}`,
    ru: `${who.ru}, через QuranEnc.com, версия ${version}`,
  });

// The name of a language in each interface language, for the names of the Al-Mukhtasar editions.
const LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  en: { en: "English", id: "Inggris", tr: "İngilizce", ms: "Inggeris", bn: "ইংরেজি", fr: "anglais", ru: "английский" },
  tr: { en: "Turkish", id: "Turki", tr: "Türkçe", ms: "Turki", bn: "তুর্কি", fr: "turc", ru: "турецкий" },
  id: { en: "Indonesian", id: "Indonesia", tr: "Endonezce", ms: "Indonesia", bn: "ইন্দোনেশীয়", fr: "indonésien", ru: "индонезийский" },
  bn: { en: "Bengali", id: "Bengali", tr: "Bengalce", ms: "Bengali", bn: "বাংলা", fr: "bengali", ru: "бенгальский" },
  fr: { en: "French", id: "Prancis", tr: "Fransızca", ms: "Perancis", bn: "ফরাসি", fr: "français", ru: "французский" },
  ru: { en: "Russian", id: "Rusia", tr: "Rusça", ms: "Rusia", bn: "রুশ", fr: "russe", ru: "русский" },
};

/**
 * One language of *Al-Mukhtasar fi Tafsir al-Qur'an*. QuranEnc publishes no version number for these, so the credit gives the
 * date of our copy instead.
 */
function mokhtasar(id: string, language: string, key: string, copied: string): Edition {
  const names = LANGUAGE_NAMES[language];
  const title = "Al-Mukhtasar fi Tafsir al-Qur'an";
  const center = "Tafsir Center for Quranic Studies";
  return {
    id,
    kind: "tafsir",
    language,
    direction: "ltr",
    name: Object.fromEntries(Object.entries(names).map(([ui, name]) => [ui, `${title} (${name})`])),
    author: center,
    source: credit(key, {
      en: `${center}, via QuranEnc.com (no version number published; copy of ${copied})`,
      id: `${center}, melalui QuranEnc.com (nomor versi tidak diterbitkan; salinan ${copied})`,
      tr: `${center}, QuranEnc.com üzerinden (sürüm numarası yayımlanmadı; ${copied} kopyası)`,
      ms: `${center}, melalui QuranEnc.com (nombor versi tidak diterbitkan; salinan ${copied})`,
      bn: `${center}, QuranEnc.com-এর মাধ্যমে (সংস্করণ নম্বর প্রকাশিত নয়; ${copied} তারিখের কপি)`,
      fr: `${center}, via QuranEnc.com (aucun numéro de version publié ; copie du ${copied})`,
      ru: `${center}, через QuranEnc.com (номер версии не опубликован; копия от ${copied})`,
    }),
  };
}

/**
 * The enabled editions. Their IDs follow the project's scheme (`{iso3}-{name}`); `ind-indonesianislam` keeps the ID it had
 * when it came through fawazahmed0, so readers' saved choices still work. Enabling another one = an entry here, after
 * adding its key to the data repository's sync script. **Update the version in the credit when the copy is refreshed**
 * (`sync-quranenc.mjs --check` reports a newer one).
 */
export const QURANENC_EDITIONS: Edition[] = [
  {
    id: "ind-indonesianislam",
    kind: "translation",
    language: "id",
    direction: "ltr",
    name: {
      en: "Indonesian translation (Kemenag, QuranEnc)",
      id: "Terjemahan Kemenag RI (QuranEnc)",
      tr: "Endonezce meal (Kemenag, QuranEnc)",
      ms: "Terjemahan Indonesia (Kemenag, QuranEnc)",
      bn: "ইন্দোনেশীয় অনুবাদ (Kemenag, QuranEnc)",
      fr: "Traduction indonésienne (Kemenag, QuranEnc)",
      ru: "Индонезийский перевод (Kemenag, QuranEnc)",
    },
    author: "Kementerian Agama RI",
    source: translationCredit("indonesian_affairs", "1.0.1", {
      en: "Indonesian Ministry of Religious Affairs (Kemenag)",
      id: "Kementerian Agama RI",
      tr: "Endonezya Din İşleri Bakanlığı (Kemenag)",
      ms: "Kementerian Hal Ehwal Agama Indonesia (Kemenag)",
      bn: "ইন্দোনেশিয়ার ধর্ম মন্ত্রণালয় (Kemenag)",
      fr: "Ministère indonésien des Affaires religieuses (Kemenag)",
      ru: "Министерство по делам религий Индонезии (Kemenag)",
    }),
  },
  mokhtasar("eng-mokhtasar", "en", "english_mokhtasar", "2026-11-19"),
  mokhtasar("tur-mokhtasar", "tr", "turkish_mokhtasar", "2026-11-19"),
  // A short tafsir in Indonesian beside the Kemenag one (the Indonesian default stays Kemenag).
  mokhtasar("ind-mokhtasar", "id", "indonesian_mokhtasar", "2026-11-19"),
  {
    // The default translation with the French interface (2026-11-21): reviewed, with footnotes.
    id: "fra-rashidmaash",
    kind: "translation",
    language: "fr",
    direction: "ltr",
    name: {
      en: "French translation by Rachid Maach",
      id: "Terjemahan Prancis oleh Rachid Maach",
      tr: "Rachid Maach'ın Fransızca meali",
      ms: "Terjemahan Perancis oleh Rachid Maach",
      bn: "রশিদ মাশের ফরাসি অনুবাদ",
      fr: "Traduction française de Rachid Maach",
      ru: "Французский перевод Рашида Мааша",
    },
    author: "Rachid Maach",
    source: translationCredit("french_rashid", "1.0.3", {
      en: "Rachid Maach",
      id: "Rachid Maach",
      tr: "Rachid Maach",
      ms: "Rachid Maach",
      bn: "রশিদ মাশ",
      fr: "Rachid Maach",
      ru: "Рашид Маах",
    }),
  },
  // The default tafsir with the Bengali, French and Russian interfaces (2026-11-21).
  mokhtasar("ben-mokhtasar", "bn", "bengali_mokhtasar", "2026-11-21"),
  mokhtasar("fra-mokhtasar", "fr", "french_mokhtasar", "2026-11-21"),
  mokhtasar("rus-mokhtasar", "ru", "russian_mokhtasar", "2026-11-21"),
];

/** The translation key at QuranEnc of each edition. */
export const QURANENC_KEYS: Record<string, string> = {
  "ind-indonesianislam": "indonesian_affairs",
  "eng-mokhtasar": "english_mokhtasar",
  "tur-mokhtasar": "turkish_mokhtasar",
  "ind-mokhtasar": "indonesian_mokhtasar",
  "fra-rashidmaash": "french_rashid",
  "ben-mokhtasar": "bengali_mokhtasar",
  "fra-mokhtasar": "french_mokhtasar",
  "rus-mokhtasar": "russian_mokhtasar",
};

interface RawSura {
  result: { sura: string; aya: string; translation: string; footnotes?: string | null }[];
}

export interface QuranEncOptions {
  /** An HTTP URL or a directory with the copy. Default: the live API (for development only). */
  baseUrl?: string;
  /** IDs of the editions to enable. Empty = all the editions listed above. */
  editions?: string[];
}

// One fetch per sura and edition per page render.
const fetchSura = cache(async (base: string, key: string, sura: number): Promise<RawSura> => {
  // The copy has files (`.json`); the live API has no extension.
  const urls = [`${base}/translation/sura/${key}/${sura}.json`, `${base}/translation/sura/${key}/${sura}`];
  const errors: string[] = [];
  for (const url of urls) {
    try {
      return (await loadJson(url)) as RawSura;
    } catch (err) {
      errors.push(`${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(`Failed to load QuranEnc ${key} sura ${sura} (${errors.join("; ")})`);
});

export function createQuranEncTextProvider(options: QuranEncOptions = {}): TextProvider {
  const base = (options.baseUrl ?? QURANENC_API_URL).replace(/\/$/, "");
  const enabled = options.editions?.length
    ? options.editions.map((id) => {
        const found = QURANENC_EDITIONS.find((e) => e.id === id);
        if (!found) throw new Error(`Unknown QuranEnc edition "${id}"`);
        return found;
      })
    : QURANENC_EDITIONS;
  const byId = new Map(enabled.map((e) => [e.id, e]));

  return {
    id: "quranenc",
    editions: () => enabled,

    async text(edition, surah): Promise<EditionText> {
      const key = byId.has(edition) ? QURANENC_KEYS[edition] : undefined;
      if (!key) throw new Error(`The QuranEnc provider does not serve edition "${edition}"`);
      const raw = await fetchSura(base, key, surah);
      if (!Array.isArray(raw.result) || raw.result.some((v) => Number(v.sura) !== surah)) {
        throw new Error(`The QuranEnc answer for ${key} sura ${surah} has an unexpected format`);
      }
      return {
        edition,
        surah,
        verses: raw.result.map((v) => {
          const notes = v.footnotes?.trim();
          return { number: Number(v.aya), text: v.translation.trim(), ...(notes ? { notes } : {}) };
        }),
      };
    },
  };
}

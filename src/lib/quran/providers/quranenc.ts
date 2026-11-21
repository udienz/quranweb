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
import { LOCALES } from "../../i18n/config";
import { completeEditions, languageIn } from "../edition-names";
import type { Edition, EditionText, SourceInfo } from "../types";

export const QURANENC_API_URL = "https://quranenc.com/api/v1";

const credit = (key: string, attribution: SourceInfo["attribution"]): SourceInfo => ({
  name: "QuranEnc.com",
  url: `https://quranenc.com/en/browse/${key}`,
  attribution,
});

/** A credit name that reads the same in every language (a person's or a centre's name in Latin letters). */
const sameEverywhere = (who: string): Record<string, string> => Object.fromEntries(LOCALES.map((ui) => [ui, who]));

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
    ur: `${who.ur}، بذریعہ QuranEnc.com، ورژن ${version}`,
    ar: `${who.ar}، عبر QuranEnc.com، الإصدار ${version}`,
    fa: `${who.fa}، از طریق QuranEnc.com، نسخهٔ ${version}`,
  });

// The name of a language in each interface language, for the names of the Al-Mukhtasar editions.
const LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  en: { en: "English", id: "Inggris", tr: "İngilizce", ms: "Inggeris", bn: "ইংরেজি", fr: "anglais", ru: "английский", ur: "انگریزی", ar: "الإنجليزية", fa: "انگلیسی" },
  tr: { en: "Turkish", id: "Turki", tr: "Türkçe", ms: "Turki", bn: "তুর্কি", fr: "turc", ru: "турецкий", ur: "ترکی", ar: "التركية", fa: "ترکی" },
  id: { en: "Indonesian", id: "Indonesia", tr: "Endonezce", ms: "Indonesia", bn: "ইন্দোনেশীয়", fr: "indonésien", ru: "индонезийский", ur: "انڈونیشیائی", ar: "الإندونيسية", fa: "اندونزیایی" },
  bn: { en: "Bengali", id: "Bengali", tr: "Bengalce", ms: "Bengali", bn: "বাংলা", fr: "bengali", ru: "бенгальский", ur: "بنگالی", ar: "البنغالية", fa: "بنگالی" },
  fr: { en: "French", id: "Prancis", tr: "Fransızca", ms: "Perancis", bn: "ফরাসি", fr: "français", ru: "французский", ur: "فرانسیسی", ar: "الفرنسية", fa: "فرانسوی" },
  ru: { en: "Russian", id: "Rusia", tr: "Rusça", ms: "Rusia", bn: "রুশ", fr: "russe", ru: "русский", ur: "روسی", ar: "الروسية", fa: "روسی" },
  fa: { en: "Persian", id: "Persia", tr: "Farsça", ms: "Parsi", bn: "ফারসি", fr: "persan", ru: "персидский", ur: "فارسی", ar: "الفارسية", fa: "فارسی" },
  ar: { en: "Arabic", id: "Arab", tr: "Arapça", ms: "Arab", bn: "আরবি", fr: "arabe", ru: "арабский", ur: "عربی", ar: "العربية", fa: "عربی" },
};

/** The book's title: its Arabic name for the interfaces in Arabic script, the transliterated one for the others. */
const MOKHTASAR_TITLE: Record<string, string> = { ur: "المختصر فی تفسیر القرآن", ar: "المختصر في تفسير القرآن الكريم", fa: "المختصر فی تفسیر القرآن" };

/**
 * One language of *Al-Mukhtasar fi Tafsir al-Qur'an*. QuranEnc publishes no version number for these, so the credit gives the
 * date of our copy instead.
 */
function mokhtasar(id: string, language: string, key: string, copied: string, direction: "ltr" | "rtl" = "ltr"): Edition {
  const names = LANGUAGE_NAMES[language] as Record<string, string> | undefined;
  const latin = "Al-Mukhtasar fi Tafsir al-Qur'an";
  const center = "Tafsir Center for Quranic Studies";
  return {
    id,
    kind: "tafsir",
    language,
    direction,
    // The Arabic original is named by its title alone.
    // Every interface language: the written language names first, the platform's for the others.
    name: Object.fromEntries(
      LOCALES.map((ui) => {
        const title = MOKHTASAR_TITLE[ui] ?? latin;
        const languageName = names?.[ui] ?? languageIn(language, ui);
        return [ui, language === "ar" && ui === "ar" ? title : `${title} (${languageName})`];
      }),
    ),
    author: center,
    source: credit(key, {
      en: `${center}, via QuranEnc.com (no version number published; copy of ${copied})`,
      id: `${center}, melalui QuranEnc.com (nomor versi tidak diterbitkan; salinan ${copied})`,
      tr: `${center}, QuranEnc.com üzerinden (sürüm numarası yayımlanmadı; ${copied} kopyası)`,
      ms: `${center}, melalui QuranEnc.com (nombor versi tidak diterbitkan; salinan ${copied})`,
      bn: `${center}, QuranEnc.com-এর মাধ্যমে (সংস্করণ নম্বর প্রকাশিত নয়; ${copied} তারিখের কপি)`,
      fr: `${center}, via QuranEnc.com (aucun numéro de version publié ; copie du ${copied})`,
      ru: `${center}, через QuranEnc.com (номер версии не опубликован; копия от ${copied})`,
      ur: `${center}، بذریعہ QuranEnc.com (ورژن نمبر شائع نہیں ہوا؛ ${copied} کی نقل)`,
      ar: `${center}، عبر QuranEnc.com (لم يُنشر رقم إصدار؛ نسخة ${copied})`,
      fa: `${center}، از طریق QuranEnc.com (شمارهٔ نسخه منتشر نشده؛ رونوشت ${copied})`,
    }),
  };
}

/**
 * The enabled editions. Their IDs follow the project's scheme (`{iso3}-{name}`); `ind-indonesianislam` keeps the ID it had
 * when it came through fawazahmed0, so readers' saved choices still work. Enabling another one = an entry here, after
 * adding its key to the data repository's sync script. **Update the version in the credit when the copy is refreshed**
 * (`sync-quranenc.mjs --check` reports a newer one).
 */
export const QURANENC_EDITIONS: Edition[] = completeEditions([
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
      ur: "انڈونیشیائی ترجمہ (Kemenag، QuranEnc)",
      ar: "الترجمة الإندونيسية (Kemenag، QuranEnc)",
      fa: "ترجمهٔ اندونزیایی (Kemenag، QuranEnc)",
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
      ur: "انڈونیشیا کی وزارتِ مذہبی امور (Kemenag)",
      ar: "وزارة الشؤون الدينية الإندونيسية (Kemenag)",
      fa: "وزارت امور دینی اندونزی (Kemenag)",
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
      ur: "رشید ماش کا فرانسیسی ترجمہ",
      ar: "ترجمة رشيد معاش الفرنسية",
      fa: "ترجمهٔ فرانسوی رشید ماش",
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
      ur: "رشید ماش",
      ar: "رشيد معاش",
      fa: "رشید ماش",
    }),
  },
  // The default tafsir with the Bengali, French and Russian interfaces (2026-11-21).
  mokhtasar("ben-mokhtasar", "bn", "bengali_mokhtasar", "2026-11-21"),
  mokhtasar("fra-mokhtasar", "fr", "french_mokhtasar", "2026-11-21"),
  mokhtasar("rus-mokhtasar", "ru", "russian_mokhtasar", "2026-11-21"),
  {
    // The default translation with the Urdu interface (2026-11-21): reviewed by QuranEnc. There is no Urdu Al-Mukhtasar.
    id: "urd-muhammadjunagar",
    kind: "translation",
    language: "ur",
    direction: "rtl",
    name: {
      en: "Urdu translation by Muhammad Junagarhi",
      id: "Terjemahan Urdu oleh Muhammad Junagarhi",
      tr: "Muhammad Junagarhi'nin Urduca meali",
      ms: "Terjemahan Urdu oleh Muhammad Junagarhi",
      bn: "মুহাম্মদ জুনাগড়ির উর্দু অনুবাদ",
      fr: "Traduction ourdoue de Muhammad Junagarhi",
      ru: "Перевод на урду Мухаммада Джунагархи",
      ur: "محمد جوناگڑھی کا اردو ترجمہ",
      ar: "ترجمة محمد جوناكري الأردية",
      fa: "ترجمهٔ اردوی محمد جوناگڑھی",
    },
    author: "Muhammad Junagarhi",
    source: translationCredit("urdu_junagarhi", "1.1.3", {
      en: "Muhammad Junagarhi",
      id: "Muhammad Junagarhi",
      tr: "Muhammad Junagarhi",
      ms: "Muhammad Junagarhi",
      bn: "মুহাম্মদ জুনাগড়ি",
      fr: "Muhammad Junagarhi",
      ru: "Мухаммад Джунагархи",
      ur: "محمد جوناگڑھی",
      ar: "محمد جوناكري",
      fa: "محمد جوناگڑھی",
    }),
  },
  {
    // The default translation with the Persian interface (2026-11-21): reviewed by QuranEnc.
    id: "fas-islamhousecompe",
    kind: "translation",
    language: "fa",
    direction: "rtl",
    name: {
      en: "Persian translation by the Rowwad Translation Center",
      id: "Terjemahan Persia oleh Rowwad Translation Center",
      tr: "Rowwad Tercüme Merkezi'nin Farsça meali",
      ms: "Terjemahan Parsi oleh Rowwad Translation Center",
      bn: "রাওয়াদ অনুবাদ কেন্দ্রের ফারসি অনুবাদ",
      fr: "Traduction persane du Centre de traduction Rowwad",
      ru: "Персидский перевод Центра переводов «Руввад»",
      ur: "رواد ٹرانسلیشن سینٹر کا فارسی ترجمہ",
      ar: "الترجمة الفارسية لمركز رواد للترجمة",
      fa: "ترجمهٔ فارسی مرکز ترجمهٔ رواد",
    },
    author: "Rowwad Translation Center",
    source: translationCredit("persian_ih", "1.1.3", {
      en: "Rowwad Translation Center",
      id: "Rowwad Translation Center",
      tr: "Rowwad Tercüme Merkezi",
      ms: "Rowwad Translation Center",
      bn: "রাওয়াদ অনুবাদ কেন্দ্র",
      fr: "Centre de traduction Rowwad",
      ru: "Центр переводов «Руввад»",
      ur: "رواد ٹرانسلیشن سینٹر",
      ar: "مركز رواد للترجمة",
      fa: "مرکز ترجمهٔ رواد",
    }),
  },
  // The default tafsir with the Persian and Arabic interfaces (2026-11-21); the Arabic one is the original.
  mokhtasar("fas-mokhtasar", "fa", "persian_mokhtasar", "2026-11-21", "rtl"),
  mokhtasar("ara-mokhtasar", "ar", "arabic_mokhtasar", "2026-11-21", "rtl"),
  // Wave 3 (2026-11-21): each the default translation of its interface; the other interface languages get their names from
  // completeEditions.
  {
    id: "spa-isagarcia",
    kind: "translation",
    language: "es",
    direction: "ltr",
    name: { en: "Spanish translation by Isa Garcia", id: "Terjemahan Spanyol oleh Isa Garcia", es: "Traducción al español de Isa García" },
    author: "Isa Garcia",
    source: translationCredit("spanish_garcia", "1.0.2", sameEverywhere("Isa Garcia")),
  },
  {
    id: "bos-rowwad",
    kind: "translation",
    language: "bs",
    direction: "ltr",
    name: { en: "Bosnian translation by the Rowwad Translation Center", id: "Terjemahan Bosnia oleh Rowwad Translation Center", bs: "Prijevod na bosanski jezik, Centar za prijevode Ruvvad" },
    author: "Rowwad Translation Center",
    source: translationCredit("bosnian_rwwad", "2.0.4", sameEverywhere("Rowwad Translation Center")),
  },
  {
    id: "zho-makin",
    kind: "translation",
    language: "zh",
    direction: "ltr",
    name: { en: "Chinese translation by Muhammad Makin, reviewed by Muhammad Sulaiman", id: "Terjemahan Tionghoa oleh Muhammad Makin, ditinjau Muhammad Sulaiman", zh: "马坚译本（穆罕默德·苏莱曼审订）" },
    author: "Muhammad Makin",
    source: translationCredit("chinese_suliman", "1.0.8", sameEverywhere("Muhammad Makin")),
  },
  {
    id: "tha-rowwad",
    kind: "translation",
    language: "th",
    direction: "ltr",
    name: { en: "Thai translation by the Rowwad Translation Center", id: "Terjemahan Thai oleh Rowwad Translation Center", th: "คำแปลภาษาไทย ศูนย์แปลรุววาด" },
    author: "Rowwad Translation Center",
    source: translationCredit("thai_rwwad", "1.0.1", sameEverywhere("Rowwad Translation Center")),
  },
  {
    id: "uzb-rowwad",
    kind: "translation",
    language: "uz",
    direction: "ltr",
    name: { en: "Uzbek translation by the Rowwad Translation Center", id: "Terjemahan Uzbek oleh Rowwad Translation Center", uz: "Руввод таржима маркази таржимаси" },
    author: "Rowwad Translation Center",
    source: translationCredit("uzbek_rwwad", "1.0.4", sameEverywhere("Rowwad Translation Center")),
  },
  {
    id: "tam-omarsharif",
    kind: "translation",
    language: "ta",
    direction: "ltr",
    name: { en: "Tamil translation by Omar Sharif", id: "Terjemahan Tamil oleh Omar Sharif", ta: "உமர் ஷரீஃப் தமிழ் மொழிபெயர்ப்பு" },
    author: "Omar Sharif",
    source: translationCredit("tamil_omar", "1.0.4", sameEverywhere("Omar Sharif")),
  },
  {
    id: "mal-kunhimuhammad",
    kind: "translation",
    language: "ml",
    direction: "ltr",
    name: { en: "Malayalam translation by Abdul Hamid Haidar and Kunhi Muhammad", id: "Terjemahan Malayalam oleh Abdul Hamid Haidar dan Kunhi Muhammad", ml: "അബ്ദുൽ ഹമീദ് ഹൈദർ, കുഞ്ഞി മുഹമ്മദ് എന്നിവരുടെ മലയാളം പരിഭാഷ" },
    author: "Abdul Hamid Haidar and Kunhi Muhammad",
    source: translationCredit("malayalam_kunhi", "1.0.3", sameEverywhere("Abdul Hamid Haidar and Kunhi Muhammad")),
  },
  // No Spanish Al-Mukhtasar: QuranEnc's copy has an empty 59:24 (its numbering is one verse off from 59:22), and the
  // text is never altered here, so it is left out until QuranEnc fixes it.
  mokhtasar("bos-mokhtasar", "bs", "bosnian_mokhtasar", "2026-11-21"),
  mokhtasar("zho-mokhtasar", "zh", "chinese_mokhtasar", "2026-11-21"),
  mokhtasar("tha-mokhtasar", "th", "thai_mokhtasar", "2026-11-21"),
  mokhtasar("uzb-mokhtasar", "uz", "uzbek_mokhtasar", "2026-11-21"),
  mokhtasar("tam-mokhtasar", "ta", "tamil_mokhtasar", "2026-11-21"),
  mokhtasar("mal-mokhtasar", "ml", "malayalam_mokhtasar", "2026-11-21"),
]);

/**
 * The keys our copy holds (`sync-quranenc.mjs` in the data repository). Every other key is read from QuranEnc's live API
 * even when a copy is configured: since 2026-11-21 new editions are not downloaded or mirrored (the owner's choice), only
 * kept in memory for a day after the first read (transport.ts).
 */
export const MIRRORED_KEYS: ReadonlySet<string> = new Set([
  "indonesian_affairs",
  "english_mokhtasar",
  "turkish_mokhtasar",
  "indonesian_mokhtasar",
  "french_rashid",
  "bengali_mokhtasar",
  "french_mokhtasar",
  "russian_mokhtasar",
  "urdu_junagarhi",
  "persian_ih",
  "persian_mokhtasar",
  "arabic_mokhtasar",
]);

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
  "urd-muhammadjunagar": "urdu_junagarhi",
  "fas-islamhousecompe": "persian_ih",
  "fas-mokhtasar": "persian_mokhtasar",
  "ara-mokhtasar": "arabic_mokhtasar",
  "spa-isagarcia": "spanish_garcia",
  "bos-rowwad": "bosnian_rwwad",
  "zho-makin": "chinese_suliman",
  "tha-rowwad": "thai_rwwad",
  "uzb-rowwad": "uzbek_rwwad",
  "tam-omarsharif": "tamil_omar",
  "mal-kunhimuhammad": "malayalam_kunhi",
  "bos-mokhtasar": "bosnian_mokhtasar",
  "zho-mokhtasar": "chinese_mokhtasar",
  "tha-mokhtasar": "thai_mokhtasar",
  "uzb-mokhtasar": "uzbek_mokhtasar",
  "tam-mokhtasar": "tamil_mokhtasar",
  "mal-mokhtasar": "malayalam_mokhtasar",
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
      const raw = await fetchSura(MIRRORED_KEYS.has(key) ? base : QURANENC_API_URL, key, surah);
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

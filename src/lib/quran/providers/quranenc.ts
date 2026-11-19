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

const credit = (key: string, en: string, id: string, tr: string): SourceInfo => ({
  name: "QuranEnc.com",
  url: `https://quranenc.com/en/browse/${key}`,
  attribution: { en, id, tr },
});

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
    name: { en: "Indonesian translation (Kemenag, QuranEnc)", id: "Terjemahan Kemenag RI (QuranEnc)", tr: "Endonezce meal (Kemenag, QuranEnc)" },
    author: "Kementerian Agama RI",
    source: credit(
      "indonesian_affairs",
      "Indonesian Ministry of Religious Affairs (Kemenag), via QuranEnc.com, version 1.0.1",
      "Kementerian Agama RI, melalui QuranEnc.com, versi 1.0.1",
      "Endonezya Din İşleri Bakanlığı (Kemenag), QuranEnc.com üzerinden, sürüm 1.0.1",
    ),
  },
  {
    id: "eng-mokhtasar",
    kind: "tafsir",
    language: "en",
    direction: "ltr",
    name: { en: "Al-Mukhtasar fi Tafsir al-Qur'an (English)", id: "Al-Mukhtasar fi Tafsir al-Qur'an (Inggris)", tr: "Al-Mukhtasar fi Tafsir al-Qur'an (İngilizce)" },
    author: "Tafsir Center for Quranic Studies",
    source: credit(
      "english_mokhtasar",
      "Tafsir Center for Quranic Studies, via QuranEnc.com (no version number published; copy of 2026-11-19)",
      "Tafsir Center for Quranic Studies, melalui QuranEnc.com (nomor versi tidak diterbitkan; salinan 2026-11-19)",
      "Tafsir Center for Quranic Studies, QuranEnc.com üzerinden (sürüm numarası yayımlanmadı; 2026-11-19 kopyası)",
    ),
  },
  {
    id: "tur-mokhtasar",
    kind: "tafsir",
    language: "tr",
    direction: "ltr",
    name: { en: "Al-Mukhtasar fi Tafsir al-Qur'an (Turkish)", id: "Al-Mukhtasar fi Tafsir al-Qur'an (Turki)", tr: "Al-Mukhtasar fi Tafsir al-Qur'an (Türkçe)" },
    author: "Tafsir Center for Quranic Studies",
    source: credit(
      "turkish_mokhtasar",
      "Tafsir Center for Quranic Studies, via QuranEnc.com (no version number published; copy of 2026-11-19)",
      "Tafsir Center for Quranic Studies, melalui QuranEnc.com (nomor versi tidak diterbitkan; salinan 2026-11-19)",
      "Tafsir Center for Quranic Studies, QuranEnc.com üzerinden (sürüm numarası yayımlanmadı; 2026-11-19 kopyası)",
    ),
  },
  {
    // A short tafsir in Indonesian beside the Kemenag one (the Indonesian default stays Kemenag).
    id: "ind-mokhtasar",
    kind: "tafsir",
    language: "id",
    direction: "ltr",
    name: { en: "Al-Mukhtasar fi Tafsir al-Qur'an (Indonesian)", id: "Al-Mukhtasar fi Tafsir al-Qur'an (Indonesia)", tr: "Al-Mukhtasar fi Tafsir al-Qur'an (Endonezce)" },
    author: "Tafsir Center for Quranic Studies",
    source: credit(
      "indonesian_mokhtasar",
      "Tafsir Center for Quranic Studies, via QuranEnc.com (no version number published; copy of 2026-11-19)",
      "Tafsir Center for Quranic Studies, melalui QuranEnc.com (nomor versi tidak diterbitkan; salinan 2026-11-19)",
      "Tafsir Center for Quranic Studies, QuranEnc.com üzerinden (sürüm numarası yayımlanmadı; 2026-11-19 kopyası)",
    ),
  },
];

/** The translation key at QuranEnc of each edition. */
export const QURANENC_KEYS: Record<string, string> = {
  "ind-indonesianislam": "indonesian_affairs",
  "eng-mokhtasar": "english_mokhtasar",
  "tur-mokhtasar": "turkish_mokhtasar",
  "ind-mokhtasar": "indonesian_mokhtasar",
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

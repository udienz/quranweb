// Public API for pages and components. The configuration is read from the environment
// when called (not at build time), so it can be changed through platform environment
// variables or `docker run -e` without a rebuild.
//
//   QURAN_API_URL    base URL of an EQuran.id v2 format API (default https://equran.id/api/v2)
//   QURAN_AUDIO_URL  base URL of the audio (default https://cdn.equran.id)
//   QURAN_FAWAZ_URL  base URL of fawazahmed0/quran-api (default jsDelivr; point it to our own mirror)
//
// Deliberately NOT wrapped in "use cache": data is fetched per request (see
// `instant = false` on every page), so the build needs no network access to the sources.

import { createEquranAudioProvider, createEquranTextProvider } from "./providers/equran";
import { createFawazTextProvider } from "./providers/fawazahmed0";
import { createQuranService, type QuranConfig, type QuranService } from "./service";

export type * from "./types";
export type { AudioProvider, TextProvider } from "./provider";
export { createQuranService } from "./service";
export type { QuranConfig, QuranService } from "./service";

export function defaultConfig(env: Record<string, string | undefined> = process.env): QuranConfig {
  const options = { baseUrl: env.QURAN_API_URL, audioBaseUrl: env.QURAN_AUDIO_URL };
  return {
    // Order = priority. fawazahmed0 only adds editions to the catalog; the defaults
    // below still come from EQuran.id.
    textProviders: [createEquranTextProvider(options), createFawazTextProvider({ baseUrl: env.QURAN_FAWAZ_URL })],
    audioProviders: [createEquranAudioProvider(options)],
    defaults: {
      arabic: "ara-equran",
      transliteration: "ara-equran-la",
      translations: ["ind-kemenag"],
      tafsir: "ind-kemenag-tafsir",
      qari: "misyari-rasyid-al-afasi",
    },
    // With the English interface, read an English translation unless the reader chose otherwise.
    localeDefaults: { en: { translations: ["eng-abdullahyusufal"] } },
  };
}

export function getQuran(): QuranService {
  return createQuranService(defaultConfig());
}

export const getAllSurah = () => getQuran().getSurahList();

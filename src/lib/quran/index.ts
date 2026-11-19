// Public API for pages and components. The configuration is read from the environment
// when called (not at build time), so it can be changed through platform environment
// variables or `docker run -e` without a rebuild.
//
//   QURAN_API_URL    base URL of an EQuran.id v2 format API (default https://equran.id/api/v2)
//   QURAN_AUDIO_URL  base URL of the audio (default https://cdn.equran.id)
//   QURAN_FAWAZ_URL  base URL of fawazahmed0/quran-api (default jsDelivr; point it to our own mirror)
//   QURAN_QURANENC_URL  base URL of QuranEnc (default the live API; point it to the private copy, /data/quranenc)
//   QURAN_CONFIG     path of a JSON file that replaces the built-in source registry (see sources.ts)
//
// Each base URL can also be a directory with a local copy of the mirror (no HTTP needed).
//
// Deliberately NOT wrapped in "use cache": data is fetched per request (see
// `instant = false` on every page), so the build needs no network access to the sources.

import { createQuranService, type QuranConfig, type QuranService } from "./service";
import { loadSourceConfig, toQuranConfig, type Env } from "./sources";

export type * from "./types";
export type { AudioProvider, TextProvider } from "./provider";
export { createQuranService } from "./service";
export type { QuranConfig, QuranService } from "./service";
export { DEFAULT_SOURCES, parseSourceConfig, SourceConfigError } from "./sources";
export type { SourceConfig } from "./sources";

/** The runtime configuration: the source registry (see sources.ts) with the providers built. */
export function defaultConfig(env: Env = process.env): QuranConfig {
  return toQuranConfig(loadSourceConfig(env));
}

export function getQuran(): QuranService {
  return createQuranService(defaultConfig());
}

export const getAllSurah = () => getQuran().getSurahList();
export const getJuzList = () => getQuran().getJuzList();

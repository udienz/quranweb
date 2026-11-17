import { localized } from "../i18n/translate";
import type { SurahMeta } from "./types";

/** The meaning of a surah's name in a language, falling back to English or any available one. */
export function meaningOf(meta: SurahMeta, language: string): string {
  return localized(meta.name.meaning, language);
}

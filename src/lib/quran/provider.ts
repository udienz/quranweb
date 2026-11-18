import type { Edition, EditionText, JuzRef, Qari, SurahMeta } from "./types";

/**
 * A text source. A provider serves one or more editions and maps its source's
 * responses to the internal schema (see types.ts).
 */
export interface TextProvider {
  /** Unique provider ID, used in error messages and logs. */
  id: string;
  /** The editions this provider serves. */
  editions(): Edition[];
  /** Metadata of the 114 surahs. Optional: a text-only provider may not have it. */
  surahs?(): Promise<SurahMeta[]>;
  /**
   * Extra meanings of surah names per language, keyed by surah number, merged into the
   * metadata (for example English meanings). Optional; failures are ignored.
   */
  surahMeanings?(): Promise<Record<number, Record<string, string>>>;
  /** Where each of the 30 juz starts and ends. Optional; the service checks it against the surah list. */
  juzs?(): Promise<JuzRef[]>;
  /** The content of one edition for one surah. Throws on failure. */
  text(edition: string, surah: number): Promise<EditionText>;
}

/** A recitation audio source, separate from text. */
export interface AudioProvider {
  id: string;
  qaris(): Qari[];
  /** Audio URLs of one verse for a reciter, preferred first. */
  urls(qari: string, surah: number, verse: number): string[];
}

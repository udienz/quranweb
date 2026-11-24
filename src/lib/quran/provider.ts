import type { Edition, EditionText, JuzRef, MushafPageRef, Qari, RukuRef, SurahMeta, TajweedRun } from "./types";

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
  /** Where each of the 604 pages of the printed mushaf starts and ends. Optional; the service checks it like the juz. */
  mushafPages?(): Promise<MushafPageRef[]>;
  /** The tajweed text of a surah, one list of runs per verse. Optional (the QUL copy). */
  tajweed?(surah: number): Promise<TajweedRun[][]>;
  /** Where each ruku starts and ends. Optional; the service checks it like the juz. */
  rukus?(): Promise<RukuRef[]>;
  /** The content of one edition for one surah. Throws on failure. */
  text(edition: string, surah: number): Promise<EditionText>;
}

/** A recitation audio source, separate from text. */
export interface AudioProvider {
  id: string;
  qaris(): Qari[];
  /** Audio URLs of one verse for a reciter, preferred first. */
  urls(qari: string, surah: number, verse: number): string[];
  /** Audio URLs of the whole surah as one file for a reciter, preferred first. Optional: not every source has them. */
  surahUrls?(qari: string, surah: number): string[];
  /** The bitrate of one of its URLs in kbps, when the provider knows it (used to order the URLs for data saving). */
  kbps?(url: string): number | undefined;
}

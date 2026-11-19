// Internal edition-based schema. Every data source (EQuran.id, our own mirrors,
// fawazahmed0/quran-api, ...) is mapped to these shapes by a provider, so the UI
// never depends on a particular API's format.
//
// One EDITION = one translation, one tafsir, one Arabic text or one
// transliteration. Edition IDs are stable and independent of the provider (they are
// stored in user choices) and follow fawazahmed0's naming: `{iso3-language}-{name}`,
// with the suffix `-la` for a Latin transliteration.

import type { LocalizedText } from "../i18n/translate";

export type EditionKind = "arabic" | "transliteration" | "translation" | "tafsir";

/** Where a piece of content comes from and what must be credited. */
export interface SourceInfo {
  name: string;
  url?: string;
  /** Licence or terms of use, when known. */
  license?: string;
  /** Credit line shown in the UI, per language, without a label ("Ministry, via EQuran.id"). */
  attribution: LocalizedText;
}

export interface Edition {
  id: string;
  kind: EditionKind;
  /** ISO 639-1 code of the content, e.g. "ar", "id", "en". */
  language: string;
  direction: "ltr" | "rtl";
  /** Display name per interface language. */
  name: LocalizedText;
  author?: string;
  source: SourceInfo;
}

export interface Qari {
  id: string;
  /** A person's name, the same in every language. */
  name: string;
  source: SourceInfo;
}

/** Surah metadata, independent of any edition. */
export interface SurahMeta {
  number: number;
  verseCount: number;
  name: {
    arabic: string;
    latin: string;
    /** Meaning of the name per language, e.g. { id: "Pembukaan", en: "The Opening" }. */
    meaning: Record<string, string>;
  };
  revelation: "mecca" | "medina";
  /** Short description (plain text) per language. */
  description: Record<string, string>;
}

/** A verse by surah and verse number. */
export interface VerseRef {
  surah: number;
  verse: number;
}

/** One of the 30 juz: the first and the last verse (a juz usually starts and ends inside a surah). */
export interface JuzRef {
  juz: number;
  start: VerseRef;
  end: VerseRef;
}

export interface VerseText {
  /** Verse number within the surah, starting at 1. */
  number: number;
  text: string;
  /** The edition's own footnotes for this verse (QuranEnc), shown as they are published. */
  notes?: string;
}

/** The content of one edition for one surah. */
export interface EditionText {
  edition: string;
  surah: number;
  verses: VerseText[];
}

/** The editions and reciter chosen for one view. */
export interface Selection {
  arabic: string;
  transliteration: string | null;
  translations: string[];
  tafsir: string | null;
  qari: string;
}

export interface VerseView {
  number: number;
  arabic: string;
  transliteration: string | null;
  translations: { edition: string; text: string; notes?: string }[];
  tafsir: string | null;
  /** Audio URLs in priority order; the first one is tried first. */
  audio: string[];
}

export interface SurahView {
  meta: SurahMeta;
  selection: Selection;
  /** The verses in `verses`, as verse numbers (`meta.verseCount` is the whole surah). */
  range: { from: number; to: number };
  /** The editions and reciter used, for the credits in the UI. */
  editions: Edition[];
  qari: Qari;
  verses: VerseView[];
}

export interface Catalog {
  editions: Edition[];
  qaris: Qari[];
}

// A verse typed as a reference: "2:255", "2 255", "baqarah 255", "Al-Baqarah 2:255", "QS. Al-Baqarah: 255",
// "Qur'an 2:255 (Al-Baqarah)" (the form the share menu writes). Pure functions, used by the surah list's search box.

import { surahFromSegment, verseFromSegment } from "./surah-number";

export interface Reference {
  surah: number;
  /** The verse, or null when the surah has no such verse (the reference then leads to the surah). */
  verse: number | null;
}

interface Named {
  number: number;
  name: { latin: string };
}

/** Lower case, no accents, no apostrophes or hyphens: "Al-Ma'idah" and "al maidah" compare equal. */
const letters = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");

/** Words that say "this is a surah or a verse" and are not part of a name. */
const FILLER = /\b(?:q\.?\s?s|qur'?an|al-?quran|surat|surah|sura|ayat|ayah|verse|no|nomor|number)\b/g;

/** The names a surah is known by: the whole name, the part after a hyphen ("Al-Baqarah" is also "Baqarah") and each word. */
function aliases(latin: string): string[] {
  const parts = latin
    .toLowerCase()
    .split(/[\s-]+/)
    .map(letters)
    .filter((p) => p.length >= 3);
  return [...new Set([letters(latin), ...parts])];
}

/** The surah a typed name stands for, or null when it matches none or more than one. */
function surahByName(name: string, surahs: readonly Named[]): number | null {
  if (name.length < 3) return null;
  const exact = new Set<number>();
  const prefix = new Set<number>();
  for (const s of surahs) {
    for (const alias of aliases(s.name.latin)) {
      if (alias === name) exact.add(s.number);
      else if (alias.startsWith(name)) prefix.add(s.number);
    }
  }
  if (exact.size === 1) return [...exact][0];
  if (exact.size > 1) return null;
  return prefix.size === 1 ? [...prefix][0] : null;
}

/**
 * The verse a query refers to, or null when it is not a reference. Two numbers are a surah and a verse ("2:255"); one number
 * with a surah's name is a verse of that surah ("baqarah 255"); a number alone is a surah number, which the list's own filter
 * already finds, so it is not a reference.
 */
export function parseReference(query: string, surahs: readonly Named[]): Reference | null {
  const lowered = query.toLowerCase();
  const numbers = [...lowered.matchAll(/\d+/g)].map((m) => m[0]);
  if (numbers.length === 0 || numbers.length > 2 || numbers.some((n) => n.length > 4)) return null;
  const name = letters(lowered.replace(/\d+/g, " ").replace(/[^a-z'’\- ]/g, " ").replace(FILLER, " "));

  let surah: number | null;
  let verse: string;
  if (numbers.length === 2) {
    surah = surahFromSegment(numbers[0]);
    verse = numbers[1];
  } else {
    if (!name) return null;
    surah = surahByName(name, surahs);
    verse = numbers[0];
  }
  if (surah === null) return null;
  return { surah, verse: verseFromSegment(surah, verse) };
}

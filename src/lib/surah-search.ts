// The suggestions of the home page's surah search box: which of the 114 surahs a typed text stands for, best match first.
// Pure functions. It reads a surah number ("2", also in Arabic-Indic digits), a Latin name or part of one ("baqarah", "imran",
// "maidah": accents, hyphens, apostrophes and spaces do not count), an Arabic name or part of one (vowel marks and the
// different forms of alif, ya and ha do not count) and, last of all, the meaning of the name in the reader's language.

import { normalizeArabic, hasArabic } from "./search/normalize";
import type { SurahMeta } from "./quran/types";

/** How many suggestions the box shows. */
export const MAX_SUGGESTIONS = 8;

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/** Digits written in Arabic-Indic or Persian forms become 0 to 9. */
export function westernDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : EXTENDED_INDIC.indexOf(d));
  });
}

/** Lower case, no accents, and only a to z: "Al-Ma'idah" and "al maidah" compare equal. */
const latinLetters = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");

/** The Latin names a surah is known by: the whole name and each word of three letters or more ("Al-Baqarah" is also "Baqarah"). */
function latinAliases(latin: string): string[] {
  const words = latin
    .toLowerCase()
    .split(/[\s-]+/)
    .map(latinLetters)
    .filter((w) => w.length >= 3);
  return [...new Set([latinLetters(latin), ...words])];
}

/** Arabic as compared: no marks, one form of each letter, no spaces. */
const arabicLetters = (text: string): string => normalizeArabic(text).replace(/[^؀-ۿ]/g, "");
const withoutArticle = (text: string): string => (text.startsWith("ال") && text.length > 2 ? text.slice(2) : text);

/** 0 is the best match, null no match. */
function rankNumber(number: number, digits: string): number | null {
  const text = String(number);
  if (text === digits) return 0;
  return text.startsWith(digits) ? 1 : null;
}

function rankLatin(surah: SurahMeta, query: string, meaning: string): number | null {
  const aliases = latinAliases(surah.name.latin);
  if (aliases.includes(query)) return 0;
  if (aliases.some((a) => a.startsWith(query))) return 1;
  // One letter would match nearly every name, so from the second letter on the query may also sit inside a name.
  if (query.length >= 2 && aliases[0].includes(query)) return 2;
  if (query.length >= 3 && latinLetters(meaning).includes(query)) return 3;
  return null;
}

function rankArabic(surah: SurahMeta, query: string): number | null {
  const name = arabicLetters(surah.name.arabic);
  const bare = withoutArticle(name);
  const q = withoutArticle(query);
  if (query === name || q === bare) return 0;
  if (name.startsWith(query) || bare.startsWith(q)) return 1;
  if (q.length >= 2 && bare.includes(q)) return 2;
  return null;
}

/**
 * The surahs a query stands for, best match first, at most `limit`. An empty query, or one that spells nothing, gives none.
 * `meaningOf` gives the meaning of a surah's name in the reader's language.
 */
export function searchSurahs(
  surahs: readonly SurahMeta[],
  query: string,
  meaningOf: (surah: SurahMeta) => string,
  limit = MAX_SUGGESTIONS,
): SurahMeta[] {
  const text = westernDigits(query).trim();
  if (!text) return [];
  const scored: { surah: SurahMeta; rank: number }[] = [];
  if (/^\d+$/.test(text)) {
    for (const surah of surahs) {
      const rank = rankNumber(surah.number, text.replace(/^0+(?=\d)/, ""));
      if (rank !== null) scored.push({ surah, rank });
    }
  } else if (hasArabic(text)) {
    const arabic = arabicLetters(text);
    if (arabic) {
      for (const surah of surahs) {
        const rank = rankArabic(surah, arabic);
        if (rank !== null) scored.push({ surah, rank });
      }
    }
  } else {
    const latin = latinLetters(text);
    if (latin) {
      for (const surah of surahs) {
        const rank = rankLatin(surah, latin, meaningOf(surah));
        if (rank !== null) scored.push({ surah, rank });
      }
    }
  }
  return scored.sort((a, b) => a.rank - b.rank || a.surah.number - b.surah.number).slice(0, limit).map((s) => s.surah);
}

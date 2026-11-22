// How a search query is read and how text is compared: Arabic without its vowel marks and with one form of each letter,
// Latin words without accents and with a few spellings of the same word treated as one. Pure functions. The index is built by
// scripts/build-search-index.mjs, which has its own copy of `normalizeArabic`; a test checks that the two agree.

/** Arabic text as it is indexed and searched: no vowel marks, tatweel or direction marks, one alif, one ya, one ha. */
export function normalizeArabic(text: string): string {
  return text
    // Quranic annotation signs, harakat, the superscript alef, Quranic marks, tatweel and the direction marks.
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ‎‏]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

const ARABIC = /[؀-ۿ]/;
export const hasArabic = (text: string): boolean => ARABIC.test(text);

/**
 * Spellings that mean the same word: a search for one finds the others. Indonesian writes many words from Arabic in more than
 * one way (shalat, salat, sholat), and an English translation another (salat, zakat). The words are compared without accents.
 */
const VARIANTS: readonly (readonly string[])[] = [
  ["shalat", "salat", "sholat", "solat", "salah"],
  ["zakat", "zakah", "zakaat"],
  ["muhammad", "muhamad", "mohammed", "mohamed"],
];

/** The words of a query: letters and digits, lower case, one letter alone dropped (it would match everything). */
export function queryWords(query: string): string[] {
  const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.filter((w) => w.length > 1 || /\p{N}/u.test(w));
}

/** Without accents, to look a word up in VARIANTS ("salāt" is "salat"). */
const plain = (word: string): string => word.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** A word and the other spellings of it. */
export function spellings(word: string): string[] {
  const key = plain(word);
  const group = VARIANTS.find((g) => g.includes(key));
  return group ? [...group] : [word];
}

const quote = (text: string): string => `"${text.replace(/"/g, '""')}"`;

/**
 * The FTS5 expression for a query in Latin script: every word must be found (the last one may be cut short, as it is typed),
 * and each word may be any of its spellings. Every word is quoted, so a word such as AND, NEAR or a symbol is never read as
 * the query language. Null when nothing is left to search for.
 */
export function wordExpression(query: string): string | null {
  const words = queryWords(query);
  if (words.length === 0) return null;
  return words
    .map((word, i) => {
      const star = i === words.length - 1 ? "*" : "";
      const alternatives = spellings(word).map((w) => `${quote(w)}${star}`);
      return alternatives.length > 1 ? `(${alternatives.join(" OR ")})` : alternatives[0];
    })
    .join(" ");
}

/** The shortest Arabic text the trigram index can look for. */
export const MIN_ARABIC = 3;

/**
 * The FTS5 expression for a query in Arabic script: the whole text, normalized, as one phrase found anywhere in a verse (the
 * index holds trigrams, so the article and prepositions attached to a word do not hide it). Null when it is too short.
 */
export function arabicExpression(query: string): string | null {
  const text = normalizeArabic(query).replace(/\s+/g, " ").trim();
  return text.length < MIN_ARABIC ? null : quote(text);
}

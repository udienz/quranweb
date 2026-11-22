/** How many pages the printed Madinah mushaf has (the table of them is checked against this in quran/mushaf-pages.ts). */
export const MUSHAF_PAGES = 604;

/** The surah number in a `/surah/<number>` address, or null when it is not one of the 114 (the page and proxy.ts agree). */
export function surahFromSegment(segment: string): number | null {
  // Digits only: Number() alone would also take "1e2" (100) and "0x10" (16).
  if (!/^\d{1,4}$/.test(segment)) return null;
  const n = Number(segment);
  return n >= 1 && n <= 114 ? n : null;
}

/**
 * How many verses each of the 114 surahs has, in order (6,236 in all). A table of ours because `proxy.ts` must tell a real
 * verse address from a wrong one before anything is rendered, and it cannot wait for the data sources; a test compares it
 * with the surah list of the sources.
 */
export const VERSE_COUNTS: readonly number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88,
  69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

/** The page number in a `/mushaf/<page>` address (1 to 604, of the printed Madinah mushaf), or null. */
export function mushafPageFromSegment(segment: string): number | null {
  if (!/^\d{1,4}$/.test(segment)) return null;
  const n = Number(segment);
  return n >= 1 && n <= MUSHAF_PAGES ? n : null;
}

/** The verse number in a `/surah/<number>/<verse>` address, or null when the surah has no such verse. */
export function verseFromSegment(surah: number, segment: string): number | null {
  if (!/^\d{1,4}$/.test(segment)) return null;
  const n = Number(segment);
  return n >= 1 && n <= (VERSE_COUNTS[surah - 1] ?? 0) ? n : null;
}

// The global number of a verse (1 to 6,236), which some audio sources use instead of surah and verse.

/** Verses in each surah (Hafs count), surah 1 first. Generated from the EQuran.id surah list; the total is 6,236. */
export const VERSE_COUNTS: readonly number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98,
  135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88,
  75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29,
  22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31,
  50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8,
  19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const FIRST: number[] = [];
VERSE_COUNTS.reduce((before, count, i) => {
  FIRST[i] = before + 1;
  return before + count;
}, 0);

/** The global number of a verse: 1:1 is 1, 2:255 is 262, 114:6 is 6,236. Throws on a verse that does not exist. */
export function ayahNumber(surah: number, verse: number): number {
  const count = VERSE_COUNTS[surah - 1];
  if (!Number.isInteger(surah) || !Number.isInteger(verse) || count === undefined || verse < 1 || verse > count) {
    throw new Error(`There is no verse ${surah}:${verse}`);
  }
  return FIRST[surah - 1] + verse - 1;
}

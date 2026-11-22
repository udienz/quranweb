// The verse of the day on the home page: one verse from a list chosen by hand (`VERSES_OF_THE_DAY`), in turn, changing at midnight in
// Indonesia (Asia/Jakarta, UTC+7, no daylight saving). The order is not the order of the list, which follows the mushaf: the day number
// times `STEP`, modulo the length of the list. `STEP` shares no factor with the length (a test checks it), so every verse comes once in
// every cycle. The list holds verses that can be read on their own, in the words of any translation; the owner reviews it.

export interface VerseRef {
  surah: number;
  verse: number;
}

/** Verses chosen for the home page, as [surah, verse]. Changing the list changes which verse shows on which day. */
export const VERSES_OF_THE_DAY: readonly (readonly [number, number])[] = [
  [1, 5], [1, 6], [2, 152], [2, 153], [2, 155], [2, 186], [2, 201], [2, 255], [2, 256], [2, 286],
  [3, 8], [3, 139], [3, 159], [3, 173], [3, 185], [4, 36], [4, 103], [5, 2], [7, 56], [7, 199],
  [8, 46], [9, 51], [9, 129], [10, 62], [11, 88], [12, 87], [13, 11], [13, 28], [14, 7], [15, 99],
  [16, 90], [16, 97], [17, 23], [17, 80], [18, 10], [20, 14], [20, 114], [21, 87], [21, 107], [23, 118],
  [25, 63], [29, 45], [29, 69], [31, 17], [33, 41], [39, 10], [39, 53], [40, 60], [41, 34], [42, 43],
  [49, 10], [49, 13], [51, 56], [55, 13], [57, 4], [64, 11], [65, 3], [93, 3], [94, 5], [94, 6], [103, 3],
];

const STEP = 7;
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The verse of the day for the day that `now` falls on in Jakarta. */
export function dailyVerse(now: number): VerseRef {
  const day = Math.floor((now + JAKARTA_OFFSET_MS) / DAY_MS);
  const n = VERSES_OF_THE_DAY.length;
  const [surah, verse] = VERSES_OF_THE_DAY[(((day * STEP) % n) + n) % n];
  return { surah, verse };
}

/** Today's verse, read from the clock (call it at request time). */
export const todaysVerse = (): VerseRef => dailyVerse(Date.now());

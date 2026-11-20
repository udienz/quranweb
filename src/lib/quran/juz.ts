// The 30 juz: where each starts and ends. A wrong table would make audio skip or repeat verses, so the table that a source
// gives is checked against the surah list before it is used.

import { checkRanges } from "./ranges";
import type { JuzRef, SurahMeta } from "./types";

export const JUZ_COUNT = 30;

/** Throws a message naming the first fault: the wrong number of juz, a juz out of order, a verse that does not exist, or a gap or overlap. */
export function checkJuzList(list: JuzRef[], surahs: SurahMeta[]): void {
  checkRanges(list, surahs, { count: JUZ_COUNT, number: (r) => r.juz, one: "juz", many: "juz" });
}

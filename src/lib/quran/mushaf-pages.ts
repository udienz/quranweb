// The 604 pages of the printed Madinah mushaf: where each starts and ends. A page can hold the end of one surah and the
// start of the next (page 604 has three surahs). The table a source gives is checked against the surah list before it is
// used, like the juz.

import { checkRanges, rangeOf } from "./ranges";
import type { MushafPageRef, SurahMeta, VerseRef } from "./types";

export const MUSHAF_PAGE_COUNT = 604;

/** Throws a message naming the first fault: the wrong number of pages, a page out of order, a verse that does not exist, or a gap or overlap. */
export function checkMushafPages(list: MushafPageRef[], surahs: SurahMeta[]): void {
  checkRanges(list, surahs, { count: MUSHAF_PAGE_COUNT, number: (r) => r.page, one: "page", many: "pages" });
}

/** The mushaf page a verse is on, in a checked table. Undefined only for a verse that does not exist. */
export function mushafPageOf(list: MushafPageRef[], verse: VerseRef): number | undefined {
  return rangeOf(list, verse)?.page;
}

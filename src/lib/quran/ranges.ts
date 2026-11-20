// A numbered list of verse ranges that covers the whole Qur'an in order: the 30 juz, or the 604 pages of the printed mushaf.
// A source gives the table; a wrong one would make audio skip or repeat verses, or put a verse on the wrong page, so it is
// checked against the surah list before it is used.

import type { SurahMeta, VerseRef } from "./types";

export interface VerseRange {
  start: VerseRef;
  end: VerseRef;
}

export interface RangeKind<T> {
  /** How many ranges the table must have. */
  count: number;
  /** The number of a range, for example `(r) => r.juz`. */
  number: (range: T) => number;
  /** Words for messages: "juz" and "juz", or "page" and "pages". */
  one: string;
  many: string;
}

const label = (r: VerseRef) => `${r.surah}:${r.verse}`;
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** `a` comes before `b` in the Qur'an, or is `b`. */
export const atOrBefore = (a: VerseRef, b: VerseRef) => a.surah < b.surah || (a.surah === b.surah && a.verse <= b.verse);

/**
 * Throws a message naming the first fault: the wrong number of ranges, one out of order, a verse that does not exist, or a
 * gap or overlap. A valid table numbers its ranges 1 to `count`, starts at 1:1, ends at the last verse of the last surah,
 * and starts every range right after the previous one ends.
 */
export function checkRanges<T extends VerseRange>(list: T[], surahs: SurahMeta[], kind: RangeKind<T>): void {
  const verseCount = new Map(surahs.map((s) => [s.number, s.verseCount]));
  if (list.length !== kind.count) throw new Error(`Expected ${kind.count} ${kind.many}, got ${list.length}`);

  const exists = (r: VerseRef) => Number.isInteger(r.verse) && r.verse >= 1 && r.verse <= (verseCount.get(r.surah) ?? 0);
  const after = (r: VerseRef): VerseRef => (r.verse < (verseCount.get(r.surah) ?? 0) ? { surah: r.surah, verse: r.verse + 1 } : { surah: r.surah + 1, verse: 1 });
  const name = capital(kind.one);

  list.forEach((range, i) => {
    const n = kind.number(range);
    if (n !== i + 1) throw new Error(`${name} ${i + 1} is listed as ${kind.one} ${n}`);
    if (!exists(range.start)) throw new Error(`${name} ${n} starts at ${label(range.start)}, which is not a verse`);
    if (!exists(range.end)) throw new Error(`${name} ${n} ends at ${label(range.end)}, which is not a verse`);
    if (!atOrBefore(range.start, range.end)) throw new Error(`${name} ${n} ends (${label(range.end)}) before it starts (${label(range.start)})`);
    const expected = i === 0 ? { surah: 1, verse: 1 } : after(list[i - 1].end);
    if (range.start.surah !== expected.surah || range.start.verse !== expected.verse) {
      throw new Error(`${name} ${n} starts at ${label(range.start)}, expected ${label(expected)} (right after the previous ${kind.one})`);
    }
  });

  const last = list[kind.count - 1].end;
  const lastSurah = Math.max(...verseCount.keys());
  if (last.surah !== lastSurah || last.verse !== verseCount.get(lastSurah)) {
    throw new Error(`The last ${kind.one} ends at ${label(last)}, not at the end of surah ${lastSurah}`);
  }
}

/**
 * The range that holds a verse, in a table that `checkRanges` accepted (binary search). Undefined for a verse before the
 * first range or after the last, which a checked table does not have for a real verse.
 */
export function rangeOf<T extends VerseRange>(list: T[], verse: VerseRef): T | undefined {
  let low = 0;
  let high = list.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (!atOrBefore(list[mid].start, verse)) high = mid - 1;
    else if (!atOrBefore(verse, list[mid].end)) low = mid + 1;
    else return list[mid];
  }
  return undefined;
}

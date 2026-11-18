// The 30 juz: where each starts and ends. A wrong table would make audio skip or repeat verses, so the table that a source
// gives is checked against the surah list before it is used.

import type { JuzRef, SurahMeta, VerseRef } from "./types";

export const JUZ_COUNT = 30;

/** Throws a message naming the first fault: the wrong number of juz, a juz out of order, a verse that does not exist, or a gap or overlap. */
export function checkJuzList(list: JuzRef[], surahs: SurahMeta[]): void {
  const verseCount = new Map(surahs.map((s) => [s.number, s.verseCount]));
  if (list.length !== JUZ_COUNT) throw new Error(`Expected ${JUZ_COUNT} juz, got ${list.length}`);

  const exists = (r: VerseRef) => Number.isInteger(r.verse) && r.verse >= 1 && r.verse <= (verseCount.get(r.surah) ?? 0);
  const label = (r: VerseRef) => `${r.surah}:${r.verse}`;
  const after = (r: VerseRef): VerseRef => (r.verse < (verseCount.get(r.surah) ?? 0) ? { surah: r.surah, verse: r.verse + 1 } : { surah: r.surah + 1, verse: 1 });
  const before = (a: VerseRef, b: VerseRef) => a.surah < b.surah || (a.surah === b.surah && a.verse <= b.verse);

  list.forEach((juz, i) => {
    if (juz.juz !== i + 1) throw new Error(`Juz ${i + 1} is listed as juz ${juz.juz}`);
    if (!exists(juz.start)) throw new Error(`Juz ${juz.juz} starts at ${label(juz.start)}, which is not a verse`);
    if (!exists(juz.end)) throw new Error(`Juz ${juz.juz} ends at ${label(juz.end)}, which is not a verse`);
    if (!before(juz.start, juz.end)) throw new Error(`Juz ${juz.juz} ends (${label(juz.end)}) before it starts (${label(juz.start)})`);
    const expected = i === 0 ? { surah: 1, verse: 1 } : after(list[i - 1].end);
    if (juz.start.surah !== expected.surah || juz.start.verse !== expected.verse) {
      throw new Error(`Juz ${juz.juz} starts at ${label(juz.start)}, expected ${label(expected)} (right after the previous juz)`);
    }
  });

  const last = list[JUZ_COUNT - 1].end;
  const lastSurah = Math.max(...verseCount.keys());
  if (last.surah !== lastSurah || last.verse !== verseCount.get(lastSurah)) {
    throw new Error(`The last juz ends at ${label(last)}, not at the end of surah ${lastSurah}`);
  }
}

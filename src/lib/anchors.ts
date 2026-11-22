// Links to pages and verses of a surah, and the anchors of verses in the reader. Links
// copied from earlier versions used the Indonesian prefix "ayat-", so it is still
// understood and rewritten.

import { pageOf } from "./pagination";

export const verseId = (verse: number) => `verse-${verse}`;

/** The URL of one page of a surah; the first page has no query. */
export const pageHref = (surah: number, page: number) => `/surah/${surah}${page > 1 ? `?page=${page}` : ""}`;

/** The URL of a verse: the page that contains it, then the anchor. */
export const verseHref = (surah: number, verse: number) => `${pageHref(surah, pageOf(verse))}#${verseId(verse)}`;

/** The verse number in an element ID such as "verse-12", or null. */
export function verseFromId(id: string): number | null {
  const match = /^verse-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

/** Turns a legacy hash ("#ayat-12") into the current one ("#verse-12"); anything else is returned as is. */
export function normalizeHash(hash: string): string {
  const legacy = /^#ayat-(\d+)$/.exec(hash);
  return legacy ? `#verse-${legacy[1]}` : hash;
}

/** The verse a location hash points to ("#verse-12" or the legacy "#ayat-12"), or null. */
export function verseFromHash(hash: string): number | null {
  return verseFromId(normalizeHash(hash).slice(1));
}

/** One page of the printed Madinah mushaf, `/mushaf/50`. A page can hold the end of one surah and the start of the next. */
export const mushafHref = (page: number) => `/mushaf/${page}`;

/** The element id of a verse on a mushaf page: the number of the verse alone is not enough, a page can hold several surahs. */
export const mushafVerseId = (surah: number, verse: number) => `verse-${surah}-${verse}`;

/** The page of one verse, to share: `/surah/2/255`. It has its own preview; "read in the surah" leads on to `verseHref`. */
export const versePageHref = (surah: number, verse: number) => `/surah/${surah}/${verse}`;

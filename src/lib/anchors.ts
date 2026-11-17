// Anchors of verses in the reader. Links copied from earlier versions used the
// Indonesian prefix "ayat-", so it is still understood and rewritten.

export const verseId = (verse: number) => `verse-${verse}`;

export const verseHref = (surah: number, verse: number) => `/surah/${surah}#${verseId(verse)}`;

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

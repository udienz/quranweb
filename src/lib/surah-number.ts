/** The surah number in a `/surah/<number>` address, or null when it is not one of the 114 (the page and proxy.ts agree). */
export function surahFromSegment(segment: string): number | null {
  // Digits only: Number() alone would also take "1e2" (100) and "0x10" (16).
  if (!/^\d{1,4}$/.test(segment)) return null;
  const n = Number(segment);
  return n >= 1 && n <= 114 ? n : null;
}

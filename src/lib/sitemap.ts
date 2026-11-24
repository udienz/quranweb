// The addresses of the sitemap. One address per page: `?page=N` is not listed, and a surah's canonical address is
// `/surah/N`, so the 10-verse pages do not compete with each other.

export interface SitemapEntry {
  url: string;
  priority: number;
}

/** The page of every verse, `/surah/2/255`: the surah numbers with their verse counts (the sitemap needs no text). */
export function verseEntries(origin: string, counts: readonly { number: number; verseCount: number }[]): SitemapEntry[] {
  return counts.flatMap(({ number, verseCount }) =>
    Array.from({ length: verseCount }, (_, i) => ({ url: `${origin}/surah/${number}/${i + 1}`, priority: 0.5 })),
  );
}

/** The 604 pages of the printed mushaf, `/mushaf/50`. */
export function mushafEntries(origin: string, pages = 604): SitemapEntry[] {
  return Array.from({ length: pages }, (_, i) => ({ url: `${origin}/mushaf/${i + 1}`, priority: 0.5 }));
}

/** The home page, About, Privacy, Terms and every surah, as full addresses under `origin`. */
export function sitemapEntries(origin: string, surahNumbers: readonly number[]): SitemapEntry[] {
  const entry = (path: string, priority: number) => ({ url: `${origin}${path}`, priority });
  return [
    entry("/", 1),
    ...surahNumbers.map((n) => entry(`/surah/${n}`, 0.9)),
    entry("/about", 0.3),
    entry("/privacy", 0.2),
    entry("/terms", 0.2),
  ];
}

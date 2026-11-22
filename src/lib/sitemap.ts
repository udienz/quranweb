// The addresses of the sitemap. One address per page: `?page=N` is not listed, and a surah's canonical address is
// `/surah/N`, so the 10-verse pages do not compete with each other.

export interface SitemapEntry {
  url: string;
  priority: number;
}

/** The home page, About, Privacy and every surah, as full addresses under `origin`. */
export function sitemapEntries(origin: string, surahNumbers: readonly number[]): SitemapEntry[] {
  const entry = (path: string, priority: number) => ({ url: `${origin}${path}`, priority });
  return [
    entry("/", 1),
    ...surahNumbers.map((n) => entry(`/surah/${n}`, 0.9)),
    entry("/about", 0.3),
    entry("/privacy", 0.2),
  ];
}

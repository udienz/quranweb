// Paging of the verses of a surah. The page is in the URL (`?page=3`), so a page can be
// linked, reloaded and shared; verse links add the page that contains the verse.

/** Verses per page. A surah of at most this many verses is a single page. */
export const PAGE_SIZE = 10;

/** How many pages a surah has (at least one). */
export const pageCount = (total: number, size = PAGE_SIZE): number => Math.max(1, Math.ceil(total / size));

/** The page that contains a verse (verses are numbered from 1). */
export const pageOf = (verse: number, size = PAGE_SIZE): number => Math.max(1, Math.ceil(verse / size));

/** The first and last verse of a page, the last one limited by the number of verses. */
export function pageRange(page: number, total: number, size = PAGE_SIZE): { from: number; to: number } {
  return { from: (page - 1) * size + 1, to: Math.min(total, page * size) };
}

/** The page asked for in the URL, made valid: anything unusable is page 1, too far is the last page. */
export function clampPage(raw: string | string[] | undefined, total: number, size = PAGE_SIZE): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!value || !Number.isInteger(n) || n < 1) return 1;
  return Math.min(n, pageCount(total, size));
}

export type PageItem = number | "gap";

/**
 * The page numbers to show: the first and the last page, the current one with its
 * neighbours, and a "gap" where pages are left out. A gap that would hide a single page
 * shows that page instead. Few pages are all shown.
 */
export function pageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const shown = new Set<number>([1, total, current - 1, current, current + 1]);
  // Near an end, keep the row the same width by showing a few more pages there.
  if (current <= 3) [2, 3, 4].forEach((p) => shown.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => shown.add(p));

  const pages = [...shown].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items: PageItem[] = [];
  pages.forEach((page, i) => {
    const previous = pages[i - 1];
    if (previous !== undefined) {
      if (page - previous === 2) items.push(previous + 1);
      else if (page - previous > 2) items.push("gap");
    }
    items.push(page);
  });
  return items;
}

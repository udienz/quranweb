// How a surah is cut into pages: "verses" (our pages of 10 verses, the default) or "mushaf" (the 604 pages of the printed
// Madinah mushaf). Kept in a cookie so the server knows where to send a reader who opens a surah, and recorded in the user data
// as a choice so it follows a signed-in reader. Not to be confused with the layout (mushaf block or verse cards).

export const PAGING_COOKIE = "qw-paging";
export const PAGINGS = ["verses", "mushaf"] as const;
export type Paging = (typeof PAGINGS)[number];
export const DEFAULT_PAGING: Paging = "verses";

export const isPaging = (value: unknown): value is Paging => typeof value === "string" && (PAGINGS as readonly string[]).includes(value);

export const parsePaging = (value: string | undefined): Paging => (isPaging(value) ? value : DEFAULT_PAGING);

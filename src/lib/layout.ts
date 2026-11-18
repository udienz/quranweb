// How a surah is shown in the Reading tab: "mushaf" (the Arabic text of a page as one block, with the translation in
// a column beside it, like a printed mushaf) or "cards" (one card per verse). Kept in a cookie so the server renders
// the right one; mushaf is the default.

export const LAYOUT_COOKIE = "qw-layout";
export const LAYOUTS = ["mushaf", "cards"] as const;
export type Layout = (typeof LAYOUTS)[number];
export const DEFAULT_LAYOUT: Layout = "mushaf";

export const isLayout = (value: unknown): value is Layout => typeof value === "string" && (LAYOUTS as readonly string[]).includes(value);

/** Cookie that remembers a collapsed side panel on the surah page (wide screens), so the server renders it that way. */
export const SIDEBAR_COOKIE = "qw-sidebar";

export const parseLayout = (value: string | undefined): Layout => (isLayout(value) ? value : DEFAULT_LAYOUT);

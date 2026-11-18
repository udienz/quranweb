// The reader's choice of editions and reciter. It is kept in a cookie so that the
// server can read it when rendering a page. It only holds edition IDs; the server still
// validates them against the catalog, so a broken or tampered value is ignored.

import type { Selection } from "./quran/types";

export const SELECTION_COOKIE = "qw-sel";

const ID = /^[a-z0-9][a-z0-9-]{0,59}$/;
const isId = (v: unknown): v is string => typeof v === "string" && ID.test(v);

export function parseSelectionCookie(raw: string | undefined): Partial<Selection> {
  if (!raw) return {};
  let value: unknown;
  try {
    value = JSON.parse(decodeURIComponent(raw));
  } catch {
    return {};
  }
  return parseSelectionObject(value);
}

/** The valid fields of a selection object (from the cookie or from synced account data), in a fixed key order. */
export function parseSelectionObject(value: unknown): Partial<Selection> {
  if (typeof value !== "object" || value === null) return {};
  const v = value as Record<string, unknown>;

  const out: Partial<Selection> = {};
  if (isId(v.arabic)) out.arabic = v.arabic;
  if (v.transliteration === null || isId(v.transliteration)) out.transliteration = v.transliteration as string | null;
  if (v.tafsir === null || isId(v.tafsir)) out.tafsir = v.tafsir as string | null;
  if (isId(v.qari)) out.qari = v.qari;
  if (Array.isArray(v.translations) && v.translations.length <= 8 && v.translations.every(isId)) {
    out.translations = [...new Set(v.translations as string[])];
  }
  return out;
}

export function serializeSelection(selection: Partial<Selection>): string {
  return encodeURIComponent(JSON.stringify(selection));
}

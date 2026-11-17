// Pilihan edisi dan qari milik pengguna. Disimpan di cookie supaya server bisa
// membaca saat merender halaman. Isinya hanya ID edisi; server tetap
// memvalidasinya terhadap katalog, jadi nilai yang rusak atau diubah diabaikan.

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

import type { Edition, EditionText, Qari, SurahMeta } from "./types";

/**
 * Sumber teks. Satu provider melayani satu atau lebih edisi dan memetakan
 * respons sumbernya ke skema internal (lihat types.ts).
 */
export interface TextProvider {
  /** ID unik provider, dipakai di pesan galat dan log. */
  id: string;
  /** Edisi yang dilayani provider ini. */
  editions(): Edition[];
  /** Metadata 114 surat. Opsional: provider khusus teks boleh tidak menyediakannya. */
  surahs?(): Promise<SurahMeta[]>;
  /** Isi satu edisi untuk satu surat. Melempar galat kalau gagal. */
  text(edition: string, surah: number): Promise<EditionText>;
}

/** Sumber audio murottal, terpisah dari teks. */
export interface AudioProvider {
  id: string;
  qaris(): Qari[];
  /** URL audio satu ayat untuk qari tertentu, yang utama lebih dulu. */
  urls(qari: string, surah: number, ayat: number): string[];
}

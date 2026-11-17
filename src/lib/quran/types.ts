// Skema internal berbasis edisi. Semua sumber data (EQuran.id, mirror sendiri,
// fawazahmed0/quran-api, dst.) dipetakan ke bentuk ini lewat provider, jadi UI
// tidak bergantung pada format API mana pun.
//
// Satu EDISI = satu terjemahan, satu tafsir, satu teks Arab, atau satu
// transliterasi. ID edisi stabil dan tidak bergantung pada provider (nanti
// dipakai untuk pilihan pengguna), mengikuti penamaan fawazahmed0/quran-api:
// `{bahasa-iso3}-{nama}`, akhiran `-la` untuk transliterasi Latin.

export type EditionKind = "arabic" | "transliteration" | "translation" | "tafsir";

/** Dari mana sebuah konten berasal dan apa yang wajib dicantumkan. */
export interface SourceInfo {
  name: string;
  url?: string;
  /** Lisensi atau syarat penggunaan, kalau diketahui. */
  license?: string;
  /** Teks atribusi tanpa label, mis. "Kementerian Agama RI, melalui EQuran.id". UI yang menambahkan labelnya. */
  attribution: string;
}

export interface Edition {
  id: string;
  kind: EditionKind;
  /** Kode bahasa ISO 639-1, mis. "ar", "id", "en". */
  language: string;
  direction: "ltr" | "rtl";
  /** Nama untuk ditampilkan, mis. "Terjemahan Kemenag RI". */
  name: string;
  author?: string;
  source: SourceInfo;
}

export interface Qari {
  id: string;
  name: string;
  source: SourceInfo;
}

/** Metadata surat, tidak bergantung pada edisi. */
export interface SurahMeta {
  number: number;
  ayatCount: number;
  name: {
    arabic: string;
    latin: string;
    /** Arti nama per bahasa, mis. { id: "Pembukaan" }. */
    meaning: Record<string, string>;
  };
  revelation: "mecca" | "medina";
  /** Deskripsi singkat (teks biasa) per bahasa. */
  description: Record<string, string>;
}

export interface VerseText {
  /** Nomor ayat dalam surat, mulai dari 1. */
  number: number;
  text: string;
}

/** Isi satu edisi untuk satu surat. */
export interface EditionText {
  edition: string;
  surah: number;
  verses: VerseText[];
}

/** Pilihan edisi dan qari untuk satu tampilan. */
export interface Selection {
  arabic: string;
  transliteration: string | null;
  translations: string[];
  tafsir: string | null;
  qari: string;
}

export interface VerseView {
  number: number;
  arabic: string;
  transliteration: string | null;
  translations: { edition: string; text: string }[];
  tafsir: string | null;
  /** URL audio berurutan menurut prioritas; yang pertama dicoba dulu. */
  audio: string[];
}

export interface SurahView {
  meta: SurahMeta;
  selection: Selection;
  /** Edisi dan qari yang dipakai, untuk atribusi di UI. */
  editions: Edition[];
  qari: Qari;
  verses: VerseView[];
}

export interface Catalog {
  editions: Edition[];
  qaris: Qari[];
}

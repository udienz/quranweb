// API client untuk eQuran.id API v2 (https://equran.id/apidev/v2 untuk dokumentasi).
// Respons API dipetakan ke bentuk data di bawah supaya komponen UI tidak
// bergantung pada format API tertentu.

const DEFAULT_API_URL = "https://equran.id/api/v2";

// Qari audio ayat dari eQuran: "05" = Misyari Rasyid Al-Afasi (utama), sisanya cadangan.
const PRIMARY_QARI = "05";

// Server-only (sengaja tanpa prefix NEXT_PUBLIC_): dibaca saat request,
// bukan di-inline saat build, jadi bisa diganti lewat `docker run -e` /
// env var platform tanpa perlu rebuild image.
export function getApiBaseUrl(): string {
  return process.env.QURAN_API_URL?.replace(/\/$/, "") || DEFAULT_API_URL;
}

export interface SurahName {
  short: string;
  long: string;
  transliteration: { en: string; id: string };
  translation: { en: string; id: string };
}

export interface SurahRevelation {
  arab: string;
  en: string;
  id: string;
}

export interface SurahSummary {
  number: number;
  sequence: number;
  numberOfVerses: number;
  name: SurahName;
  revelation: SurahRevelation;
  tafsir: { id: string };
}

export interface VerseAudio {
  primary: string;
  secondary: string[];
}

export interface VerseTafsir {
  id: { short: string; long: string };
}

export interface Verse {
  number: { inSurah: number };
  text: { arab: string; transliteration: { en: string } };
  translation: { en: string; id: string };
  audio: VerseAudio;
  tafsir: VerseTafsir;
}

export interface SurahDetail extends SurahSummary {
  preBismillah: Verse | null;
  verses: Verse[];
}

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

interface RawSurahSummary {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
}

interface RawAyat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

interface RawSurahDetail extends RawSurahSummary {
  ayat: RawAyat[];
}

interface RawTafsir {
  tafsir: { ayat: number; teks: string }[];
}

async function apiFetch<T>(path: string): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal memuat data dari ${url} (status ${res.status})`);
  }
  const json: ApiEnvelope<T> = await res.json();
  return json.data;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toSummary(raw: RawSurahSummary): SurahSummary {
  return {
    number: raw.nomor,
    sequence: raw.nomor,
    numberOfVerses: raw.jumlahAyat,
    name: {
      short: raw.nama,
      long: raw.nama,
      transliteration: { en: raw.namaLatin, id: raw.namaLatin },
      translation: { en: raw.arti, id: raw.arti },
    },
    revelation: { arab: raw.tempatTurun, en: raw.tempatTurun, id: raw.tempatTurun },
    tafsir: { id: stripHtml(raw.deskripsi) },
  };
}

// Catatan: sengaja TIDAK "use cache" di sini. Dengan Cache Components,
// fungsi "use cache" dicoba di-prerender saat build — tapi URL API baru
// diketahui saat runtime (env var QURAN_API_URL beda per deployment), dan
// build image (Docker/CI) tidak selalu punya akses jaringan ke API itu.
// Jadi data diambil di request-time (lihat `instant = false` di tiap page).
export async function getAllSurah(): Promise<SurahSummary[]> {
  const list = await apiFetch<RawSurahSummary[]>("/surat");
  return list.map(toSummary);
}

export async function getSurah(number: number): Promise<SurahDetail> {
  const [raw, tafsir] = await Promise.all([
    apiFetch<RawSurahDetail>(`/surat/${number}`),
    apiFetch<RawTafsir>(`/tafsir/${number}`),
  ]);
  const tafsirByAyat = new Map(tafsir.tafsir.map((t) => [t.ayat, t.teks]));

  const verses: Verse[] = raw.ayat.map((a) => {
    const { [PRIMARY_QARI]: primary, ...others } = a.audio;
    return {
      number: { inSurah: a.nomorAyat },
      text: { arab: a.teksArab.trim(), transliteration: { en: a.teksLatin } },
      translation: { en: "", id: a.teksIndonesia },
      audio: { primary, secondary: Object.values(others) },
      tafsir: { id: { short: tafsirByAyat.get(a.nomorAyat) ?? "", long: "" } },
    };
  });

  return { ...toSummary(raw), preBismillah: null, verses };
}

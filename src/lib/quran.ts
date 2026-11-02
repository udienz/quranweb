// API client untuk Quran API (self-hosted, fork dari gadingnst/quran-api).
// Lihat README bagian "Sumber Data" untuk cara deploy instance sendiri.
// Default di bawah mengarah ke live instance resmi (ada rate limit),
// hanya dipakai saat QURAN_API_URL belum diset.

const DEFAULT_API_URL = "https://api.quran.gading.dev";

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
  number: { inQuran: number; inSurah: number };
  meta: {
    juz: number;
    page: number;
    manzil: number;
    ruku: number;
    hizbQuarter: number;
    sajda: { recommended: boolean; obligatory: boolean };
  };
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
  status: string;
  message: string;
  data: T;
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

// Catatan: sengaja TIDAK "use cache" di sini. Dengan Cache Components,
// fungsi "use cache" dicoba di-prerender saat build — tapi URL API baru
// diketahui saat runtime (env var QURAN_API_URL beda per deployment), dan
// build image (Docker/CI) tidak selalu punya akses jaringan ke API itu.
// Jadi data diambil di request-time (lihat `instant = false` di tiap page),
// dan caching 1 hari dilakukan lewat header HTTP cache API-nya sendiri.
export async function getAllSurah(): Promise<SurahSummary[]> {
  return apiFetch<SurahSummary[]>("/surah");
}

export async function getSurah(number: number): Promise<SurahDetail> {
  return apiFetch<SurahDetail>(`/surah/${number}`);
}

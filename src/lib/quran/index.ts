// API publik untuk halaman dan komponen. Konfigurasi dibaca dari environment
// saat dipanggil (bukan saat build), jadi bisa diganti lewat env var platform
// atau `docker run -e` tanpa rebuild.
//
//   QURAN_API_URL    base URL API berformat EQuran.id v2 (default https://equran.id/api/v2)
//   QURAN_AUDIO_URL  base URL audio (default https://cdn.equran.id)
//   QURAN_FAWAZ_URL  base URL fawazahmed0/quran-api (default jsDelivr; arahkan ke mirror sendiri)
//
// Sengaja TANPA "use cache": data diambil saat request (lihat `instant = false`
// di tiap page), jadi build tidak butuh jaringan ke sumber data.

import { createEquranAudioProvider, createEquranTextProvider } from "./providers/equran";
import { createFawazTextProvider } from "./providers/fawazahmed0";
import { createQuranService, type QuranConfig, type QuranService } from "./service";

export type * from "./types";
export type { AudioProvider, TextProvider } from "./provider";
export { createQuranService } from "./service";
export type { QuranConfig, QuranService } from "./service";

export function defaultConfig(env: Record<string, string | undefined> = process.env): QuranConfig {
  const options = { baseUrl: env.QURAN_API_URL, audioBaseUrl: env.QURAN_AUDIO_URL };
  return {
    // Urutan = prioritas. fawazahmed0 hanya menambah edisi ke katalog; pilihan
    // bawaan di bawah tetap dari EQuran.id.
    textProviders: [createEquranTextProvider(options), createFawazTextProvider({ baseUrl: env.QURAN_FAWAZ_URL })],
    audioProviders: [createEquranAudioProvider(options)],
    defaults: {
      arabic: "ara-equran",
      transliteration: "ara-equran-la",
      translations: ["ind-kemenag"],
      tafsir: "ind-kemenag-tafsir",
      qari: "misyari-rasyid-al-afasi",
    },
  };
}

export function getQuran(): QuranService {
  return createQuranService(defaultConfig());
}

export const getAllSurah = () => getQuran().getSurahList();
export const getSurahView = (...args: Parameters<QuranService["getSurahView"]>) =>
  getQuran().getSurahView(...args);

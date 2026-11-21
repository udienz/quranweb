// Audio from the open CDN of AlQuran.cloud (Islamic Network, https://alquran.cloud/cdn): one file per verse at
// `{base}/quran/audio/{bitrate}/{edition}/{global verse number}.mp3`. Chosen by the owner on 2026-11-19 instead of hosting
// audio ourselves.
//
// Only reciters with every verse are listed. The CDN's own file list (`/quran/info/by-ayah/info.json`) was read on
// 2026-11-19: of 176 Arabic audio editions, 26 have all 6,236 verses; 7 of those are the same files under a "-2" name, and the
// rest (148) are whole-surah recordings only, which this player (verse by verse) cannot use. Each bitrate listed below has every
// verse and answered for the first, the last and three random verses. The two reciters that EQuran.id has too (Alafasy and
// As-Sudais) keep EQuran's ID, so this CDN is their fallback. Re-check before adding one.

import type { AudioProvider } from "../provider";
import { ayahNumber } from "../ayah-number";
import type { Qari, SourceInfo } from "../types";

export const ISLAMIC_NETWORK_CDN = "https://cdn.islamic.network";

interface Reciter {
  /** Our ID (stable: it is stored in readers' choices). */
  id: string;
  /** The edition at the CDN. */
  edition: string;
  /** Bitrates (kbps) that have every verse, preferred first; the next one is the fallback. */
  bitrates: string[];
  name: string;
  arabicName: string;
}

export const ISLAMIC_NETWORK_RECITERS: Reciter[] = [
  { id: "misyari-rasyid-al-afasi", edition: "ar.alafasy", bitrates: ["128", "64"], name: "Misyari Rasyid Al-Afasi", arabicName: "مشاري راشد العفاسي" },
  { id: "abdurrahman-as-sudais", edition: "ar.abdurrahmaansudais", bitrates: ["64", "192"], name: "Abdurrahman As-Sudais", arabicName: "عبد الرحمن السديس" },
  { id: "abdul-basit-abdus-samad", edition: "ar.abdulbasitmurattal", bitrates: ["64", "192"], name: "Abdul Basit Abdus Samad", arabicName: "عبد الباسط عبد الصمد" },
  { id: "abdul-basit-abdus-samad-2", edition: "ar.abdulsamad", bitrates: ["64"], name: "Abdul Basit Abdus Samad (2)", arabicName: "عبد الباسط عبد الصمد (٢)" },
  { id: "mahmoud-khalil-al-husary", edition: "ar.husary", bitrates: ["64"], name: "Mahmoud Khalil Al-Husary", arabicName: "محمود خليل الحصري" },
  { id: "mahmoud-khalil-al-husary-mujawwad", edition: "ar.husarymujawwad", bitrates: ["128", "64"], name: "Mahmoud Khalil Al-Husary (Mujawwad)", arabicName: "محمود خليل الحصري (المجود)" },
  { id: "muhammad-siddiq-al-minshawi-mujawwad", edition: "ar.minshawimujawwad", bitrates: ["64"], name: "Muhammad Siddiq Al-Minshawi (Mujawwad)", arabicName: "محمد صديق المنشاوي (المجود)" },
  { id: "maher-al-muaiqly", edition: "ar.mahermuaiqly", bitrates: ["128"], name: "Maher Al-Muaiqly", arabicName: "ماهر المعيقلي" },
  { id: "saud-ash-shuraim", edition: "ar.saoodshuraym", bitrates: ["64"], name: "Saud Ash-Shuraim", arabicName: "سعود الشريم" },
  { id: "abu-bakr-ash-shatri", edition: "ar.shaatree", bitrates: ["128", "64"], name: "Abu Bakr Ash-Shatri", arabicName: "أبو بكر الشاطري" },
  { id: "ahmed-al-ajamy", edition: "ar.ahmedajamy", bitrates: ["128", "64"], name: "Ahmed Al-Ajamy", arabicName: "أحمد بن علي العجمي" },
  { id: "ali-al-hudhaify", edition: "ar.hudhaify", bitrates: ["128", "64", "32"], name: "Ali Al-Hudhaify", arabicName: "علي بن عبد الرحمن الحذيفي" },
  { id: "muhammad-ayyub", edition: "ar.muhammadayyoub", bitrates: ["128"], name: "Muhammad Ayyub", arabicName: "محمد أيوب" },
  { id: "muhammad-jibreel", edition: "ar.muhammadjibreel", bitrates: ["128"], name: "Muhammad Jibreel", arabicName: "محمد جبريل" },
  { id: "hani-ar-rifai", edition: "ar.hanirifai", bitrates: ["64", "192"], name: "Hani Ar-Rifai", arabicName: "هاني الرفاعي" },
  { id: "abdullah-basfar", edition: "ar.abdullahbasfar", bitrates: ["64", "32"], name: "Abdullah Basfar", arabicName: "عبد الله بصفر" },
  { id: "ayman-suwayd", edition: "ar.aymanswoaid", bitrates: ["64"], name: "Ayman Suwayd", arabicName: "أيمن سويد" },
  { id: "ibrahim-al-akhdar", edition: "ar.ibrahimakhbar", bitrates: ["32"], name: "Ibrahim Al-Akhdar", arabicName: "إبراهيم الأخضر" },
  { id: "shahriar-parhizgar", edition: "ar.parhizgar", bitrates: ["48"], name: "Shahriar Parhizgar", arabicName: "شهريار پرهيزگار" },
];

const SOURCE: SourceInfo = {
  name: "AlQuran.cloud",
  url: "https://alquran.cloud/cdn",
  attribution: {
    en: "EveryAyah recordings, via the AlQuran.cloud CDN (Islamic Network)",
    id: "Rekaman EveryAyah, melalui CDN AlQuran.cloud (Islamic Network)",
    tr: "EveryAyah kayıtları, AlQuran.cloud CDN üzerinden (Islamic Network)",
    ms: "Rakaman EveryAyah, melalui CDN AlQuran.cloud (Islamic Network)",
    bn: "EveryAyah-এর রেকর্ডিং, AlQuran.cloud CDN-এর মাধ্যমে (Islamic Network)",
    fr: "Enregistrements EveryAyah, via le CDN d'AlQuran.cloud (Islamic Network)",
    ru: "Записи EveryAyah, через CDN AlQuran.cloud (Islamic Network)",
  },
};

export function createIslamicNetworkAudioProvider(options: { baseUrl?: string } = {}): AudioProvider {
  const base = (options.baseUrl ?? ISLAMIC_NETWORK_CDN).replace(/\/$/, "");
  const byId = new Map(ISLAMIC_NETWORK_RECITERS.map((r) => [r.id, r]));
  return {
    id: "islamic-network",
    qaris: (): Qari[] => ISLAMIC_NETWORK_RECITERS.map((r) => ({ id: r.id, name: r.name, arabicName: r.arabicName, source: SOURCE })),
    urls(qari, surah, verse) {
      const reciter = byId.get(qari);
      if (!reciter) return [];
      const n = ayahNumber(surah, verse);
      return reciter.bitrates.map((bitrate) => `${base}/quran/audio/${bitrate}/${reciter.edition}/${n}.mp3`);
    },
    kbps(url) {
      if (!url.startsWith(`${base}/quran/audio/`)) return undefined;
      const bitrate = Number(url.slice(base.length).split("/")[3]);
      return Number.isFinite(bitrate) && bitrate > 0 ? bitrate : undefined;
    },
  };
}

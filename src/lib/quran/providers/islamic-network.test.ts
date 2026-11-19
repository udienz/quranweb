import { describe, expect, it } from "vitest";
import { createIslamicNetworkAudioProvider, ISLAMIC_NETWORK_RECITERS } from "./islamic-network";

describe("AlQuran.cloud CDN audio", () => {
  it("builds one URL per bitrate from the ayah's number in the whole Qur'an", () => {
    const p = createIslamicNetworkAudioProvider();
    expect(p.urls("misyari-rasyid-al-afasi", 2, 255)).toEqual([
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3",
      "https://cdn.islamic.network/quran/audio/64/ar.alafasy/262.mp3",
    ]);
    expect(p.urls("maher-al-muaiqly", 114, 6)).toEqual(["https://cdn.islamic.network/quran/audio/128/ar.mahermuaiqly/6236.mp3"]);
  });

  it("uses another base URL and drops its trailing slash", () => {
    const p = createIslamicNetworkAudioProvider({ baseUrl: "https://cdn.test/" });
    expect(p.urls("ibrahim-al-akhdar", 1, 1)).toEqual(["https://cdn.test/quran/audio/32/ar.ibrahimakhbar/1.mp3"]);
  });

  it("knows the bitrate of its own URLs and of no one else's", () => {
    const p = createIslamicNetworkAudioProvider({ baseUrl: "https://cdn.test" });
    expect(p.kbps?.("https://cdn.test/quran/audio/64/ar.alafasy/1.mp3")).toBe(64);
    expect(p.kbps?.("https://cdn.test/quran/audio/192/ar.hanirifai/1.mp3")).toBe(192);
    expect(p.kbps?.("https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/001001.mp3")).toBeUndefined();
  });

  it("has no audio for a reciter it does not know", () => {
    expect(createIslamicNetworkAudioProvider().urls("nobody", 1, 1)).toEqual([]);
  });

  it("lists every reciter once, with Latin and Arabic names and the AlQuran.cloud credit", () => {
    const qaris = createIslamicNetworkAudioProvider().qaris();
    expect(qaris).toHaveLength(ISLAMIC_NETWORK_RECITERS.length);
    expect(new Set(qaris.map((q) => q.id)).size).toBe(qaris.length);
    for (const q of qaris) {
      expect(q.name).toBeTruthy();
      expect(q.arabicName).toBeTruthy();
      expect(q.source.name).toBe("AlQuran.cloud");
    }
  });
});

// Uji dengan jaringan sungguhan ke EQuran.id dan fawazahmed0 (jsDelivr). Dilewati
// secara bawaan supaya CI tidak bergantung pada pihak luar. Jalankan dengan:
//   npm run test:live
import { describe, expect, it } from "vitest";
import { defaultConfig } from "./index";
import { createFawazTextProvider, FAWAZ_EDITIONS } from "./providers/fawazahmed0";
import { createQuranService } from "./service";

describe.skipIf(!process.env.LIVE)("sumber nyata", () => {
  // LIVE_QURAN_API_URL dan LIVE_QURAN_FAWAZ_URL: arahkan ke mirror sendiri supaya sumber
  // luar (EQuran.id, jsDelivr) tidak dibebani.
  const fawazUrl = process.env.LIVE_QURAN_FAWAZ_URL;
  const svc = createQuranService(
    defaultConfig({ QURAN_API_URL: process.env.LIVE_QURAN_API_URL, QURAN_FAWAZ_URL: fawazUrl }),
  );
  const mixed = {
    arabic: "ara-quranuthmanihaf",
    translations: ["ind-kemenag", "ind-indonesianislam", "eng-abdullahyusufal", "eng-mohammedmarmadu"],
    tafsir: "ind-jalaladdinalmah",
  };

  it.each([1, 2, 36, 114])("surat %i: semua edisi dari kedua sumber cocok dengan metadata", async (n) => {
    const view = await svc.getSurahView(n, mixed);
    expect(view.verses).toHaveLength(view.meta.ayatCount);
    for (const v of view.verses) {
      expect(v.arabic).toBeTruthy();
      expect(v.translations).toHaveLength(4);
      expect(v.translations.every((t) => t.text.length > 0)).toBe(true);
      expect(v.tafsir).toBeTruthy();
    }
  }, 60_000);

  it("semua edisi fawazahmed0 yang diaktifkan konsisten untuk seluruh 114 surat", async () => {
    // Daftar surat diambil sekali; tiap edisi diuji langsung lewat providernya
    // (684 permintaan ke jsDelivr, berurutan per edisi).
    const list = await svc.getSurahList();
    const provider = createFawazTextProvider({ baseUrl: fawazUrl });
    let verses = 0;
    for (const e of FAWAZ_EDITIONS) {
      for (const s of list) {
        const text = await provider.text(e.id, s.number);
        expect(text.verses, `${e.id} surat ${s.number}`).toHaveLength(s.ayatCount);
        expect(text.verses.every((v, i) => v.number === i + 1 && v.text.length > 0)).toBe(true);
        verses += text.verses.length;
      }
    }
    expect(verses).toBe(FAWAZ_EDITIONS.length * 6236);
  }, 900_000);
});

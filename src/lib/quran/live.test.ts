// Tests against the real sources (EQuran.id and fawazahmed0). Skipped by default so
// that CI does not depend on third parties. Run them with:
//   npm run test:live
import { describe, expect, it } from "vitest";
import { defaultConfig } from "./index";
import { createFawazTextProvider, FAWAZ_EDITIONS } from "./providers/fawazahmed0";
import { createQuranService } from "./service";

describe.skipIf(!process.env.LIVE)("real sources", () => {
  // LIVE_QURAN_API_URL and LIVE_QURAN_FAWAZ_URL: point them to our own mirrors so that
  // the outside sources (EQuran.id, jsDelivr) are not loaded.
  const fawazUrl = process.env.LIVE_QURAN_FAWAZ_URL;
  const svc = createQuranService(
    defaultConfig({ QURAN_API_URL: process.env.LIVE_QURAN_API_URL, QURAN_FAWAZ_URL: fawazUrl }),
  );
  const mixed = {
    arabic: "ara-quranuthmanihaf",
    translations: ["ind-kemenag", "ind-indonesianislam", "eng-abdullahyusufal", "eng-mohammedmarmadu"],
    tafsir: "ind-jalaladdinalmah",
  };

  it.each([1, 2, 36, 114])("surah %i: every edition of both sources matches the metadata", async (n) => {
    const view = await svc.getSurahView(n, mixed);
    expect(view.verses).toHaveLength(view.meta.verseCount);
    for (const v of view.verses) {
      expect(v.arabic).toBeTruthy();
      expect(v.translations).toHaveLength(4);
      expect(v.translations.every((t) => t.text.length > 0)).toBe(true);
      expect(v.tafsir).toBeTruthy();
    }
  }, 60_000);

  it("English meanings are available for all 114 surah names", async () => {
    const list = await svc.getSurahList();
    expect(list).toHaveLength(114);
    expect(list.every((s) => s.name.meaning.en && s.name.meaning.id)).toBe(true);
  });

  it("every enabled fawazahmed0 edition is consistent across all 114 surahs", async () => {
    // The surah list is fetched once; each edition is tested directly through its
    // provider (684 requests, sequential per edition).
    const list = await svc.getSurahList();
    const provider = createFawazTextProvider({ baseUrl: fawazUrl });
    let verses = 0;
    for (const e of FAWAZ_EDITIONS) {
      for (const s of list) {
        const text = await provider.text(e.id, s.number);
        expect(text.verses, `${e.id} surah ${s.number}`).toHaveLength(s.verseCount);
        expect(text.verses.every((v, i) => v.number === i + 1 && v.text.length > 0)).toBe(true);
        verses += text.verses.length;
      }
    }
    expect(verses).toBe(FAWAZ_EDITIONS.length * 6236);
  }, 900_000);
});

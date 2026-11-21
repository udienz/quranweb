import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALES } from "../../i18n/config";
import { createQuranEncTextProvider, QURANENC_API_URL, QURANENC_EDITIONS, QURANENC_KEYS } from "./quranenc";

const BASE = "https://mirror.test/quranenc";
const sura = (n: number, rows: [string, string | null][]) => ({
  result: rows.map(([translation, footnotes], i) => ({ id: String(i + 1), sura: String(n), aya: String(i + 1), arabic_text: "…", translation, footnotes })),
});

function mockFetch(routes: Record<string, unknown>) {
  const fn = vi.fn(async (url: string | URL | Request) => {
    const data = routes[String(url)];
    return data === undefined ? new Response("", { status: 404 }) : new Response(JSON.stringify(data));
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}
afterEach(() => vi.unstubAllGlobals());

describe("QuranEnc provider", () => {
  it("passes the text on as published, with its footnote markers, and the footnotes with it", async () => {
    mockFetch({
      [`${BASE}/translation/sura/indonesian_affairs/5.json`]: sura(5, [
        [" Wahai orang-orang yang beriman! Penuhilah janji-janji! [252] Hewan ternak … ", "[252] Janji di sini adalah … "],
        ["Ayat dua", null],
        ["Ayat tiga", "   "],
      ]),
    });
    const text = await createQuranEncTextProvider({ baseUrl: `${BASE}/` }).text("ind-indonesianislam", 5);
    expect(text).toEqual({
      edition: "ind-indonesianislam",
      surah: 5,
      verses: [
        { number: 1, text: "Wahai orang-orang yang beriman! Penuhilah janji-janji! [252] Hewan ternak …", notes: "[252] Janji di sini adalah …" },
        { number: 2, text: "Ayat dua" },
        { number: 3, text: "Ayat tiga" },
      ],
    });
  });

  it("reads the copy's files first, and the live API's path (no extension) when there is no file", async () => {
    const fetchMock = mockFetch({ [`${QURANENC_API_URL}/translation/sura/english_mokhtasar/1`]: sura(1, [["In the name of Allah", null]]) });
    const text = await createQuranEncTextProvider().text("eng-mokhtasar", 1);
    expect(text.verses[0].text).toBe("In the name of Allah");
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual([
      `${QURANENC_API_URL}/translation/sura/english_mokhtasar/1.json`,
      `${QURANENC_API_URL}/translation/sura/english_mokhtasar/1`,
    ]);
  });

  it("refuses an edition it does not serve, one that is not enabled, and an answer for another sura", async () => {
    mockFetch({ [`${BASE}/translation/sura/turkish_mokhtasar/2.json`]: sura(3, [["x", null]]) });
    await expect(createQuranEncTextProvider({ baseUrl: BASE }).text("eng-abdullahyusufal", 1)).rejects.toThrow(/does not serve/);
    await expect(createQuranEncTextProvider({ baseUrl: BASE, editions: ["eng-mokhtasar"] }).text("tur-mokhtasar", 2)).rejects.toThrow(/does not serve/);
    await expect(createQuranEncTextProvider({ baseUrl: BASE }).text("tur-mokhtasar", 2)).rejects.toThrow(/unexpected format/);
    expect(() => createQuranEncTextProvider({ editions: ["nope"] })).toThrow(/Unknown QuranEnc edition/);
  });

  it("knows the key of every edition, and credits QuranEnc with a version or the date of the copy", () => {
    for (const e of QURANENC_EDITIONS) {
      expect(QURANENC_KEYS[e.id]).toBeTruthy();
      expect(e.source.url).toBe(`https://quranenc.com/en/browse/${QURANENC_KEYS[e.id]}`);
      // Every interface language gets a credit with QuranEnc.com and the version (or the date of the copy), and a name.
      for (const locale of LOCALES) {
        const text = e.source.attribution[locale];
        expect(text, `${e.id} ${locale}`).toMatch(/QuranEnc\.com/);
        expect(text, `${e.id} ${locale}`).toMatch(/1\.0\.1|1\.0\.3|2026-11-19|2026-11-21/);
        expect(e.name[locale], `${e.id} ${locale}`).toBeTruthy();
      }
    }
    expect(QURANENC_EDITIONS.map((e) => [e.id, e.kind, e.language])).toEqual([
      ["ind-indonesianislam", "translation", "id"],
      ["eng-mokhtasar", "tafsir", "en"],
      ["tur-mokhtasar", "tafsir", "tr"],
      ["ind-mokhtasar", "tafsir", "id"],
      ["fra-rashidmaash", "translation", "fr"],
      ["ben-mokhtasar", "tafsir", "bn"],
      ["fra-mokhtasar", "tafsir", "fr"],
      ["rus-mokhtasar", "tafsir", "ru"],
    ]);
  });
});

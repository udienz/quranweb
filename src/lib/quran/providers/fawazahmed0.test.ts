import { afterEach, describe, expect, it, vi } from "vitest";
import { createFawazTextProvider, FAWAZ_API_URL, FAWAZ_EDITIONS, FAWAZ_RAW_URL } from "./fawazahmed0";

const BASE = "https://mirror.test/quran-api";

const chapter = (surah: number, texts: string[]) => ({
  chapter: texts.map((text, i) => ({ chapter: surah, verse: i + 1, text })),
});

function mockFetch(routes: Record<string, unknown>) {
  const fn = vi.fn(async (url: string | URL | Request) => {
    const data = routes[String(url)];
    if (data === undefined) return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(data));
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("fawazahmed0 provider", () => {
  it("maps a surah and trims whitespace", async () => {
    const fetchMock = mockFetch({
      [`${BASE}/editions/ind-indonesianislam/1.min.json`]: chapter(1, [" Dengan nama Allah ", "Segala puji"]),
    });
    const p = createFawazTextProvider({ baseUrl: `${BASE}/` });
    const text = await p.text("ind-indonesianislam", 1);
    expect(text).toEqual({
      edition: "ind-indonesianislam",
      surah: 1,
      verses: [
        { number: 1, text: "Dengan nama Allah" },
        { number: 2, text: "Segala puji" },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to .json when .min.json fails (as the source's README advises)", async () => {
    const fetchMock = mockFetch({ [`${BASE}/editions/eng-abdullahyusufal/2.json`]: chapter(2, ["Alif Lam Mim"]) });
    const text = await createFawazTextProvider({ baseUrl: BASE }).text("eng-abdullahyusufal", 2);
    expect(text.verses[0].text).toBe("Alif Lam Mim");
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual([
      `${BASE}/editions/eng-abdullahyusufal/2.min.json`,
      `${BASE}/editions/eng-abdullahyusufal/2.json`,
    ]);
  });

  it("without a custom base URL: jsDelivr first, then raw GitHub when jsDelivr refuses", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      // Imitates jsDelivr's 403 "Package size exceeded the configured limit of 50 MB".
      if (u.startsWith(FAWAZ_API_URL)) return new Response("Package size exceeded", { status: 403 });
      return new Response(JSON.stringify(chapter(45, ["ok"])));
    });
    vi.stubGlobal("fetch", fetchMock);
    const text = await createFawazTextProvider().text("ind-indonesianislam", 45);
    expect(text.verses[0].text).toBe("ok");
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual([
      `${FAWAZ_API_URL}/editions/ind-indonesianislam/45.min.json`,
      `${FAWAZ_API_URL}/editions/ind-indonesianislam/45.json`,
      `${FAWAZ_RAW_URL}/editions/ind-indonesianislam/45.min.json`,
    ]);
  });

  it("never touches a public CDN when given a custom base URL", async () => {
    const fetchMock = mockFetch({});
    await expect(createFawazTextProvider({ baseUrl: BASE }).text("ara-quranuthmanihaf", 1)).rejects.toThrow();
    expect(fetchMock.mock.calls.every((c) => String(c[0]).startsWith(BASE))).toBe(true);
  });

  it("reports both URLs when both fail", async () => {
    mockFetch({});
    await expect(createFawazTextProvider({ baseUrl: BASE }).text("ara-quranuthmanihaf", 5)).rejects.toThrow(
      /ara-quranuthmanihaf\/5.*5\.min\.json.*status 404.*5\.json.*status 404/,
    );
  });

  it("rejects an edition that is not enabled and a response for the wrong surah", async () => {
    mockFetch({ [`${BASE}/editions/ind-jalaladdinalmah/3.min.json`]: chapter(4, ["x"]) });
    const p = createFawazTextProvider({ baseUrl: BASE });
    await expect(p.text("ben-other", 1)).rejects.toThrow(/does not serve edition "ben-other"/);
    await expect(p.text("ind-jalaladdinalmah", 3)).rejects.toThrow(/unexpected format/);
  });

  it("gets English surah meanings from info.json", async () => {
    mockFetch({
      [`${BASE}/info.min.json`]: {
        chapters: [
          { chapter: 1, englishname: "The Opening" },
          { chapter: 2, englishname: "The Cow" },
        ],
      },
    });
    expect(await createFawazTextProvider({ baseUrl: BASE }).surahMeanings!()).toEqual({
      1: { en: "The Opening" },
      2: { en: "The Cow" },
    });
  });

  it("catalog: unique IDs, correct kinds, credits in both languages", () => {
    const ids = FAWAZ_EDITIONS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(FAWAZ_EDITIONS.find((e) => e.id === "ara-quranuthmanihaf")).toMatchObject({ kind: "arabic", direction: "rtl" });
    expect(FAWAZ_EDITIONS.find((e) => e.id === "ind-jalaladdinalmah")?.kind).toBe("tafsir");
    expect(FAWAZ_EDITIONS.find((e) => e.id === "ind-muhammadquraish")?.kind).toBe("tafsir");
    expect(FAWAZ_EDITIONS.find((e) => e.id === "tur-diyanetisleri")).toMatchObject({ kind: "translation", language: "tr", direction: "ltr" });
    for (const e of FAWAZ_EDITIONS) {
      expect(e.source.attribution.en).toMatch(/fawazahmed0\/quran-api/);
      expect(e.source.attribution.id).toMatch(/fawazahmed0\/quran-api/);
      expect(e.name.en).toBeTruthy();
      expect(e.name.id).toBeTruthy();
      expect(e.source.url).toBeTruthy();
    }
  });

  it("every Tanzil edition links back to Tanzil's translations page (its terms ask for that when more than three are used)", () => {
    const tanzil = FAWAZ_EDITIONS.filter((e) => /Tanzil/.test(e.source.attribution.en));
    expect(tanzil.map((e) => e.id).sort()).toEqual(["eng-abdullahyusufal", "eng-mohammedmarmadu", "ind-jalaladdinalmah", "ind-muhammadquraish", "tur-diyanetisleri"]);
    for (const e of tanzil) expect(e.source.url).toBe("https://tanzil.net/trans/");
  });

  it("has no surah list (it comes from another provider)", () => {
    expect(createFawazTextProvider().surahs).toBeUndefined();
  });
});

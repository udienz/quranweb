import { afterEach, describe, expect, it, vi } from "vitest";
import { createFawazTextProvider, FAWAZ_API_URL, FAWAZ_EDITIONS, FAWAZ_RAW_URL } from "./fawazahmed0";

const BASE = "https://mirror.test/quran-api";

const chapter = (surah: number, texts: string[]) => ({
  chapter: texts.map((text, i) => ({ chapter: surah, verse: i + 1, text })),
});

function mockFetch(routes: Record<string, unknown>) {
  const fn = vi.fn(async (url: string | URL | Request) => {
    const data = routes[String(url)];
    if (data === undefined) return new Response("tidak ada", { status: 404 });
    return new Response(JSON.stringify(data));
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("provider fawazahmed0", () => {
  it("memetakan satu surat dan merapikan spasi", async () => {
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

  it("jatuh ke .json bila .min.json gagal (saran README sumbernya)", async () => {
    const fetchMock = mockFetch({ [`${BASE}/editions/eng-abdullahyusufal/2.json`]: chapter(2, ["Alif Lam Mim"]) });
    const text = await createFawazTextProvider({ baseUrl: BASE }).text("eng-abdullahyusufal", 2);
    expect(text.verses[0].text).toBe("Alif Lam Mim");
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual([
      `${BASE}/editions/eng-abdullahyusufal/2.min.json`,
      `${BASE}/editions/eng-abdullahyusufal/2.json`,
    ]);
  });

  it("tanpa base URL sendiri: jsDelivr dulu, lalu raw GitHub bila jsDelivr menolak", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      // Meniru 403 "Package size exceeded the configured limit of 50 MB" dari jsDelivr.
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

  it("dengan base URL sendiri tidak pernah menyentuh CDN publik", async () => {
    const fetchMock = mockFetch({});
    await expect(createFawazTextProvider({ baseUrl: BASE }).text("ara-quranuthmanihaf", 1)).rejects.toThrow();
    expect(fetchMock.mock.calls.every((c) => String(c[0]).startsWith(BASE))).toBe(true);
  });

  it("melaporkan kedua URL bila keduanya gagal", async () => {
    mockFetch({});
    await expect(createFawazTextProvider({ baseUrl: BASE }).text("ara-quranuthmanihaf", 5)).rejects.toThrow(
      /ara-quranuthmanihaf surat 5.*5\.min\.json: status 404.*5\.json: status 404/,
    );
  });

  it("menolak edisi yang tidak diaktifkan dan respons surat yang salah", async () => {
    mockFetch({ [`${BASE}/editions/ind-jalaladdinalmah/3.min.json`]: chapter(4, ["x"]) });
    const p = createFawazTextProvider({ baseUrl: BASE });
    await expect(p.text("ben-lain", 1)).rejects.toThrow(/tidak melayani edisi "ben-lain"/);
    await expect(p.text("ind-jalaladdinalmah", 3)).rejects.toThrow(/tidak sesuai format/);
  });

  it("katalog: ID unik, tipe benar, atribusi dan sumber terisi", () => {
    const ids = FAWAZ_EDITIONS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(FAWAZ_EDITIONS.find((e) => e.id === "ara-quranuthmanihaf")).toMatchObject({ kind: "arabic", direction: "rtl" });
    expect(FAWAZ_EDITIONS.find((e) => e.id === "ind-jalaladdinalmah")?.kind).toBe("tafsir");
    for (const e of FAWAZ_EDITIONS) {
      expect(e.source.attribution).toMatch(/fawazahmed0\/quran-api/);
      expect(e.source.url).toBeTruthy();
    }
  });

  it("tidak menyediakan metadata surat (daftar surat dari provider lain)", () => {
    expect(createFawazTextProvider().surahs).toBeUndefined();
  });
});

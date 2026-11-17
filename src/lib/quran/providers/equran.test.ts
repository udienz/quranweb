import { afterEach, describe, expect, it, vi } from "vitest";
import { createEquranAudioProvider, createEquranTextProvider, stripHtml, toSurahMeta } from "./equran";

const SURAH_1 = {
  nomor: 1,
  nama: "الفاتحة",
  namaLatin: "Al-Fatihah",
  jumlahAyat: 2,
  tempatTurun: "Mekah",
  arti: "Pembukaan",
  deskripsi: "Surat <i>Al Faatihah</i> (Pembukaan)<br> terdiri dari 7 ayat.",
  ayat: [
    { nomorAyat: 1, teksArab: " بِسْمِ ", teksLatin: "Bismillāh. ", teksIndonesia: "Dengan nama Allah." },
    { nomorAyat: 2, teksArab: "الْحَمْدُ", teksLatin: "Al-ḥamdu.", teksIndonesia: "Segala puji." },
  ],
};
const TAFSIR_1 = { tafsir: [{ ayat: 1, teks: " Tafsir satu " }, { ayat: 2, teks: "Tafsir dua" }] };

function mockFetch(routes: Record<string, unknown>, status = 200) {
  const fn = vi.fn(async (url: string | URL | Request) => {
    const key = String(url);
    const data = routes[key];
    if (data === undefined) return new Response("not found", { status: 404 });
    return new Response(JSON.stringify({ code: 200, message: "ok", data }), { status });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("metadata mapping", () => {
  it("normalizes a surah and strips HTML from the description", () => {
    expect(toSurahMeta(SURAH_1)).toEqual({
      number: 1,
      verseCount: 2,
      name: { arabic: "الفاتحة", latin: "Al-Fatihah", meaning: { id: "Pembukaan" } },
      revelation: "mecca",
      description: { id: "Surat Al Faatihah (Pembukaan) terdiri dari 7 ayat." },
    });
  });

  it("rejects an unknown place of revelation", () => {
    expect(() => toSurahMeta({ ...SURAH_1, tempatTurun: "Atlantis" })).toThrow(/Atlantis/);
  });

  it("stripHtml tidies whitespace", () => {
    expect(stripHtml("a<br/>b  <b>c</b>")).toBe("a b c");
  });
});

describe("EQuran text provider", () => {
  const base = "https://mirror.test/api/v2";

  it("maps the Arabic, Latin, translation and tafsir editions", async () => {
    const fetchMock = mockFetch({ [`${base}/surat/1`]: SURAH_1, [`${base}/tafsir/1`]: TAFSIR_1 });
    const p = createEquranTextProvider({ baseUrl: `${base}/` });

    expect((await p.text("ara-equran", 1)).verses).toEqual([
      { number: 1, text: "بِسْمِ" },
      { number: 2, text: "الْحَمْدُ" },
    ]);
    expect((await p.text("ara-equran-la", 1)).verses[0].text).toBe("Bismillāh.");
    expect((await p.text("ind-kemenag", 1)).verses[1].text).toBe("Segala puji.");
    expect((await p.text("ind-kemenag-tafsir", 1)).verses[0].text).toBe("Tafsir satu");
    expect(fetchMock).toHaveBeenCalledWith(`${base}/surat/1`);
  });

  it("fetches the surah list", async () => {
    mockFetch({ [`${base}/surat`]: [SURAH_1] });
    const list = await createEquranTextProvider({ baseUrl: base }).surahs!();
    expect(list.map((s) => s.name.latin)).toEqual(["Al-Fatihah"]);
  });

  it("throws for an edition it does not serve and for a failed response", async () => {
    mockFetch({ [`${base}/surat/1`]: SURAH_1 });
    const p = createEquranTextProvider({ baseUrl: base });
    await expect(p.text("eng-other", 1)).rejects.toThrow(/does not serve edition "eng-other"/);
    await expect(p.text("ind-kemenag", 2)).rejects.toThrow(/status 404/);
  });

  it("rejects a response that is not a valid envelope", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: 500, data: null }))));
    await expect(createEquranTextProvider({ baseUrl: base }).text("ara-equran", 1)).rejects.toThrow(/Invalid response/);
  });

  it("has a complete, well-formed edition catalog", () => {
    const editions = createEquranTextProvider().editions();
    expect(editions.map((e) => `${e.id}:${e.kind}`)).toEqual([
      "ara-equran:arabic",
      "ara-equran-la:transliteration",
      "ind-kemenag:translation",
      "ind-kemenag-tafsir:tafsir",
    ]);
    for (const e of editions) {
      expect(e.name.en).toBeTruthy();
      expect(e.name.id).toBeTruthy();
      expect(e.source.attribution.en).toBeTruthy();
      expect(e.source.attribution.id).toBeTruthy();
    }
  });
});

describe("EQuran audio provider", () => {
  it("builds the URL from the CDN pattern with three-digit numbers", () => {
    const p = createEquranAudioProvider({ audioBaseUrl: "https://audio.test/" });
    expect(p.urls("misyari-rasyid-al-afasi", 2, 255)).toEqual([
      "https://audio.test/audio-partial/Misyari-Rasyid-Al-Afasi/002255.mp3",
    ]);
    expect(p.urls("abdurrahman-as-sudais", 114, 6)[0]).toMatch(/Abdurrahman-as-Sudais\/114006\.mp3$/);
  });

  it("uses the default CDN and rejects an unknown reciter", () => {
    const p = createEquranAudioProvider();
    expect(p.urls("yasser-al-dosari", 1, 1)[0]).toBe("https://cdn.equran.id/audio-partial/Yasser-Al-Dosari/001001.mp3");
    expect(() => p.urls("missing", 1, 1)).toThrow(/does not serve reciter/);
    expect(p.qaris()).toHaveLength(6);
  });
});

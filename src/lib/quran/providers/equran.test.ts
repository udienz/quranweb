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
    if (data === undefined) return new Response("tidak ada", { status: 404 });
    return new Response(JSON.stringify({ code: 200, message: "ok", data }), { status });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("pemetaan metadata", () => {
  it("menormalkan surat dan membuang HTML dari deskripsi", () => {
    const meta = toSurahMeta(SURAH_1);
    expect(meta).toEqual({
      number: 1,
      ayatCount: 2,
      name: { arabic: "الفاتحة", latin: "Al-Fatihah", meaning: { id: "Pembukaan" } },
      revelation: "mecca",
      description: { id: "Surat Al Faatihah (Pembukaan) terdiri dari 7 ayat." },
    });
  });

  it("menolak tempat turun yang tidak dikenal", () => {
    expect(() => toSurahMeta({ ...SURAH_1, tempatTurun: "Atlantis" })).toThrow(/Atlantis/);
  });

  it("stripHtml merapikan spasi", () => {
    expect(stripHtml("a<br/>b  <b>c</b>")).toBe("a b c");
  });
});

describe("provider teks EQuran", () => {
  const base = "https://mirror.test/api/v2";

  it("memetakan edisi Arab, Latin, terjemahan, dan tafsir", async () => {
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

  it("mengambil daftar surat", async () => {
    mockFetch({ [`${base}/surat`]: [SURAH_1] });
    const list = await createEquranTextProvider({ baseUrl: base }).surahs!();
    expect(list.map((s) => s.name.latin)).toEqual(["Al-Fatihah"]);
  });

  it("melempar galat untuk edisi yang tidak dilayani dan respons gagal", async () => {
    mockFetch({ [`${base}/surat/1`]: SURAH_1 });
    const p = createEquranTextProvider({ baseUrl: base });
    await expect(p.text("eng-lain", 1)).rejects.toThrow(/tidak melayani edisi "eng-lain"/);
    await expect(p.text("ind-kemenag", 2)).rejects.toThrow(/status 404/);
  });

  it("menolak respons yang bukan envelope valid", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: 500, data: null }))));
    await expect(createEquranTextProvider({ baseUrl: base }).text("ara-equran", 1)).rejects.toThrow(/tidak valid/);
  });

  it("katalog edisi lengkap dan berformat benar", () => {
    const ids = createEquranTextProvider().editions().map((e) => `${e.id}:${e.kind}`);
    expect(ids).toEqual(["ara-equran:arabic", "ara-equran-la:transliteration", "ind-kemenag:translation", "ind-kemenag-tafsir:tafsir"]);
  });
});

describe("provider audio EQuran", () => {
  it("membentuk URL dari pola CDN dengan nomor tiga digit", () => {
    const p = createEquranAudioProvider({ audioBaseUrl: "https://audio.test/" });
    expect(p.urls("misyari-rasyid-al-afasi", 2, 255)).toEqual([
      "https://audio.test/audio-partial/Misyari-Rasyid-Al-Afasi/002255.mp3",
    ]);
    expect(p.urls("abdurrahman-as-sudais", 114, 6)[0]).toMatch(/Abdurrahman-as-Sudais\/114006\.mp3$/);
  });

  it("memakai CDN bawaan dan menolak qari yang tidak dikenal", () => {
    const p = createEquranAudioProvider();
    expect(p.urls("yasser-al-dosari", 1, 1)[0]).toBe("https://cdn.equran.id/audio-partial/Yasser-Al-Dosari/001001.mp3");
    expect(() => p.urls("tidak-ada", 1, 1)).toThrow(/tidak melayani qari/);
    expect(p.qaris()).toHaveLength(6);
  });
});

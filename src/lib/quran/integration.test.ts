// EQuran.id and fawazahmed0 together in one service, with fetch faked (no network).
// It shows that editions from two sources can be chosen together in one surah view.

import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultConfig } from "./index";
import { createQuranService } from "./service";

const EQ = "https://eq.test/api/v2";
const FZ = "https://fz.test/qa";

const envelope = (data: unknown) => ({ code: 200, message: "ok", data });
const fawaz = (surah: number, texts: string[]) => ({
  chapter: texts.map((text, i) => ({ chapter: surah, verse: i + 1, text })),
});

const SURAT_1 = {
  nomor: 1,
  nama: "الفاتحة",
  namaLatin: "Al-Fatihah",
  jumlahAyat: 2,
  tempatTurun: "Mekah",
  arti: "Pembukaan",
  deskripsi: "Surat <i>pembuka</i>",
  ayat: [
    { nomorAyat: 1, teksArab: "ar-eq-1", teksLatin: "la-eq-1", teksIndonesia: "id-eq-1" },
    { nomorAyat: 2, teksArab: "ar-eq-2", teksLatin: "la-eq-2", teksIndonesia: "id-eq-2" },
  ],
};

const ROUTES: Record<string, unknown> = {
  [`${EQ}/surat`]: envelope([SURAT_1]),
  [`${EQ}/surat/1`]: envelope(SURAT_1),
  [`${EQ}/tafsir/1`]: envelope({ tafsir: [{ ayat: 1, teks: "tafsir-eq-1" }, { ayat: 2, teks: "tafsir-eq-2" }] }),
  [`${FZ}/info.min.json`]: { chapters: [{ chapter: 1, englishname: "The Opening" }] },
  [`${FZ}/editions/ara-quranuthmanihaf/1.min.json`]: fawaz(1, ["ar-fz-1", "ar-fz-2"]),
  [`${FZ}/editions/eng-abdullahyusufal/1.min.json`]: fawaz(1, ["en-fz-1", "en-fz-2"]),
  [`${FZ}/editions/ind-jalaladdinalmah/1.min.json`]: fawaz(1, ["jalalayn-1", "jalalayn-2"]),
};

function service() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL | Request) => {
      const data = ROUTES[String(url)];
      return data === undefined ? new Response("not found", { status: 404 }) : new Response(JSON.stringify(data));
    }),
  );
  return createQuranService(defaultConfig({ QURAN_API_URL: EQ, QURAN_FAWAZ_URL: FZ, QURAN_AUDIO_URL: "https://audio.test" }));
}

afterEach(() => vi.unstubAllGlobals());

describe("EQuran.id + fawazahmed0 in one service", () => {
  it("lists editions from both sources and keeps the defaults from EQuran.id", async () => {
    const svc = service();
    const ids = svc.getCatalog().editions.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(["ind-kemenag", "ara-quranuthmanihaf", "eng-abdullahyusufal", "ind-jalaladdinalmah"]));

    const view = await svc.getSurahView(1);
    expect(view.selection.arabic).toBe("ara-equran");
    expect(view.verses[0]).toMatchObject({ arabic: "ar-eq-1", transliteration: "la-eq-1", tafsir: "tafsir-eq-1" });
    expect(view.verses[0].translations).toEqual([{ edition: "ind-kemenag", text: "id-eq-1" }]);
  });

  it("mixes editions of two sources: Arabic and English from fawazahmed0, Indonesian and tafsir from EQuran.id", async () => {
    const view = await service().getSurahView(1, {
      arabic: "ara-quranuthmanihaf",
      translations: ["ind-kemenag", "eng-abdullahyusufal"],
      tafsir: "ind-kemenag-tafsir",
    });
    expect(view.verses[1]).toEqual({
      number: 2,
      arabic: "ar-fz-2",
      transliteration: "la-eq-2",
      translations: [
        { edition: "ind-kemenag", text: "id-eq-2" },
        { edition: "eng-abdullahyusufal", text: "en-fz-2" },
      ],
      tafsir: "tafsir-eq-2",
      audio: ["https://audio.test/audio-partial/Misyari-Rasyid-Al-Afasi/001002.mp3"],
    });
    expect(new Set(view.editions.map((e) => e.source.name))).toEqual(new Set(["EQuran.id", "fawazahmed0/quran-api"]));
  });

  it("uses a tafsir edition from fawazahmed0", async () => {
    const view = await service().getSurahView(1, { tafsir: "ind-jalaladdinalmah" });
    expect(view.verses[0].tafsir).toBe("jalalayn-1");
  });

  it("adds the English meaning of the surah name from fawazahmed0's info.json", async () => {
    const [first] = await service().getSurahList();
    expect(first.name.meaning).toEqual({ id: "Pembukaan", en: "The Opening" });
  });

  it("reads an English translation by default with the English interface, and Indonesian otherwise", async () => {
    const svc = service();
    expect((await svc.getSurahView(1, {}, "en")).selection.translations).toEqual(["eng-abdullahyusufal"]);
    expect((await svc.getSurahView(1, {}, "id")).selection.translations).toEqual(["ind-kemenag"]);
  });

  it("a failing fawazahmed0 edition does not break the defaults", async () => {
    const svc = service();
    await expect(svc.getSurahView(1, { translations: ["eng-mohammedmarmadu"] })).rejects.toThrow(/eng-mohammedmarmadu/);
    await expect(svc.getSurahView(1)).resolves.toBeTruthy();
  });
});

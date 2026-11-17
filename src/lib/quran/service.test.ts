import { describe, expect, it } from "vitest";
import type { AudioProvider, TextProvider } from "./provider";
import { createQuranService, type QuranConfig } from "./service";
import type { Edition, Qari, SurahMeta } from "./types";

const source = { name: "Uji", attribution: "Sumber uji" };
const edition = (id: string, kind: Edition["kind"]): Edition => ({
  id,
  kind,
  language: kind === "arabic" ? "ar" : "id",
  direction: kind === "arabic" ? "rtl" : "ltr",
  name: id,
  source,
});

const META: SurahMeta = {
  number: 1,
  ayatCount: 2,
  name: { arabic: "الفاتحة", latin: "Al-Fatihah", meaning: { id: "Pembukaan" } },
  revelation: "mecca",
  description: { id: "Surat pembuka" },
};

/** Provider uji: teks = `${edisi}:${ayat}`, bisa diatur gagal atau salah jumlah ayat. */
function textProvider(
  id: string,
  editions: Edition[],
  opts: { fail?: boolean; verses?: number; surahs?: boolean } = {},
): TextProvider {
  return {
    id,
    editions: () => editions,
    ...(opts.surahs === false ? {} : { surahs: async () => [META] }),
    async text(editionId, surah) {
      if (opts.fail) throw new Error(`${id} mati`);
      const n = opts.verses ?? META.ayatCount;
      return {
        edition: editionId,
        surah,
        verses: Array.from({ length: n }, (_, i) => ({ number: i + 1, text: `${editionId}:${i + 1}` })),
      };
    },
  };
}

const QARI: Qari = { id: "qari-a", name: "Qari A", source };
const audioProvider = (id: string, base: string): AudioProvider => ({
  id,
  qaris: () => [QARI],
  urls: (_q, surah, ayat) => [`${base}/${surah}/${ayat}.mp3`],
});

const EDITIONS = [
  edition("ara-x", "arabic"),
  edition("ara-x-la", "transliteration"),
  edition("ind-x", "translation"),
  edition("ind-x-tafsir", "tafsir"),
];

function config(overrides: Partial<QuranConfig> = {}): QuranConfig {
  return {
    textProviders: [textProvider("p1", EDITIONS)],
    audioProviders: [audioProvider("a1", "https://a1")],
    defaults: {
      arabic: "ara-x",
      transliteration: "ara-x-la",
      translations: ["ind-x"],
      tafsir: "ind-x-tafsir",
      qari: "qari-a",
    },
    ...overrides,
  };
}

describe("konfigurasi", () => {
  it("menolak pilihan bawaan yang tidak ada di katalog", () => {
    const bad = config();
    bad.defaults = { ...bad.defaults, translations: ["tidak-ada"] };
    expect(() => createQuranService(bad)).toThrow(/tidak ada di katalog/);
  });

  it("menolak edisi dengan tipe yang salah", () => {
    const bad = config();
    bad.defaults = { ...bad.defaults, arabic: "ind-x" };
    expect(() => createQuranService(bad)).toThrow(/bertipe translation, bukan arabic/);
  });

  it("menolak qari yang tidak ada", () => {
    const bad = config();
    bad.defaults = { ...bad.defaults, qari: "qari-z" };
    expect(() => createQuranService(bad)).toThrow(/Qari "qari-z"/);
  });

  it("menolak edisi yang sama dengan tipe berbeda antar provider", () => {
    expect(() =>
      createQuranService(
        config({
          textProviders: [textProvider("p1", EDITIONS), textProvider("p2", [edition("ara-x", "tafsir")])],
        }),
      ),
    ).toThrow(/bertipe arabic di satu provider dan tafsir/);
  });

  it("menggabungkan edisi dari beberapa provider tanpa duplikat", () => {
    const svc = createQuranService(
      config({ textProviders: [textProvider("p1", EDITIONS), textProvider("p2", [EDITIONS[0], edition("eng-y", "translation")])] }),
    );
    expect(svc.getCatalog().editions.map((e) => e.id)).toEqual(["ara-x", "ara-x-la", "ind-x", "ind-x-tafsir", "eng-y"]);
    expect(svc.getCatalog().qaris).toEqual([QARI]);
  });
});

describe("getSurahView", () => {
  it("menyusun ayat dari edisi terpilih", async () => {
    const view = await createQuranService(config()).getSurahView(1);
    expect(view.meta.name.latin).toBe("Al-Fatihah");
    expect(view.verses).toHaveLength(2);
    expect(view.verses[1]).toEqual({
      number: 2,
      arabic: "ara-x:2",
      transliteration: "ara-x-la:2",
      translations: [{ edition: "ind-x", text: "ind-x:2" }],
      tafsir: "ind-x-tafsir:2",
      audio: ["https://a1/1/2.mp3"],
    });
    expect(view.editions.map((e) => e.id)).toEqual(["ara-x", "ara-x-la", "ind-x", "ind-x-tafsir"]);
    expect(view.qari.id).toBe("qari-a");
  });

  it("mendukung banyak terjemahan dan transliterasi/tafsir dimatikan", async () => {
    const svc = createQuranService(
      config({ textProviders: [textProvider("p1", [...EDITIONS, edition("eng-y", "translation")])] }),
    );
    const view = await svc.getSurahView(1, { translations: ["ind-x", "eng-y"], transliteration: null, tafsir: null });
    expect(view.verses[0].translations.map((t) => t.edition)).toEqual(["ind-x", "eng-y"]);
    expect(view.verses[0].transliteration).toBeNull();
    expect(view.verses[0].tafsir).toBeNull();
  });

  it("menolak pilihan yang tidak valid dan nomor surat di luar rentang", async () => {
    const svc = createQuranService(config());
    await expect(svc.getSurahView(1, { translations: ["ara-x"] })).rejects.toThrow(/bertipe arabic, bukan translation/);
    await expect(svc.getSurahView(0)).rejects.toThrow(/Nomor surat tidak valid/);
    await expect(svc.getSurahView(115)).rejects.toThrow(/Nomor surat tidak valid/);
  });

  it("gagal jelas bila jumlah ayat sebuah edisi tidak cocok", async () => {
    const svc = createQuranService(config({ textProviders: [textProvider("p1", EDITIONS, { verses: 1 })] }));
    await expect(svc.getSurahView(1)).rejects.toThrow(/1 ayat, seharusnya 2/);
  });

  it("gagal bila surat tidak ada di daftar surat", async () => {
    await expect(createQuranService(config()).getSurahView(2)).rejects.toThrow(/Surat 2 tidak ada/);
  });
});

describe("fallback antar provider", () => {
  it("memakai provider berikutnya bila yang pertama gagal", async () => {
    const svc = createQuranService(
      config({ textProviders: [textProvider("p1", EDITIONS, { fail: true }), textProvider("p2", EDITIONS, { surahs: false })] }),
    );
    // Teks p1 gagal, jadi tiap edisi diambil dari p2; daftar surat tetap dari p1.
    const view = await svc.getSurahView(1);
    expect(view.verses[0].arabic).toBe("ara-x:1");
  });

  it("melaporkan semua galat bila semua provider gagal", async () => {
    const svc = createQuranService(
      config({ textProviders: [textProvider("p1", EDITIONS, { fail: true }), textProvider("p2", EDITIONS, { fail: true })] }),
    );
    await expect(svc.getSurahView(1)).rejects.toThrow(/p1 mati; p2 mati/);
  });

  it("daftar surat dicari ke provider yang menyediakannya", async () => {
    const svc = createQuranService(
      config({ textProviders: [textProvider("p1", EDITIONS, { surahs: false }), textProvider("p2", [], {})] }),
    );
    expect((await svc.getSurahList())[0].number).toBe(1);
  });

  it("gagal jelas bila tidak ada provider yang punya daftar surat", async () => {
    const svc = createQuranService(config({ textProviders: [textProvider("p1", EDITIONS, { surahs: false })] }));
    await expect(svc.getSurahList()).rejects.toThrow(/tidak ada provider/);
  });
});

describe("audio", () => {
  it("mengurutkan URL menurut prioritas provider dan membuang duplikat", async () => {
    const svc = createQuranService(
      config({
        audioProviders: [audioProvider("a1", "https://a1"), audioProvider("a2", "https://a2"), audioProvider("a3", "https://a1")],
      }),
    );
    const view = await svc.getSurahView(1);
    expect(view.verses[0].audio).toEqual(["https://a1/1/1.mp3", "https://a2/1/1.mp3"]);
  });
});

import { describe, expect, it } from "vitest";
import type { AudioProvider, TextProvider } from "./provider";
import { createQuranService, type QuranConfig } from "./service";
import type { Edition, Qari, SurahMeta } from "./types";

const source = { name: "Test", attribution: { en: "Test source" } };
const edition = (id: string, kind: Edition["kind"]): Edition => ({
  id,
  kind,
  language: kind === "arabic" ? "ar" : "id",
  direction: kind === "arabic" ? "rtl" : "ltr",
  name: { en: id },
  source,
});

const META: SurahMeta = {
  number: 1,
  verseCount: 2,
  name: { arabic: "الفاتحة", latin: "Al-Fatihah", meaning: { id: "Pembukaan" } },
  revelation: "mecca",
  description: { id: "Surat pembuka" },
};

/** A test provider: the text is `${edition}:${verse}`; it can be made to fail or to return the wrong verse count. */
function textProvider(
  id: string,
  editions: Edition[],
  opts: { fail?: boolean; verses?: number; surahs?: boolean; meanings?: Record<number, Record<string, string>> } = {},
): TextProvider {
  return {
    id,
    editions: () => editions,
    ...(opts.surahs === false ? {} : { surahs: async () => [META] }),
    ...(opts.meanings ? { surahMeanings: async () => opts.meanings! } : {}),
    async text(editionId, surah) {
      if (opts.fail) throw new Error(`${id} is down`);
      const n = opts.verses ?? META.verseCount;
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
  urls: (_q, surah, verse) => [`${base}/${surah}/${verse}.mp3`],
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

describe("configuration", () => {
  it("rejects defaults that are not in the catalog", () => {
    const bad = config();
    bad.defaults = { ...bad.defaults, translations: ["missing"] };
    expect(() => createQuranService(bad)).toThrow(/not in the catalog/);
  });

  it("rejects an edition of the wrong kind", () => {
    const bad = config();
    bad.defaults = { ...bad.defaults, arabic: "ind-x" };
    expect(() => createQuranService(bad)).toThrow(/has kind "translation", expected "arabic"/);
  });

  it("rejects an unknown reciter", () => {
    const bad = config();
    bad.defaults = { ...bad.defaults, qari: "qari-z" };
    expect(() => createQuranService(bad)).toThrow(/Reciter "qari-z"/);
  });

  it("rejects the same edition with different kinds across providers", () => {
    expect(() =>
      createQuranService(
        config({
          textProviders: [textProvider("p1", EDITIONS), textProvider("p2", [edition("ara-x", "tafsir")])],
        }),
      ),
    ).toThrow(/is arabic in one provider and tafsir/);
  });

  it("rejects invalid defaults for a locale at startup", () => {
    expect(() => createQuranService(config({ localeDefaults: { en: { translations: ["missing"] } } }))).toThrow(
      /Invalid defaults for locale "en"/,
    );
  });

  it("merges the editions of several providers without duplicates", () => {
    const svc = createQuranService(
      config({ textProviders: [textProvider("p1", EDITIONS), textProvider("p2", [EDITIONS[0], edition("eng-y", "translation")])] }),
    );
    expect(svc.getCatalog().editions.map((e) => e.id)).toEqual(["ara-x", "ara-x-la", "ind-x", "ind-x-tafsir", "eng-y"]);
    expect(svc.getCatalog().qaris).toEqual([QARI]);
  });
});

describe("getSurahView", () => {
  it("builds the verses from the selected editions", async () => {
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

  it("supports several translations, and no transliteration or tafsir", async () => {
    const svc = createQuranService(
      config({ textProviders: [textProvider("p1", [...EDITIONS, edition("eng-y", "translation")])] }),
    );
    const view = await svc.getSurahView(1, { translations: ["ind-x", "eng-y"], transliteration: null, tafsir: null });
    expect(view.verses[0].translations.map((t) => t.edition)).toEqual(["ind-x", "eng-y"]);
    expect(view.verses[0].transliteration).toBeNull();
    expect(view.verses[0].tafsir).toBeNull();
  });

  it("rejects invalid choices and surah numbers out of range", async () => {
    const svc = createQuranService(config());
    await expect(svc.getSurahView(1, { translations: ["ara-x"] })).rejects.toThrow(/has kind "arabic", expected "translation"/);
    await expect(svc.getSurahView(0)).rejects.toThrow(/Invalid surah number/);
    await expect(svc.getSurahView(115)).rejects.toThrow(/Invalid surah number/);
  });

  it("fails clearly when an edition has the wrong number of verses", async () => {
    const svc = createQuranService(config({ textProviders: [textProvider("p1", EDITIONS, { verses: 1 })] }));
    await expect(svc.getSurahView(1)).rejects.toThrow(/1 verses, expected 2/);
  });

  it("fails when the surah is not in the surah list", async () => {
    await expect(createQuranService(config()).getSurahView(2)).rejects.toThrow(/Surah 2 is not in the surah list/);
  });
});

describe("a range of verses", () => {
  // A longer surah so that there is something to slice.
  const long = (): QuranConfig => {
    const surah: SurahMeta = { ...META, verseCount: 25 };
    const provider: TextProvider = {
      ...textProvider("p1", EDITIONS),
      surahs: async () => [surah],
      text: async (edition, number) => ({
        edition,
        surah: number,
        verses: Array.from({ length: 25 }, (_, i) => ({ number: i + 1, text: `${edition}:${i + 1}` })),
      }),
    };
    return config({ textProviders: [provider] });
  };

  it("builds only the verses asked for, with their own numbers and audio", async () => {
    const view = await createQuranService(long()).getSurahView(1, {}, undefined, { from: 11, to: 20 });
    expect(view.range).toEqual({ from: 11, to: 20 });
    expect(view.meta.verseCount).toBe(25);
    expect(view.verses.map((v) => v.number)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(view.verses[0]).toMatchObject({ arabic: "ara-x:11", tafsir: "ind-x-tafsir:11", audio: ["https://a1/1/11.mp3"] });
  });

  it("the whole surah is the default, and the last page may be short", async () => {
    const svc = createQuranService(long());
    const all = await svc.getSurahView(1);
    expect(all.range).toEqual({ from: 1, to: 25 });
    expect(all.verses).toHaveLength(25);
    expect((await svc.getSurahView(1, {}, undefined, { from: 21, to: 25 })).verses).toHaveLength(5);
  });

  it("rejects a range outside the surah", async () => {
    const svc = createQuranService(long());
    for (const range of [{ from: 0, to: 5 }, { from: 5, to: 4 }, { from: 21, to: 26 }, { from: 1.5, to: 3 }]) {
      await expect(svc.getSurahView(1, {}, undefined, range), JSON.stringify(range)).rejects.toThrow(/Invalid verse range/);
    }
  });
});

describe("defaults per interface language", () => {
  const withEnglish = (): QuranConfig =>
    config({
      textProviders: [textProvider("p1", [...EDITIONS, edition("eng-y", "translation")])],
      localeDefaults: { en: { translations: ["eng-y"] } },
    });

  it("uses the language's defaults, and the general ones for other languages", async () => {
    const svc = createQuranService(withEnglish());
    expect((await svc.getSurahView(1, {}, "en")).selection.translations).toEqual(["eng-y"]);
    expect((await svc.getSurahView(1, {}, "id")).selection.translations).toEqual(["ind-x"]);
    expect(svc.resolveSelection({}, undefined).translations).toEqual(["ind-x"]);
  });

  it("lets an explicit choice win over the language's defaults", () => {
    const svc = createQuranService(withEnglish());
    expect(svc.resolveSelection({ translations: ["ind-x"] }, "en").translations).toEqual(["ind-x"]);
  });
});

describe("surah meanings from other providers", () => {
  it("merges extra meanings into the surah list and ignores providers that fail", async () => {
    const failing: TextProvider = {
      ...textProvider("p3", []),
      surahMeanings: async () => {
        throw new Error("down");
      },
    };
    const svc = createQuranService(
      config({
        textProviders: [
          textProvider("p1", EDITIONS),
          textProvider("p2", [], { surahs: false, meanings: { 1: { en: "The Opening" } } }),
          failing,
        ],
      }),
    );
    const [first] = await svc.getSurahList();
    expect(first.name.meaning).toEqual({ id: "Pembukaan", en: "The Opening" });
  });
});

describe("fallback between providers", () => {
  it("uses the next provider when the first one fails", async () => {
    const svc = createQuranService(
      config({ textProviders: [textProvider("p1", EDITIONS, { fail: true }), textProvider("p2", EDITIONS, { surahs: false })] }),
    );
    // The text of p1 fails, so each edition comes from p2; the surah list still comes from p1.
    const view = await svc.getSurahView(1);
    expect(view.verses[0].arabic).toBe("ara-x:1");
  });

  it("reports every error when all providers fail", async () => {
    const svc = createQuranService(
      config({ textProviders: [textProvider("p1", EDITIONS, { fail: true }), textProvider("p2", EDITIONS, { fail: true })] }),
    );
    await expect(svc.getSurahView(1)).rejects.toThrow(/p1 is down; p2 is down/);
  });

  it("looks for the surah list in the provider that has it", async () => {
    const svc = createQuranService(
      config({ textProviders: [textProvider("p1", EDITIONS, { surahs: false }), textProvider("p2", [], {})] }),
    );
    expect((await svc.getSurahList())[0].number).toBe(1);
  });

  it("fails clearly when no provider has the surah list", async () => {
    const svc = createQuranService(config({ textProviders: [textProvider("p1", EDITIONS, { surahs: false })] }));
    await expect(svc.getSurahList()).rejects.toThrow(/no provider has it/);
  });
});

describe("audio", () => {
  it("orders the URLs by provider priority and removes duplicates", async () => {
    const svc = createQuranService(
      config({
        audioProviders: [audioProvider("a1", "https://a1"), audioProvider("a2", "https://a2"), audioProvider("a3", "https://a1")],
      }),
    );
    const view = await svc.getSurahView(1);
    expect(view.verses[0].audio).toEqual(["https://a1/1/1.mp3", "https://a2/1/1.mp3"]);
  });

  // A provider that knows its bitrates: the URL names it, as on the AlQuran.cloud CDN.
  const sized = (base: string, bitrates: number[]): AudioProvider => ({
    id: base,
    qaris: () => [QARI],
    urls: (_q, surah, verse) => bitrates.map((b) => `${base}/${b}/${surah}/${verse}.mp3`),
    kbps: (url) => Number(url.slice(base.length + 1).split("/")[0]),
  });

  it("orders the same URLs smallest first for data saving; a URL of unknown size goes last", async () => {
    const svc = createQuranService(config({ audioProviders: [audioProvider("a1", "https://a1"), sized("https://cdn", [128, 64])] }));
    const view = await svc.getSurahView(1);
    expect(view.verses[0].audio).toEqual(["https://a1/1/1.mp3", "https://cdn/128/1/1.mp3", "https://cdn/64/1/1.mp3"]);
    expect(view.verses[0].audioSaver).toEqual(["https://cdn/64/1/1.mp3", "https://cdn/128/1/1.mp3", "https://a1/1/1.mp3"]);
    expect(svc.getCatalog().qaris[0].dataSaver).toBe(true);
  });

  it("gives the recording of the whole surah when a provider has one, and none otherwise", async () => {
    const whole: AudioProvider = { ...audioProvider("a1", "https://a1"), surahUrls: (_q, surah) => [`https://a1/full/${surah}.mp3`] };
    expect((await createQuranService(config({ audioProviders: [whole] })).getSurahView(1)).surahAudio).toEqual(["https://a1/full/1.mp3"]);
    expect((await createQuranService(config({ audioProviders: [audioProvider("a1", "https://a1")] })).getSurahView(1)).surahAudio).toBeUndefined();
  });

  it("gives no data-saver order, and no data-saver mark, when the usual file is already the smallest", async () => {
    for (const providers of [[audioProvider("a1", "https://a1")], [sized("https://cdn", [64, 128])], [sized("https://cdn", [64])]]) {
      const svc = createQuranService(config({ audioProviders: providers }));
      const view = await svc.getSurahView(1);
      expect(view.verses[0].audioSaver).toBeUndefined();
      expect(svc.getCatalog().qaris[0].dataSaver).toBeUndefined();
    }
  });
});

describe("the juz boundaries", () => {
  const SURAHS114: SurahMeta[] = Array.from({ length: 114 }, (_, i) => ({ ...META, number: i + 1, verseCount: 10 }));
  const flat = SURAHS114.flatMap((s) => Array.from({ length: 10 }, (_, v) => ({ surah: s.number, verse: v + 1 })));
  const JUZS = Array.from({ length: 30 }, (_, j) => ({ juz: j + 1, start: flat[j * 38], end: flat[j * 38 + 37] }));

  const withJuzs = (juzs: TextProvider["juzs"], surahs: SurahMeta[] = SURAHS114): QuranConfig =>
    config({ textProviders: [{ ...textProvider("p1", EDITIONS), surahs: async () => surahs, ...(juzs ? { juzs } : {}) }] });

  it("returns the table of the first provider that has one, once it checks out", async () => {
    expect(await createQuranService(withJuzs(async () => JUZS)).getJuzList()).toEqual(JUZS);
  });

  it("refuses a table that does not fit the surah list", async () => {
    const gap = JUZS.map((j) => (j.juz === 7 ? { ...j, start: { ...j.start, verse: j.start.verse + 1 } } : j));
    await expect(createQuranService(withJuzs(async () => gap)).getJuzList()).rejects.toThrow(/Juz 7 starts at/);
  });

  it("falls back to the next provider when the first one fails, and says so when none has the table", async () => {
    const failing: TextProvider = { ...textProvider("p1", EDITIONS), juzs: async () => { throw new Error("down"); } };
    const good: TextProvider = { ...textProvider("p2", [], { surahs: false }), juzs: async () => JUZS };
    const svc = createQuranService(config({ textProviders: [{ ...failing, surahs: async () => SURAHS114 }, good] }));
    expect(await svc.getJuzList()).toEqual(JUZS);
    await expect(createQuranService(withJuzs(undefined)).getJuzList()).rejects.toThrow(/juz boundaries could not be loaded: no provider has them/);
  });
});

describe("the mushaf pages", () => {
  const SURAHS114: SurahMeta[] = Array.from({ length: 114 }, (_, i) => ({ ...META, number: i + 1, verseCount: 10 }));
  const flat = SURAHS114.flatMap((s) => Array.from({ length: 10 }, (_, v) => ({ surah: s.number, verse: v + 1 })));
  // 1,140 verses on 604 pages: 536 pages of two verses, then 68 of one.
  const sizes = [...Array(536).fill(2), ...Array(68).fill(1)];
  const starts = sizes.map((_, i) => sizes.slice(0, i).reduce((a, b) => a + b, 0));
  const PAGES = sizes.map((size, i) => ({ page: i + 1, start: flat[starts[i]], end: flat[starts[i] + size - 1] }));

  const withPages = (mushafPages: TextProvider["mushafPages"]): QuranConfig =>
    config({ textProviders: [{ ...textProvider("p1", EDITIONS), surahs: async () => SURAHS114, ...(mushafPages ? { mushafPages } : {}) }] });

  it("returns the table of the first provider that has one, once it checks out", async () => {
    expect(await createQuranService(withPages(async () => PAGES)).getMushafPages()).toEqual(PAGES);
  });

  it("refuses a table that does not fit the surah list", async () => {
    await expect(createQuranService(withPages(async () => PAGES.slice(1))).getMushafPages()).rejects.toThrow(/Expected 604 pages, got 603/);
  });

  it("falls back to the next provider when the first one fails, and says so when none has the table", async () => {
    const failing: TextProvider = { ...textProvider("p1", EDITIONS), mushafPages: async () => { throw new Error("down"); } };
    const good: TextProvider = { ...textProvider("p2", [], { surahs: false }), mushafPages: async () => PAGES };
    const svc = createQuranService(config({ textProviders: [{ ...failing, surahs: async () => SURAHS114 }, good] }));
    expect(await svc.getMushafPages()).toEqual(PAGES);
    await expect(createQuranService(withPages(undefined)).getMushafPages()).rejects.toThrow(/mushaf pages could not be loaded: no provider has them/);
  });
});

describe("a tafsir passage that explains several verses", () => {
  it("gives the verses it covers an empty tafsir and the verse that holds it", async () => {
    const grouped: TextProvider = {
      ...textProvider("p1", EDITIONS),
      async text(editionId, surah) {
        const verses =
          editionId === "ind-x-tafsir"
            ? [{ number: 1, text: "one and two" }, { number: 2, text: "", sharedWith: 1 }]
            : [1, 2].map((n) => ({ number: n, text: `${editionId}:${n}` }));
        return { edition: editionId, surah, verses };
      },
    };
    const view = await createQuranService(config({ textProviders: [grouped] })).getSurahView(1);
    expect(view.verses.map((v) => [v.tafsir, v.tafsirSharedWith])).toEqual([["one and two", undefined], ["", 1]]);
    expect("tafsirSharedWith" in view.verses[0]).toBe(false);
  });
});

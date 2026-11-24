import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultConfig } from "./index";
import { createQuranService } from "./service";
import {
  applyEnv,
  DEFAULT_SOURCES,
  loadSourceConfig,
  parseSourceConfig,
  SourceConfigError,
  toQuranConfig,
  type SourceConfig,
} from "./sources";

const valid = (): SourceConfig => structuredClone(DEFAULT_SOURCES);
// The tests break a valid configuration on purpose, so its type is deliberately loose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = Record<string, any>;
const parse = (mutate: (c: Loose) => void) => {
  const c = structuredClone(DEFAULT_SOURCES) as unknown as Loose;
  mutate(c);
  return () => parseSourceConfig(c);
};

describe("parseSourceConfig", () => {
  it("accepts the built-in configuration and the example file", () => {
    expect(parseSourceConfig(valid())).toMatchObject({ textProviders: [{ type: "equran" }, { type: "fawazahmed0" }, { type: "quranenc" }, { type: "quran-foundation" }, { type: "qul" }] });
    const example = JSON.parse(readFileSync("config/sources.example.json", "utf8"));
    expect(parseSourceConfig(example).textProviders).toHaveLength(4);
    expect(parseSourceConfig(example).localeDefaults?.tr?.translations).toEqual(["tur-diyanetisleri"]); // Turkish by default, like the built-in registry
    // and the example describes a working service
    expect(() => createQuranService(toQuranConfig(parseSourceConfig(example)))).not.toThrow();
  });

  it("rejects things that are not objects, and unknown keys (typos)", () => {
    expect(() => parseSourceConfig(null)).toThrow(/config must be an object/);
    expect(() => parseSourceConfig([])).toThrow(SourceConfigError);
    expect(parse((c) => (c.textProvider = []))).toThrow(/config\.textProvider is not a known option/);
    expect(parse((c) => (c.textProviders[0].baseURL = "x"))).toThrow(/textProviders\[0\]\.baseURL is not a known option/);
  });

  it("rejects empty or unknown providers and names the allowed types", () => {
    expect(parse((c) => (c.textProviders = []))).toThrow(/textProviders must be a non-empty list/);
    expect(parse((c) => (c.textProviders[1].type = "nope"))).toThrow(/textProviders\[1\]\.type must be one of: equran, fawazahmed0, quranenc, quran-foundation, qul \(got "nope"\)/);
    expect(parse((c) => (c.audioProviders = []))).toThrow(/audioProviders must be a non-empty list/);
    expect(parse((c) => (c.audioProviders[0].type = "mp3"))).toThrow(/audioProviders\[0\]\.type/);
  });

  it("checks the options of each provider", () => {
    expect(parse((c) => (c.textProviders[0].baseUrl = ""))).toThrow(/baseUrl must be a non-empty string/);
    expect(parse((c) => (c.textProviders[1].editions = ["no-such-edition"]))).toThrow(/unknown edition "no-such-edition"/);
    expect(parse((c) => (c.textProviders[1].editions = "ara-quranuthmanihaf"))).toThrow(/must be a list of non-empty strings/);
    expect(parseSourceConfig(valid()).textProviders[1]).toMatchObject({ type: "fawazahmed0" });
  });

  it("checks the defaults", () => {
    expect(parse((c) => delete c.defaults.qari)).toThrow(/defaults\.qari is required/);
    expect(parse((c) => (c.defaults.translations = "ind-kemenag"))).toThrow(/defaults\.translations must be a list/);
    expect(parse((c) => (c.defaults.tafsir = 7))).toThrow(/defaults\.tafsir must be a non-empty string/);
    expect(parse((c) => (c.defaults.colour = "red"))).toThrow(/defaults\.colour is not a known option/);
    expect(parse((c) => (c.defaults.tafsir = null))).not.toThrow();
  });

  it("checks the defaults per language, where every field is optional", () => {
    expect(parse((c) => (c.localeDefaults = { id: { translations: ["ind-kemenag"] } }))).not.toThrow();
    expect(parse((c) => (c.localeDefaults = { en: { translations: [1] } }))).toThrow(/localeDefaults\.en\.translations/);
    expect(parse((c) => (c.localeDefaults = { en: "x" }))).toThrow(/localeDefaults\.en must be an object/);
  });
});

describe("applyEnv", () => {
  it("fills in missing base URLs and leaves explicit ones alone", () => {
    const config: SourceConfig = {
      ...valid(),
      textProviders: [{ type: "equran", baseUrl: "/data/api/v2" }, { type: "equran" }, { type: "fawazahmed0" }],
    };
    const out = applyEnv(config, { QURAN_API_URL: "https://api.test", QURAN_FAWAZ_URL: "/mirror", QURAN_AUDIO_URL: "https://audio.test" });
    expect(out.textProviders.map((p) => p.baseUrl)).toEqual(["/data/api/v2", "https://api.test", "/mirror"]);
    expect(out.audioProviders[0].baseUrl).toBe("https://audio.test");
  });

  it("points the AlQuran.cloud audio at QURAN_ISLAMIC_AUDIO_URL, not QURAN_AUDIO_URL", () => {
    const config: SourceConfig = { ...valid(), audioProviders: [{ type: "equran-audio" }, { type: "islamic-network" }] };
    const out = applyEnv(config, { QURAN_AUDIO_URL: "https://audio.test", QURAN_ISLAMIC_AUDIO_URL: "https://cdn.test" });
    expect(out.audioProviders.map((p) => p.baseUrl)).toEqual(["https://audio.test", "https://cdn.test"]);
  });

  it("does nothing for unset or blank variables", () => {
    expect(applyEnv(valid(), { QURAN_API_URL: "  " }).textProviders[0].baseUrl).toBeUndefined();
  });
});

describe("loadSourceConfig", () => {
  it("uses the built-in configuration without QURAN_CONFIG", () => {
    expect(loadSourceConfig({}).defaults).toEqual(DEFAULT_SOURCES.defaults);
  });

  it("reads and validates the file named by QURAN_CONFIG, then applies the environment", () => {
    const file = JSON.stringify({ ...valid(), textProviders: [{ type: "equran" }] });
    const config = loadSourceConfig({ QURAN_CONFIG: "/etc/q.json", QURAN_API_URL: "/data/api/v2" }, (path) => {
      expect(path).toBe("/etc/q.json");
      return file;
    });
    expect(config.textProviders).toEqual([{ type: "equran", baseUrl: "/data/api/v2" }]);
  });

  it("reports an unreadable file, broken JSON and an invalid configuration", () => {
    const unreadable = () => {
      throw new Error("ENOENT");
    };
    expect(() => loadSourceConfig({ QURAN_CONFIG: "/x.json" }, unreadable)).toThrow(/cannot read \/x\.json: ENOENT/);
    expect(() => loadSourceConfig({ QURAN_CONFIG: "/x.json" }, () => "{broken")).toThrow(/cannot read \/x\.json/);
    expect(() => loadSourceConfig({ QURAN_CONFIG: "/x.json" }, () => "{}")).toThrow(/textProviders must be a non-empty list/);
  });
});

describe("toQuranConfig", () => {
  it("builds the providers in the configured order", () => {
    const config = toQuranConfig({
      ...valid(),
      textProviders: [{ type: "fawazahmed0", editions: ["eng-abdullahyusufal"] }, { type: "equran" }],
    });
    expect(config.textProviders.map((p) => p.id)).toEqual(["fawazahmed0", "equran"]);
    expect(config.textProviders[0].editions().map((e) => e.id)).toEqual(["eng-abdullahyusufal"]);
  });

  it("a configuration whose defaults are not in the catalog fails at startup", () => {
    const config = toQuranConfig({ ...valid(), textProviders: [{ type: "fawazahmed0", editions: ["eng-abdullahyusufal"] }] });
    expect(() => createQuranService(config)).toThrow(/not in the catalog/);
  });
});

// ----------------------------------------------------- everything from local files

describe("running from local files only", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "quranweb-local-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const envelope = (data: unknown) => ({ code: 200, message: "ok", data });
  const surah1 = {
    nomor: 1, nama: "الفاتحة", namaLatin: "Al-Fatihah", jumlahAyat: 2, tempatTurun: "Mekah", arti: "Pembukaan", deskripsi: "Pembuka",
    ayat: [
      { nomorAyat: 1, teksArab: "ar-eq-1", teksLatin: "la-eq-1", teksIndonesia: "id-eq-1" },
      { nomorAyat: 2, teksArab: "ar-eq-2", teksLatin: "la-eq-2", teksIndonesia: "id-eq-2" },
    ],
  };
  const chapter = (texts: string[]) => ({ chapter: texts.map((text, i) => ({ chapter: 1, verse: i + 1, text })) });

  async function writeMirror(): Promise<void> {
    const put = async (rel: string, data: unknown) => {
      await mkdir(join(dir, rel, ".."), { recursive: true });
      await writeFile(join(dir, rel), JSON.stringify(data));
    };
    await put("api/v2/surat.json", envelope([surah1]));
    await put("api/v2/surat/1.json", envelope(surah1));
    await put("api/v2/tafsir/1.json", envelope({ tafsir: [{ ayat: 1, teks: "tafsir-1" }, { ayat: 2, teks: "tafsir-2" }] }));
    await put("quran-api/info.min.json", { chapters: [{ chapter: 1, englishname: "The Opening" }] });
    await put("quran-api/editions/ara-quranuthmanihaf/1.min.json", chapter(["fz-ar-1", "fz-ar-2"]));
    await put("quran-api/editions/eng-abdullahyusufal/1.min.json", chapter(["fz-en-1", "fz-en-2"]));
  }

  it("serves a whole surah view from directories, with no HTTP request at all", async () => {
    await writeMirror();
    const globalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("the network must not be used");
    }) as typeof fetch;
    try {
      const svc = createQuranService(defaultConfig({ QURAN_API_URL: join(dir, "api/v2"), QURAN_FAWAZ_URL: `file://${join(dir, "quran-api")}` }));
      const view = await svc.getSurahView(1, { arabic: "ara-quranuthmanihaf", translations: ["ind-kemenag", "eng-abdullahyusufal"] });
      expect(view.verses[1]).toMatchObject({
        arabic: "fz-ar-2",
        transliteration: "la-eq-2",
        tafsir: "tafsir-2",
        translations: [
          { edition: "ind-kemenag", text: "id-eq-2" },
          { edition: "eng-abdullahyusufal", text: "fz-en-2" },
        ],
      });
      expect((await svc.getSurahList())[0].name.meaning).toEqual({ id: "Pembukaan", en: "The Opening" });
    } finally {
      globalThis.fetch = globalFetch;
    }
  });

  it("works through a QURAN_CONFIG file that restricts the editions and sets the defaults", async () => {
    await writeMirror();
    const file = join(dir, "sources.json");
    await writeFile(
      file,
      JSON.stringify({
        textProviders: [
          { type: "equran", baseUrl: join(dir, "api/v2") },
          { type: "fawazahmed0", baseUrl: join(dir, "quran-api"), editions: ["ara-quranuthmanihaf", "eng-abdullahyusufal"] },
        ],
        audioProviders: [{ type: "equran-audio", baseUrl: "https://audio.test" }],
        defaults: { arabic: "ara-quranuthmanihaf", transliteration: null, translations: ["eng-abdullahyusufal"], tafsir: null, qari: "misyari-rasyid-al-afasi" },
      }),
    );
    const svc = createQuranService(defaultConfig({ QURAN_CONFIG: file }));

    expect(svc.getCatalog().editions.filter((e) => e.source.name === "fawazahmed0/quran-api").map((e) => e.id)).toEqual([
      "ara-quranuthmanihaf",
      "eng-abdullahyusufal",
    ]);
    const view = await svc.getSurahView(1);
    expect(view.verses[0]).toEqual({
      number: 1,
      arabic: "fz-ar-1",
      transliteration: null,
      translations: [{ edition: "eng-abdullahyusufal", text: "fz-en-1" }],
      tafsir: null,
      audio: ["https://audio.test/audio-partial/Misyari-Rasyid-Al-Afasi/001001.mp3"],
    });
  });

  it("falls back to the next provider when the local copy has no such file", async () => {
    await writeMirror();
    // The first provider is a local directory that lacks tafsir; the second one is the same data elsewhere.
    const second = await mkdtemp(join(tmpdir(), "quranweb-local2-"));
    try {
      await mkdir(join(second, "api/v2/tafsir"), { recursive: true });
      await writeFile(join(second, "api/v2/surat.json"), JSON.stringify(envelope([surah1])));
      await writeFile(join(second, "api/v2/tafsir/1.json"), JSON.stringify(envelope({ tafsir: [{ ayat: 1, teks: "from-second" }, { ayat: 2, teks: "from-second-2" }] })));
      await rm(join(dir, "api/v2/tafsir"), { recursive: true, force: true });
      const svc = createQuranService(
        toQuranConfig({
          ...valid(),
          localeDefaults: undefined, // the English default is a fawazahmed0 edition, which this configuration has not
          textProviders: [{ type: "equran", baseUrl: join(dir, "api/v2") }, { type: "equran", baseUrl: join(second, "api/v2") }],
        }),
      );
      expect((await svc.getSurahView(1)).verses[0].tafsir).toBe("from-second");
    } finally {
      await rm(second, { recursive: true, force: true });
    }
  });
});

describe("the QuranEnc provider in the registry", () => {
  it("is a known type, checks its edition names, and takes its base URL from QURAN_QURANENC_URL", () => {
    const base = parseSourceConfig(JSON.parse(readFileSync("config/sources.example.json", "utf8")));
    const raw = JSON.parse(readFileSync("config/sources.example.json", "utf8"));
    raw.textProviders = [...raw.textProviders.slice(0, 3), { type: "quranenc", editions: ["eng-mokhtasar", "nope"] }];
    expect(() => parseSourceConfig(raw)).toThrow(/unknown edition "nope" \(known: ind-indonesianislam, eng-mokhtasar, tur-mokhtasar, ind-mokhtasar, fra-rashidmaash, ben-mokhtasar, fra-mokhtasar, rus-mokhtasar, urd-muhammadjunagar, fas-islamhousecompe, fas-mokhtasar, ara-mokhtasar, spa-isagarcia, bos-rowwad, zho-makin, tha-rowwad, uzb-rowwad, tam-omarsharif, mal-kunhimuhammad, bos-mokhtasar, zho-mokhtasar, tha-mokhtasar, uzb-mokhtasar, tam-mokhtasar, mal-mokhtasar, deu-bubenheim, por-helminasr, hin-omari, swa-barwani, hau-gumi, jpn-saeedsato, vie-rowwad, ita-mokhtasar, hin-mokhtasar, jpn-mokhtasar, vie-mokhtasar\)/);
    expect(base.textProviders.find((p) => p.type === "quranenc")?.baseUrl).toBe("/data/quranenc");
    const filled = applyEnv({ ...DEFAULT_SOURCES }, { QURAN_QURANENC_URL: "/data/quranenc", QURAN_FAWAZ_URL: "/data/quran-api" });
    expect(filled.textProviders.find((p) => p.type === "quranenc")?.baseUrl).toBe("/data/quranenc");
    expect(filled.textProviders.find((p) => p.type === "fawazahmed0")?.baseUrl).toBe("/data/quran-api");
  });
});

describe("the Quran Foundation provider in the registry", () => {
  const qf = (config: ReturnType<typeof applyEnv>) => config.textProviders.find((p) => p.type === "quran-foundation");

  it("takes the Content API credentials from QF_CLIENT_ID and QF_CLIENT_SECRET, only when both are set", () => {
    expect(qf(applyEnv({ ...DEFAULT_SOURCES }, { QF_CLIENT_ID: " id ", QF_CLIENT_SECRET: " secret " }))).toMatchObject({
      auth: { clientId: "id", clientSecret: "secret" },
    });
    expect(qf(applyEnv({ ...DEFAULT_SOURCES }, { QF_CLIENT_ID: "id" }))?.auth).toBeUndefined();
    expect(qf(applyEnv({ ...DEFAULT_SOURCES }, { QF_CLIENT_ID: "id", QF_CLIENT_SECRET: "  " }))?.auth).toBeUndefined();
    expect(qf(applyEnv({ ...DEFAULT_SOURCES }, { QURAN_FAWAZ_URL: "/data/quran-api" }))?.baseUrl).toBeUndefined();
  });

  it("refuses credentials in a configuration file", () => {
    const raw = JSON.parse(readFileSync("config/sources.example.json", "utf8"));
    raw.textProviders = [...raw.textProviders, { type: "quran-foundation", auth: { clientId: "x", clientSecret: "y" } }];
    expect(() => parseSourceConfig(raw)).toThrow(/auth/);
  });
});

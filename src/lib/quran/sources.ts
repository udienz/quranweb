// The source registry: which providers are active, in which order, and the defaults.
// It is data, not code: the built-in configuration below can be replaced by a JSON file
// (QURAN_CONFIG=/path/to/sources.json, see config/sources.example.json) and the base URLs
// can be overridden with environment variables.
//
// Resolution order: the file (or the built-in configuration), then the environment
// variables QURAN_API_URL, QURAN_AUDIO_URL, QURAN_FAWAZ_URL and QURAN_QURANENC_URL, which only fill in a
// `baseUrl` that the configuration leaves out. An explicit `baseUrl` always wins.

import { readFileSync } from "node:fs";
import type { AudioProvider, TextProvider } from "./provider";
import { createEquranAudioProvider, createEquranTextProvider } from "./providers/equran";
import { createFawazTextProvider, FAWAZ_EDITIONS } from "./providers/fawazahmed0";
import { createQuranEncTextProvider, QURANENC_EDITIONS } from "./providers/quranenc";
import { createQuranFoundationTextProvider, QURAN_FOUNDATION_EDITIONS } from "./providers/quran-foundation";
import { createIslamicNetworkAudioProvider } from "./providers/islamic-network";
import type { QuranConfig } from "./service";
import type { Selection } from "./types";

export interface EquranTextSource {
  type: "equran";
  /** An HTTP URL, or a directory with the mirror's files. Default: https://equran.id/api/v2 */
  baseUrl?: string;
}

export interface FawazTextSource {
  type: "fawazahmed0";
  /** An HTTP URL, or a directory with the mirror's files. Default: jsDelivr, then raw GitHub. */
  baseUrl?: string;
  /** Edition IDs to enable. Default: all the editions the adapter knows. */
  editions?: string[];
}

export interface QuranEncTextSource {
  type: "quranenc";
  /** An HTTP URL, or a directory with the private copy. Default: the live API (development only). */
  baseUrl?: string;
  /** Edition IDs to enable. Default: all the editions the adapter knows. */
  editions?: string[];
}

export interface QuranFoundationTextSource {
  type: "quran-foundation";
  /** An HTTP URL of the API. Default: the unauthenticated v4 API (read live, no copy). */
  baseUrl?: string;
  /** Edition IDs to enable. Default: all the editions the adapter knows. */
  editions?: string[];
}

export interface EquranAudioSource {
  type: "equran-audio";
  /** Base URL of the audio files. Default: https://cdn.equran.id */
  baseUrl?: string;
}

export interface IslamicNetworkAudioSource {
  type: "islamic-network";
  /** Base URL of the AlQuran.cloud CDN. Default: https://cdn.islamic.network */
  baseUrl?: string;
}

export type TextSourceConfig = EquranTextSource | FawazTextSource | QuranEncTextSource | QuranFoundationTextSource;
export type AudioSourceConfig = EquranAudioSource | IslamicNetworkAudioSource;

export interface SourceConfig {
  /** Order = priority: the first provider is tried first, the rest are fallbacks. */
  textProviders: TextSourceConfig[];
  audioProviders: AudioSourceConfig[];
  defaults: Selection;
  /** Defaults that replace the general ones for an interface language. */
  localeDefaults?: Record<string, Partial<Selection>>;
}

/** The configuration used when no file is given. */
export const DEFAULT_SOURCES: SourceConfig = {
  // fawazahmed0 only adds editions to the catalog; the defaults still come from EQuran.id.
  // Quran Foundation: tafsir in languages the others lack (Urdu), read live.
  textProviders: [{ type: "equran" }, { type: "fawazahmed0" }, { type: "quranenc" }, { type: "quran-foundation" }],
  // EQuran.id first (its reciters and the default), then the AlQuran.cloud CDN: more reciters, and the fallback for the two
  // that both have.
  audioProviders: [{ type: "equran-audio" }, { type: "islamic-network" }],
  defaults: {
    arabic: "ara-equran",
    transliteration: "ara-equran-la",
    translations: ["ind-kemenag"],
    tafsir: "ind-kemenag-tafsir",
    qari: "misyari-rasyid-al-afasi",
  },
  // With another interface language, read a translation and a tafsir in that language unless the reader chose otherwise
  // (the tafsir: Al-Mukhtasar from QuranEnc; the default one is Indonesian). Malay has no Al-Mukhtasar, so it keeps the
  // general tafsir, which a Malay reader can follow.
  localeDefaults: {
    en: { translations: ["eng-abdullahyusufal"], tafsir: "eng-mokhtasar" },
    tr: { translations: ["tur-diyanetisleri"], tafsir: "tur-mokhtasar" },
    ms: { translations: ["msa-abdullahmuhamma"] },
    bn: { translations: ["ben-muhiuddinkhan"], tafsir: "ben-mokhtasar" },
    fr: { translations: ["fra-rashidmaash"], tafsir: "fra-mokhtasar" },
    ru: { translations: ["rus-elmirkuliev"], tafsir: "rus-mokhtasar" },
    // Tafsir Ibn Kathir in Urdu from the Quran Foundation API (the owner's choice, 2026-11-24); until then Urdu read
    // Al-Mukhtasar in English.
    ur: { translations: ["urd-muhammadjunagar"], tafsir: "urd-ibnkathir" },
    // An Arabic reader reads the text itself: no translation and no Latin transliteration by default.
    ar: { translations: [], transliteration: null, tafsir: "ara-mokhtasar" },
    fa: { translations: ["fas-islamhousecompe"], tafsir: "fas-mokhtasar" },
    // No Spanish tafsir in our sources (see quranenc.ts): English, by the same rule.
    es: { translations: ["spa-isagarcia"], tafsir: "eng-mokhtasar" },
    bs: { translations: ["bos-rowwad"], tafsir: "bos-mokhtasar" },
    zh: { translations: ["zho-makin"], tafsir: "zho-mokhtasar" },
    th: { translations: ["tha-rowwad"], tafsir: "tha-mokhtasar" },
    uz: { translations: ["uzb-rowwad"], tafsir: "uzb-mokhtasar" },
    ta: { translations: ["tam-omarsharif"], tafsir: "tam-mokhtasar" },
    ml: { translations: ["mal-kunhimuhammad"], tafsir: "mal-mokhtasar" },
    // Wave 4: where QuranEnc has no Al-Mukhtasar (German, Portuguese, Swahili, Hausa) or no translation (Italian), English.
    de: { translations: ["deu-bubenheim"], tafsir: "eng-mokhtasar" },
    pt: { translations: ["por-helminasr"], tafsir: "eng-mokhtasar" },
    it: { translations: ["eng-abdullahyusufal"], tafsir: "ita-mokhtasar" },
    hi: { translations: ["hin-omari"], tafsir: "hin-mokhtasar" },
    sw: { translations: ["swa-barwani"], tafsir: "eng-mokhtasar" },
    ha: { translations: ["hau-gumi"], tafsir: "eng-mokhtasar" },
    ja: { translations: ["jpn-saeedsato"], tafsir: "jpn-mokhtasar" },
    vi: { translations: ["vie-rowwad"], tafsir: "vie-mokhtasar" },
  },
};

export class SourceConfigError extends Error {
  constructor(message: string) {
    super(`Invalid source configuration: ${message}`);
    this.name = "SourceConfigError";
  }
}

const TEXT_TYPES = ["equran", "fawazahmed0", "quranenc", "quran-foundation"] as const;
const AUDIO_TYPES = ["equran-audio", "islamic-network"] as const;

// ---------------------------------------------------------------- validation

type Obj = Record<string, unknown>;

function asObject(value: unknown, path: string): Obj {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SourceConfigError(`${path} must be an object`);
  }
  return value as Obj;
}

function noUnknownKeys(obj: Obj, allowed: readonly string[], path: string): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      throw new SourceConfigError(`${path}.${key} is not a known option (expected: ${allowed.join(", ")})`);
    }
  }
}

function optionalString(obj: Obj, key: string, path: string): string | undefined {
  const value = obj[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) throw new SourceConfigError(`${path}.${key} must be a non-empty string`);
  return value.trim();
}

function stringList(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string" || !v.trim())) {
    throw new SourceConfigError(`${path} must be a list of non-empty strings`);
  }
  return value as string[];
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new SourceConfigError(`${path} must be one of: ${allowed.join(", ")} (got ${JSON.stringify(value)})`);
  }
  return value as T;
}

const SELECTION_KEYS = ["arabic", "transliteration", "translations", "tafsir", "qari"] as const;

function parseSelectionFields(obj: Obj, path: string, partial: boolean): Partial<Selection> {
  noUnknownKeys(obj, SELECTION_KEYS, path);
  const out: Partial<Selection> = {};
  const required = (key: (typeof SELECTION_KEYS)[number]) => {
    if (!partial && obj[key] === undefined) throw new SourceConfigError(`${path}.${key} is required`);
  };
  for (const key of ["arabic", "qari"] as const) {
    required(key);
    const v = optionalString(obj, key, path);
    if (v !== undefined) out[key] = v;
  }
  for (const key of ["transliteration", "tafsir"] as const) {
    required(key);
    if (obj[key] === null) out[key] = null;
    else {
      const v = optionalString(obj, key, path);
      if (v !== undefined) out[key] = v;
    }
  }
  required("translations");
  if (obj.translations !== undefined) out.translations = stringList(obj.translations, `${path}.translations`);
  return out;
}

/** Check a raw value (usually parsed JSON) and return it as a SourceConfig. Throws a SourceConfigError. */
export function parseSourceConfig(raw: unknown): SourceConfig {
  const root = asObject(raw, "config");
  noUnknownKeys(root, ["textProviders", "audioProviders", "defaults", "localeDefaults"], "config");

  if (!Array.isArray(root.textProviders) || root.textProviders.length === 0) {
    throw new SourceConfigError("textProviders must be a non-empty list");
  }
  const textProviders = root.textProviders.map((item, i): TextSourceConfig => {
    const path = `textProviders[${i}]`;
    const obj = asObject(item, path);
    const type = oneOf(obj.type, TEXT_TYPES, `${path}.type`);
    if (type === "equran") {
      noUnknownKeys(obj, ["type", "baseUrl"], path);
      return { type, baseUrl: optionalString(obj, "baseUrl", path) };
    }
    noUnknownKeys(obj, ["type", "baseUrl", "editions"], path);
    const editions = obj.editions === undefined ? undefined : stringList(obj.editions, `${path}.editions`);
    const known = type === "quranenc" ? QURANENC_EDITIONS : type === "quran-foundation" ? QURAN_FOUNDATION_EDITIONS : FAWAZ_EDITIONS;
    for (const id of editions ?? []) {
      if (!known.some((e) => e.id === id)) {
        throw new SourceConfigError(
          `${path}.editions: unknown edition "${id}" (known: ${known.map((e) => e.id).join(", ")})`,
        );
      }
    }
    return { type, baseUrl: optionalString(obj, "baseUrl", path), editions };
  });

  const audioList = root.audioProviders ?? [];
  if (!Array.isArray(audioList) || audioList.length === 0) {
    throw new SourceConfigError("audioProviders must be a non-empty list");
  }
  const audioProviders = audioList.map((item, i): AudioSourceConfig => {
    const path = `audioProviders[${i}]`;
    const obj = asObject(item, path);
    const type = oneOf(obj.type, AUDIO_TYPES, `${path}.type`);
    noUnknownKeys(obj, ["type", "baseUrl"], path);
    return { type, baseUrl: optionalString(obj, "baseUrl", path) };
  });

  const defaults = parseSelectionFields(asObject(root.defaults, "defaults"), "defaults", false) as Selection;

  let localeDefaults: SourceConfig["localeDefaults"];
  if (root.localeDefaults !== undefined) {
    localeDefaults = {};
    for (const [locale, value] of Object.entries(asObject(root.localeDefaults, "localeDefaults"))) {
      localeDefaults[locale] = parseSelectionFields(asObject(value, `localeDefaults.${locale}`), `localeDefaults.${locale}`, true);
    }
  }

  return { textProviders, audioProviders, defaults, localeDefaults };
}

// ------------------------------------------------------------------- loading

export type Env = Record<string, string | undefined>;

/** Fill in the base URLs from the environment where the configuration leaves them out. */
export function applyEnv(config: SourceConfig, env: Env): SourceConfig {
  const fill = (baseUrl: string | undefined, value: string | undefined) => baseUrl ?? (value?.trim() || undefined);
  return {
    ...config,
    textProviders: config.textProviders.map((p) =>
      p.type === "equran"
        ? { ...p, baseUrl: fill(p.baseUrl, env.QURAN_API_URL) }
        : p.type === "quranenc"
          ? { ...p, baseUrl: fill(p.baseUrl, env.QURAN_QURANENC_URL) }
          : p.type === "quran-foundation"
            ? p // read live, so no variable
            : { ...p, baseUrl: fill(p.baseUrl, env.QURAN_FAWAZ_URL) },
    ),
    audioProviders: config.audioProviders.map((p) =>
      p.type === "islamic-network"
        ? { ...p, baseUrl: fill(p.baseUrl, env.QURAN_ISLAMIC_AUDIO_URL) }
        : { ...p, baseUrl: fill(p.baseUrl, env.QURAN_AUDIO_URL) },
    ),
  };
}

/**
 * The source configuration for this process: the JSON file named by QURAN_CONFIG if
 * set, otherwise the built-in one, then the environment on top.
 */
export function loadSourceConfig(env: Env, readText: (path: string) => string = (p) => readFileSync(p, "utf8")): SourceConfig {
  const path = env.QURAN_CONFIG?.trim();
  let config = DEFAULT_SOURCES;
  if (path) {
    let json: unknown;
    try {
      json = JSON.parse(readText(path));
    } catch (err) {
      throw new SourceConfigError(`cannot read ${path}: ${err instanceof Error ? err.message : String(err)}`);
    }
    config = parseSourceConfig(json);
  }
  return applyEnv(config, env);
}

// ------------------------------------------------------------------- building

/** Create the providers named in the configuration. */
export function toQuranConfig(config: SourceConfig): QuranConfig {
  const text = (c: TextSourceConfig): TextProvider =>
    c.type === "equran"
      ? createEquranTextProvider({ baseUrl: c.baseUrl })
      : c.type === "quranenc"
        ? createQuranEncTextProvider({ baseUrl: c.baseUrl, editions: c.editions })
        : c.type === "quran-foundation"
          ? createQuranFoundationTextProvider({ baseUrl: c.baseUrl, editions: c.editions })
          : createFawazTextProvider({ baseUrl: c.baseUrl, editions: c.editions });
  const audio = (c: AudioSourceConfig): AudioProvider =>
    c.type === "islamic-network"
      ? createIslamicNetworkAudioProvider({ baseUrl: c.baseUrl })
      : createEquranAudioProvider({ audioBaseUrl: c.baseUrl });

  return {
    textProviders: config.textProviders.map(text),
    audioProviders: config.audioProviders.map(audio),
    defaults: config.defaults,
    localeDefaults: config.localeDefaults,
  };
}

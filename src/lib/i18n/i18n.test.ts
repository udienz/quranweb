import { describe, expect, it } from "vitest";
import { COMMUNITY_LOCALES, DEFAULT_LOCALE, isCommunityLocale, isLocale, LOCALES, negotiateLocale, reportTranslationUrl } from "./config";
import { MESSAGES } from "./messages";
import { createTranslator, format, localized, type Plural } from "./translate";

describe("negotiateLocale", () => {
  it("an explicit cookie wins over the browser", () => {
    expect(negotiateLocale("en", "id-ID,id;q=0.9")).toBe("en");
    expect(negotiateLocale("id", "en-US,en;q=0.9")).toBe("id");
  });

  it("uses the first supported language the browser lists", () => {
    expect(negotiateLocale(undefined, "en-US,en;q=0.9,id;q=0.8")).toBe("en");
    expect(negotiateLocale(undefined, "fr-FR,id;q=0.8,en;q=0.5")).toBe("id");
    expect(negotiateLocale(undefined, "EN-gb")).toBe("en");
  });

  it("falls back to the default for an unknown cookie, an unsupported language or no header", () => {
    expect(negotiateLocale("fr", "de-DE,fr;q=0.9")).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale(undefined, null)).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale("", "")).toBe(DEFAULT_LOCALE);
  });

  it("isLocale only accepts supported codes", () => {
    expect(LOCALES.every(isLocale)).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("format and localized", () => {
  it("replaces known placeholders and leaves unknown ones", () => {
    expect(format("{a} and {b}", { a: 1 })).toBe("1 and {b}");
    expect(format("no placeholders")).toBe("no placeholders");
  });

  it("localized falls back to English, then to any language", () => {
    expect(localized({ en: "Hello", id: "Halo" }, "id")).toBe("Halo");
    expect(localized({ en: "Hello" }, "id")).toBe("Hello");
    expect(localized({ id: "Halo" }, "en")).toBe("Halo");
    expect(localized({}, "en")).toBe("");
  });
});

describe("translator", () => {
  it("translates, interpolates and picks plural forms per language", () => {
    const en = createTranslator("en", MESSAGES.en);
    const id = createTranslator("id", MESSAGES.id);
    expect(en.t("home.start")).toBe("Start with Al-Fatihah");
    expect(id.t("home.start")).toBe("Mulai dari Al-Fatihah");
    expect(en.t("continueReading.position", { surah: "Al-Baqarah", verse: 40 })).toBe("Al-Baqarah, verse 40");
    expect(id.t("continueReading.position", { surah: "Al-Baqarah", verse: 40 })).toBe("Al-Baqarah, ayat 40");
    expect(en.tn("common.verses", 1)).toBe("1 verse");
    expect(en.tn("common.verses", 7)).toBe("7 verses");
    expect(id.tn("common.verses", 1)).toBe("1 ayat");
    expect(id.tn("common.verses", 286)).toBe("286 ayat");
  });

  it("formats dates in the language", () => {
    const iso = "2026-11-17T09:30:00.000Z";
    expect(createTranslator("en", MESSAGES.en).date(iso, { month: "long", timeZone: "UTC" })).toBe("November");
    expect(createTranslator("id", MESSAGES.id).date(iso, { month: "long", timeZone: "UTC" })).toBe("November");
    expect(createTranslator("id", MESSAGES.id).date("2026-12-17T09:30:00.000Z", { month: "long", timeZone: "UTC" })).toBe("Desember");
  });

  it("throws for a missing message instead of showing a blank", () => {
    const tr = createTranslator("en", MESSAGES.en);
    // @ts-expect-error the key does not exist on purpose
    expect(() => tr.t("does.not.exist")).toThrow(/Missing message/);
  });
});

/** Every dotted path to a leaf (string or plural) in a catalog. */
function leaves(node: unknown, prefix = ""): Map<string, "string" | "plural"> {
  const out = new Map<string, "string" | "plural">();
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, "string");
    else if (typeof (value as Plural).other === "string") out.set(path, "plural");
    else for (const [p, kind] of leaves(value, path)) out.set(p, kind);
  }
  return out;
}

describe("message catalogs", () => {
  it("every language has exactly the same keys, of the same kind, as English", () => {
    const english = leaves(MESSAGES.en);
    for (const locale of LOCALES) {
      expect([...leaves(MESSAGES[locale])].sort(), locale).toEqual([...english].sort());
    }
  });

  it("no message is empty, and placeholders match between languages", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    const read = (messages: object, path: string): string[] => {
      const node = path.split(".").reduce<unknown>((n, p) => (n as Record<string, unknown>)[p], messages);
      return typeof node === "string" ? [node] : Object.values(node as Plural).filter((v): v is string => typeof v === "string");
    };
    for (const [path] of leaves(MESSAGES.en)) {
      for (const locale of LOCALES) {
        for (const text of read(MESSAGES[locale], path)) expect(text.trim(), `${locale}:${path}`).not.toBe("");
      }
      // The plural `{count}` is optional in a language whose forms do not repeat it.
      const strip = (s: string) => placeholders(s).replace("{count}", "").replace(/^,|,$/g, "");
      const reference = strip(read(MESSAGES.en, path).at(-1)!);
      for (const locale of LOCALES) {
        expect(strip(read(MESSAGES[locale], path).at(-1)!), `${locale}:${path}`).toBe(reference);
      }
    }
  });
});

describe("community translations", () => {
  it("names the languages not yet reviewed by a second speaker", () => {
    expect(COMMUNITY_LOCALES).toContain("tr");
    expect(isCommunityLocale("tr")).toBe(true);
    expect(isCommunityLocale("id")).toBe(false);
    expect(isCommunityLocale("en")).toBe(false); // the source language, and Indonesian, are maintained by the owner
  });

  it("does not mark a language that is not in the list, whatever the browser asks for", () => {
    for (const code of LOCALES) expect(isCommunityLocale(code)).toBe(COMMUNITY_LOCALES.includes(code));
  });

  it("builds a link that opens a new issue with the language in the title, and escapes it", () => {
    const url = new URL(reportTranslationUrl("tr"));
    expect(url.origin + url.pathname).toBe("https://github.com/udienz/quranweb/issues/new");
    expect(url.searchParams.get("title")).toBe("Translation mistake (tr): ");
    expect(url.searchParams.get("body")).toContain("Language: tr");
    const hostile = new URL(reportTranslationUrl("x&labels=bug#"));
    expect(hostile.searchParams.get("labels")).toBeNull();
    expect(hostile.hash).toBe("");
  });
});

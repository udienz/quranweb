import { describe, expect, it } from "vitest";
import { groupTranslations, initialTranslationLanguage } from "./translation-groups";
import type { Edition } from "./types";

const source = { name: "Test", attribution: { en: "Test" } };
const edition = (id: string, language: string): Edition => ({ id, kind: "translation", language, direction: "ltr", name: { en: id }, author: "x", source });
const NAMES: Record<string, string> = { ar: "Arabic", en: "English", id: "Indonesian", tr: "Turkish", de: "German" };
const nameOf = (code: string) => NAMES[code] ?? code;

const EDITIONS = [edition("eng-a", "en"), edition("ind-a", "id"), edition("tur-a", "tr"), edition("eng-b", "en"), edition("deu-a", "de")];

describe("groupTranslations", () => {
  it("groups by language, keeping the catalog order inside a group", () => {
    const groups = groupTranslations(EDITIONS, "id", nameOf);
    expect(groups.find((g) => g.language === "en")?.editions.map((e) => e.id)).toEqual(["eng-a", "eng-b"]);
    expect(groups.map((g) => g.editions.length).reduce((a, b) => a + b, 0)).toBe(5);
  });

  it("puts the language of the interface first and the others by name", () => {
    expect(groupTranslations(EDITIONS, "id", nameOf).map((g) => g.language)).toEqual(["id", "en", "de", "tr"].sort((a, b) => (a === "id" ? -1 : b === "id" ? 1 : nameOf(a).localeCompare(nameOf(b)))));
    expect(groupTranslations(EDITIONS, "tr", nameOf)[0].language).toBe("tr");
    expect(groupTranslations(EDITIONS, "fr", nameOf).map((g) => g.label)).toEqual(["English", "German", "Indonesian", "Turkish"].sort());
  });

  it("is empty when there are no translations", () => {
    expect(groupTranslations([], "id", nameOf)).toEqual([]);
  });
});

describe("initialTranslationLanguage", () => {
  const groups = groupTranslations(EDITIONS, "id", nameOf);

  it("is the language of the first translation chosen", () => {
    expect(initialTranslationLanguage(groups, ["tur-a", "eng-a"], "id")).toBe("tr");
    expect(initialTranslationLanguage(groups, ["eng-b"], "id")).toBe("en");
  });

  it("falls back to the interface language, then to the first group", () => {
    expect(initialTranslationLanguage(groups, [], "tr")).toBe("tr");
    expect(initialTranslationLanguage(groups, ["not-there"], "id")).toBe("id");
    expect(initialTranslationLanguage(groups, [], "fr")).toBe(groups[0].language);
    expect(initialTranslationLanguage([], [], "id")).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { LOCALES } from "../i18n/config";
import { completeEditions, languageIn } from "./edition-names";
import type { Edition } from "./types";

const edition: Edition = {
  id: "spa-test",
  kind: "translation",
  language: "es",
  direction: "ltr",
  name: { en: "Spanish translation by Someone", id: "Terjemahan Spanyol oleh Someone" },
  author: "Someone",
  source: { name: "Test", url: "https://example.test", attribution: { en: "Someone, via Test" } },
};

describe("completeEditions", () => {
  it("keeps the written names and fills every other interface language from the author and the language", () => {
    const [e] = completeEditions([edition]);
    expect(e.name.en).toBe("Spanish translation by Someone");
    expect(e.name.id).toBe("Terjemahan Spanyol oleh Someone");
    expect(e.name.es).toBe("Someone (español)");
    expect(e.name.zh).toBe(`Someone (${languageIn("es", "zh")})`);
    for (const ui of LOCALES) {
      expect(e.name[ui], ui).toBeTruthy();
      expect(e.source.attribution[ui], ui).toBeTruthy();
    }
    expect(e.source.attribution.th).toBe("Someone, via Test");
    expect(e.name.uz).toBe("Someone (испанча)"); // Uzbek in Cyrillic, like its translations
  });

  it("does not change the edition it was given", () => {
    completeEditions([edition]);
    expect(edition.name.es).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { languageNamer } from "./languages";

const t = (key: string) => `[${key}]`;

describe("languageNamer", () => {
  it("uses the words of the message catalog for the languages it has", () => {
    const name = languageNamer(t as never, "id");
    expect(name("en")).toBe("[settings.languages.en]");
    expect(name("tr")).toBe("[settings.languages.tr]");
  });

  it("asks the platform for any other language, in the language of the interface", () => {
    expect(languageNamer(t as never, "en")("de")).toBe("German");
    expect(languageNamer(t as never, "en")("fa")).toBe("Persian");
    expect(languageNamer(t as never, "id")("de")).toMatch(/Jerman/i);
  });

  it("falls back to the code in capitals for something that is not a language", () => {
    expect(languageNamer(t as never, "en")("zz-invalid-code-!")).toBe("ZZ-INVALID-CODE-!");
  });
});

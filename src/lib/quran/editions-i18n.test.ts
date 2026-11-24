import { describe, expect, it } from "vitest";
import { LOCALES } from "../i18n/config";
import { EQURAN_EDITIONS } from "./providers/equran";
import { FAWAZ_EDITIONS } from "./providers/fawazahmed0";
import { QURANENC_EDITIONS } from "./providers/quranenc";
import { QURAN_FOUNDATION_EDITIONS } from "./providers/quran-foundation";

// Adding an interface language means naming every edition and credit in it (CLAUDE.md, "Adding a language"); without this
// the About page and the edition lists would fall back to English in that language.
describe("edition names and credits in every interface language", () => {
  const editions = [...EQURAN_EDITIONS, ...FAWAZ_EDITIONS, ...QURANENC_EDITIONS, ...QURAN_FOUNDATION_EDITIONS];

  it("has a name and a credit for every edition in every language", () => {
    for (const e of editions) {
      for (const locale of LOCALES) {
        expect(e.name[locale], `${e.id} name ${locale}`).toBeTruthy();
        expect(e.source.attribution[locale], `${e.id} credit ${locale}`).toBeTruthy();
      }
    }
  });
});

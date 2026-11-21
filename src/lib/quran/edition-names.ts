// With seventeen interface languages, writing every edition's name and credit out by hand in each of them no longer scales.
// An edition keeps the names written for it; for any other interface language its name becomes "who (language)", with the
// language named by the platform (Intl.DisplayNames: "Isa Garcia (español)", "Yusuf Ali (英语)"), and its credit, which is
// mostly proper names, stays the English one.

import { LOCALES } from "../i18n/config";
import type { Edition } from "./types";

// Interface languages written in another script than the platform's default for their code: Uzbek is Cyrillic here, like
// every Uzbek translation in our sources.
const SCRIPT_TAG: Record<string, string> = { uz: "uz-Cyrl" };

/** The name of a language in another language, as the platform knows it; the code itself if it does not. */
export function languageIn(code: string, ui: string): string {
  try {
    return new Intl.DisplayNames([SCRIPT_TAG[ui] ?? ui], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The editions with a name and a credit in every interface language (written ones are kept as they are). */
export function completeEditions(list: Edition[]): Edition[] {
  return list.map((e) => {
    const name = { ...e.name };
    const attribution = { ...e.source.attribution };
    const who = e.author ?? e.name.en;
    for (const ui of LOCALES) {
      name[ui] ??= `${who} (${languageIn(e.language, ui)})`;
      attribution[ui] ??= e.source.attribution.en;
    }
    return { ...e, name, source: { ...e.source, attribution } };
  });
}

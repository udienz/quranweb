// The name of a language (an ISO code such as "tr") in the interface language, for the lists of translations and credits.

import type { StringKey } from "./messages";

/** The languages whose names are in the message catalogs (so a translator can choose the words). */
const CATALOG_NAMES: Record<string, StringKey> = {
  ar: "settings.languages.ar",
  id: "settings.languages.id",
  en: "settings.languages.en",
  tr: "settings.languages.tr",
};

/**
 * A function that names a language code: the catalogs' word when we have one, otherwise the platform's own name for it
 * (`Intl.DisplayNames`, so a new language of translations needs no new message), otherwise the code in capitals.
 */
export function languageNamer(t: (key: StringKey) => string, locale: string): (code: string) => string {
  return (code) => {
    const key = CATALOG_NAMES[code];
    if (key) return t(key);
    try {
      return new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code.toUpperCase();
    } catch {
      return code.toUpperCase();
    }
  };
}

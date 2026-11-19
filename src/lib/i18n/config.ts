// Supported UI languages. Quran content (editions) has its own languages and is
// chosen separately; this only controls the interface.

export const LOCALES = ["en", "id", "tr"] as const;
export type Locale = (typeof LOCALES)[number];

/** Used when neither the cookie nor the browser says anything usable. */
export const DEFAULT_LOCALE: Locale = "id";

export const LOCALE_COOKIE = "qw-lang";

export const LOCALE_NAMES: Record<Locale, string> = { en: "English", id: "Bahasa Indonesia", tr: "Türkçe" };

/**
 * Languages published as a **community translation**: translated by a reader and not yet reviewed by a second speaker
 * of the language, as CONTRIBUTING.md asks. The language menu marks them and offers a link to report a mistake. Remove a
 * language from this list once a second speaker has reviewed it and a language maintainer is in .github/CODEOWNERS.
 * It may name a language before it exists in LOCALES (the label then appears with the language).
 */
export const COMMUNITY_LOCALES: readonly string[] = ["tr"];

export const isCommunityLocale = (code: string): boolean => COMMUNITY_LOCALES.includes(code);

/**
 * The page to report a mistake in a community translation: a new GitHub issue from the "Translation mistake" form
 * (`.github/ISSUE_TEMPLATE/translation_mistake.yml`), with the language already filled in and in the title.
 */
export const reportTranslationUrl = (code: string): string =>
  `https://github.com/udienz/quranweb/issues/new?template=translation_mistake.yml&title=${encodeURIComponent(
    `Translation mistake (${code}): `,
  )}&language=${encodeURIComponent(code)}`;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Pick the interface language: an explicit cookie wins, then the first supported
 * language in the browser's Accept-Language header (in the order the browser listed
 * them), then the default.
 */
export function negotiateLocale(cookie: string | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isLocale(cookie)) return cookie;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const primary = part.split(";")[0].trim().toLowerCase().split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

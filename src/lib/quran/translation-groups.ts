// The translations of the Qur'an grouped by the language they are in, for the language list of the settings.

import type { Edition } from "./types";

export interface TranslationGroup {
  /** The language code of the editions (`id`, `en`, `tr`, ...). */
  language: string;
  /** Its name in the interface language. */
  label: string;
  editions: Edition[];
}

/**
 * The languages that have a translation, the one of the interface first and the others by name, each with its editions in the
 * order of the catalog.
 */
export function groupTranslations(editions: Edition[], interfaceLanguage: string, nameOf: (code: string) => string): TranslationGroup[] {
  const byLanguage = new Map<string, Edition[]>();
  for (const edition of editions) byLanguage.set(edition.language, [...(byLanguage.get(edition.language) ?? []), edition]);
  const groups = [...byLanguage].map(([language, list]) => ({ language, label: nameOf(language), editions: list }));
  return groups.sort((a, b) => {
    if (a.language === interfaceLanguage) return -1;
    if (b.language === interfaceLanguage) return 1;
    return a.label.localeCompare(b.label, interfaceLanguage);
  });
}

/** The language to show first: that of the first selected translation, else the interface language, else the first group. */
export function initialTranslationLanguage(groups: TranslationGroup[], selected: string[], interfaceLanguage: string): string | undefined {
  for (const id of selected) {
    const group = groups.find((g) => g.editions.some((e) => e.id === id));
    if (group) return group.language;
  }
  return (groups.find((g) => g.language === interfaceLanguage) ?? groups[0])?.language;
}

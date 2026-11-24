// The order of the reciter list: the best known first (a judgement, kept here so it is easy to change), then the others by
// name. And the search: by the name in Latin or Arabic letters, without regard to case or diacritics.

import type { Qari } from "./types";

/** The best known reciters, in this order. IDs that are not in the catalog are skipped. */
export const BEST_KNOWN_RECITERS = [
  "misyari-rasyid-al-afasi",
  "abdurrahman-as-sudais",
  "abdul-basit-abdus-samad",
  "mahmoud-khalil-al-husary",
  "maher-al-muaiqly",
  "saud-ash-shuraim",
  "muhammad-siddiq-al-minshawi-mujawwad",
  "abu-bakr-ash-shatri",
  "ahmed-al-ajamy",
  "yasser-al-dosari",
  "ali-al-hudhaify",
  "muhammad-ayyub",
];

/** The reciters in three groups: the best known, the others by name, and (last) those with whole surahs only, by name. */
export function orderReciters(qaris: Qari[]): { bestKnown: Qari[]; others: Qari[]; surahOnly: Qari[] } {
  const byId = new Map(qaris.map((q) => [q.id, q]));
  const bestKnown = BEST_KNOWN_RECITERS.map((id) => byId.get(id)).filter((q): q is Qari => !!q && !q.wholeSurahOnly);
  const byName = (a: Qari, b: Qari) => a.name.localeCompare(b.name, "en");
  const rest = qaris.filter((q) => !bestKnown.includes(q));
  return {
    bestKnown,
    others: rest.filter((q) => !q.wholeSurahOnly).sort(byName),
    surahOnly: rest.filter((q) => q.wholeSurahOnly).sort(byName),
  };
}

/** Lower case, without diacritics (Latin and Arabic) and without hyphens, apostrophes or extra spaces. */
export function foldName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟۖ-ۭ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .toLowerCase()
    .replace(/[-'’`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether a reciter matches a search: every word of it appears in the Latin or Arabic name. */
export function matchesReciter(qari: Qari, query: string): boolean {
  const words = foldName(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const names = [foldName(qari.name), foldName(qari.arabicName ?? "")];
  // Also without spaces, so "alhusary" finds "Al-Husary" and "abdulbasit" finds "Abdul Basit".
  const haystack = [...names, ...names.map((x) => x.replace(/ /g, ""))].join(" ");
  return words.every((w) => haystack.includes(w));
}

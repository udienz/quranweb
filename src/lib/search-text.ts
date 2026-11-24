// Matching typed text against a label, for the searchable lists: case, accents and the marks of Arabic letters do not matter.

/** Lower case, with combining marks removed (é → e, and the vowel marks of Arabic words). */
export function foldText(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("und");
}

/** Whether every word of the query is found in the text, in any order. An empty query matches everything. */
export function matchesQuery(text: string, query: string): boolean {
  const haystack = foldText(text);
  return foldText(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

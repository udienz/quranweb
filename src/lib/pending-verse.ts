// The verse a link that was just clicked points to, kept across a client-side navigation: with the pages of the mushaf chosen the server
// sends the reader to the mushaf page and the `#verse-255` part of the address is lost on the way, so the page that arrives asks for it.

import { verseOfLink } from "./anchors";

let pending: { surah: number; verse: number } | null = null;

/** Remember the verse a clicked link points to (or forget it, when the link is not one to a verse). */
export function rememberClickedLink(href: string | null): void {
  pending = href ? verseOfLink(href) : null;
}

/** The remembered verse, once: it is cleared when taken. */
export function takePendingVerse(): { surah: number; verse: number } | null {
  const verse = pending;
  pending = null;
  return verse;
}

// What a shared verse says: its text, how it is cited and the address, and the links the share menu opens. Pure functions.

import { versePageHref } from "./anchors";

/**
 * How a verse is cited. Indonesian readers write "QS. Al-Baqarah: 255"; every other interface uses the English form
 * "Qur'an 2:255 (Al-Baqarah)" (the owner's default, 2026-11-22: a language gets its own form when someone who reads it asks).
 * A citation is a name and numbers, like a book's, so it is not in the message catalogs.
 */
export function shareReference(locale: string, surahName: string, surah: number, verse: number): string {
  return locale === "id" ? `QS. ${surahName}: ${verse}` : `Qur'an ${surah}:${verse} (${surahName})`;
}

/** The text to copy or send: the Arabic and every translation shown, as published, then the citation and the address. */
export function shareText(input: { arabic: string; translations: string[]; reference: string; url: string }): string {
  const { arabic, translations, reference, url } = input;
  return [arabic, ...translations, `(${reference})`, url].join("\n\n");
}

/** The address of the verse's page on this site. */
export const shareUrl = (origin: string, surah: number, verse: number): string => `${origin}${versePageHref(surah, verse)}`;

/** WhatsApp's link that opens a chat with the text ready to send (the text is encoded, Arabic included). */
export const whatsappHref = (text: string): string => `https://wa.me/?text=${encodeURIComponent(text)}`;

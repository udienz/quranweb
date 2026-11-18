// One <audio> element for the whole visit, shared by every surah page. A new element is not allowed to start playing
// by itself on iPhones and in Safari (only an element that a tap already started is), so the reader reuses this one
// when playback carries on in the next surah: the page component is replaced, the element is not. Browser only: call
// it from effects and event handlers.

import { verseHref } from "./anchors";

let shared: HTMLAudioElement | null = null;

export function getAudio(): HTMLAudioElement {
  if (!shared) {
    shared = new Audio();
    shared.preload = "none";
  }
  return shared;
}

/** The verse that playback is heading for once its page has arrived (the next page, or the next or the same surah). */
export interface PendingStart {
  surah: number;
  verse: number;
}
let pending: PendingStart | null = null;

export const setPendingStart = (start: PendingStart | null): void => {
  pending = start;
};

/**
 * Take the pending start if its verse is on the page that has arrived (verses `from` to `to` of this surah): the verse is
 * returned and the start cleared. Otherwise null, and the start stays for the page it is heading for. The verse is not
 * always the first of the page: a juz can start in the middle of one.
 */
export function takePendingStart(surah: number, from: number, to: number): number | null {
  if (pending && pending.surah === surah && pending.verse >= from && pending.verse <= to) {
    const verse = pending.verse;
    pending = null;
    return verse;
  }
  return null;
}

/**
 * Start playing a juz from a page that has no reader (the settings page): remember the juz and the verse to begin with, and
 * return the address of that verse; the reader that opens there starts it, like when it carries on to a next surah.
 */
export function beginJuz(juz: number, start: PendingStart): string {
  setJuzScope(juz);
  setPendingStart(start);
  return verseHref(start.surah, start.verse);
}

// The juz being played, if the reader asked for one: playback then continues across surahs up to the last verse of that
// juz instead of stopping at the end of a surah. Module state, like the pending start, so it survives a client-side
// navigation; a store, so the page can show it.
let juzScope: number | null = null;
const juzListeners = new Set<() => void>();

export const getJuzScope = (): number | null => juzScope;

export function setJuzScope(juz: number | null): void {
  if (juz === juzScope) return;
  juzScope = juz;
  juzListeners.forEach((listener) => listener());
}

export function subscribeJuzScope(listener: () => void): () => void {
  juzListeners.add(listener);
  return () => juzListeners.delete(listener);
}

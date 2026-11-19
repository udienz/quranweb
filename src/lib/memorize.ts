// Memorization, step 1: hear each verse several times, and loop a range of verses of one surah. No React and no
// "use client": the pure rules are shared with tests. Both are browser-only for now (not recorded in the account).

export const VERSE_REPEATS = [1, 2, 3, 5, 10] as const;
export type VerseRepeat = (typeof VERSE_REPEATS)[number];
export const DEFAULT_VERSE_REPEAT: VerseRepeat = 1;
export const isVerseRepeat = (value: unknown): value is VerseRepeat => (VERSE_REPEATS as readonly unknown[]).includes(value);

/** How many times a range is played: a number, or 0 for "until stopped". */
export const RANGE_TIMES = [2, 3, 5, 10, 0] as const;

/** A range of verses being looped: verses `from` to `to` of `surah`, `times` rounds (0 = until stopped), `round` = the one playing (from 1). */
export interface RangeLoop {
  surah: number;
  from: number;
  to: number;
  times: number;
  round: number;
}

/** A range as the reader chose it, put in order and inside the surah; null when it cannot be one. */
export function makeRange(surah: number, verseCount: number, a: number, b: number, times: number): RangeLoop | null {
  if (![a, b, times].every(Number.isInteger) || times < 0) return null;
  const from = Math.min(a, b);
  const to = Math.max(a, b);
  if (from < 1 || to > verseCount) return null;
  return { surah, from, to, times, round: 1 };
}

/**
 * What happens when a verse has ended (with all its repeats) while a range is looped: nothing special (`continue`, the
 * normal next verse), the range again from its first verse (`again`, with the next round), or the end (`stop`).
 */
export type RangeStep = { kind: "continue" } | { kind: "again"; loop: RangeLoop } | { kind: "stop" };

export function rangeStep(loop: RangeLoop, surah: number, verse: number): RangeStep {
  if (surah !== loop.surah || verse !== loop.to) return { kind: "continue" };
  if (loop.times !== 0 && loop.round >= loop.times) return { kind: "stop" };
  return { kind: "again", loop: { ...loop, round: loop.round + 1 } };
}

// The range being looped lives in module state, like the juz being played: it survives moving to another page of the
// surah (a range can cross a page boundary), and components follow it with useSyncExternalStore.
let current: RangeLoop | null = null;
const listeners = new Set<() => void>();
export const getRangeLoop = (): RangeLoop | null => current;
export function setRangeLoop(loop: RangeLoop | null): void {
  current = loop;
  listeners.forEach((l) => l());
}
export function subscribeRangeLoop(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Browser side: how many times each verse is played, kept in this browser. Every storage access is guarded.
export const VERSE_REPEAT_KEY = "quranweb:verse-repeat";
const REPEAT_EVENT = "quranweb:verse-repeat";

export function readVerseRepeat(): VerseRepeat {
  try {
    const value = Number(localStorage.getItem(VERSE_REPEAT_KEY));
    return isVerseRepeat(value) ? value : DEFAULT_VERSE_REPEAT;
  } catch {
    return DEFAULT_VERSE_REPEAT;
  }
}

export function applyVerseRepeat(times: VerseRepeat): void {
  try {
    localStorage.setItem(VERSE_REPEAT_KEY, String(times));
  } catch {}
  window.dispatchEvent(new Event(REPEAT_EVENT));
}

export function subscribeVerseRepeat(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === VERSE_REPEAT_KEY) callback();
  };
  window.addEventListener(REPEAT_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(REPEAT_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

// Hiding text while memorizing (step 2): the Arabic, or the translation and transliteration, are blurred until the reader
// taps a verse to check it. The mode is kept in this browser; which verses are shown is module state, cleared when the
// mode changes (and not kept across visits: it is a check, not a setting).
export const HIDE_MODES = ["none", "arabic", "translation"] as const;
export type HideMode = (typeof HIDE_MODES)[number];
export const DEFAULT_HIDE_MODE: HideMode = "none";
export const isHideMode = (value: unknown): value is HideMode => (HIDE_MODES as readonly unknown[]).includes(value);
export const HIDE_MODE_KEY = "quranweb:memorize-hide";
const HIDE_EVENT = "quranweb:memorize-hide";

export function readHideMode(): HideMode {
  try {
    const value = localStorage.getItem(HIDE_MODE_KEY);
    return isHideMode(value) ? value : DEFAULT_HIDE_MODE;
  } catch {
    return DEFAULT_HIDE_MODE;
  }
}

let shown = new Set<string>();
const verseKey = (surah: number, verse: number) => `${surah}:${verse}`;

export function applyHideMode(mode: HideMode): void {
  try {
    localStorage.setItem(HIDE_MODE_KEY, mode);
  } catch {}
  shown = new Set();
  window.dispatchEvent(new Event(HIDE_EVENT));
}

/** Show a hidden verse, or hide it again. */
export function toggleShown(surah: number, verse: number): void {
  const key = verseKey(surah, verse);
  shown = new Set(shown);
  if (shown.has(key)) shown.delete(key);
  else shown.add(key);
  window.dispatchEvent(new Event(HIDE_EVENT));
}

export const isShown = (set: ReadonlySet<string>, surah: number, verse: number) => set.has(verseKey(surah, verse));
export const getShown = (): ReadonlySet<string> => shown;

export function subscribeHiding(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === HIDE_MODE_KEY) callback();
  };
  window.addEventListener(HIDE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(HIDE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

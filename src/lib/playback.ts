// What happens when the audio reaches the end of a surah: stop (the original behaviour), repeat the surah from verse 1,
// or carry on with the next surah. Kept in local storage, and recorded in the user data as a choice so it follows a
// signed-in reader's account. No React and no "use client": the constants are shared with server code and tests.

import { rangeStep, type RangeLoop } from "./memorize";
import type { JuzRef } from "./quran/types";
import type { Choices } from "./userdata/schema";

export const PLAYBACK_MODES = ["stop", "repeat", "next"] as const;
export type PlaybackMode = (typeof PLAYBACK_MODES)[number];
export const DEFAULT_PLAYBACK_MODE: PlaybackMode = "stop";
export const isPlaybackMode = (value: unknown): value is PlaybackMode =>
  typeof value === "string" && (PLAYBACK_MODES as readonly string[]).includes(value);

export const PLAYBACK_MODE_KEY = "quranweb:playback-mode";
/** Window event fired when this tab changes the mode, so controls can update. */
export const PLAYBACK_EVENT = "quranweb:playback";

/** Where playback goes when the last verse of the surah has ended. */
export type AfterSurah = { kind: "stop" } | { kind: "start"; surah: number; verse: number };

/** Decide what follows the last verse of `surah`. The Qur'an has 114 surahs, and the last one does not wrap around. */
export function afterSurah(mode: PlaybackMode, surah: number): AfterSurah {
  if (mode === "repeat") return { kind: "start", surah, verse: 1 };
  if (mode === "next" && surah < 114) return { kind: "start", surah: surah + 1, verse: 1 };
  return { kind: "stop" };
}

/**
 * What follows the last verse of a juz that is being played: nothing (stop), the same juz again (repeat), or the next juz
 * (next; after juz 30 it stops, like the surahs do not wrap round).
 */
export type AfterJuz = { kind: "stop" } | { kind: "start"; juz: number };

export function afterJuz(mode: PlaybackMode, juz: number, juzCount = 30): AfterJuz {
  if (mode === "repeat") return { kind: "start", juz };
  if (mode === "next" && juz < juzCount) return { kind: "start", juz: juz + 1 };
  return { kind: "stop" };
}

/** What the player does when a verse has ended (see `afterVerseEnds`). */
export type EndAction =
  /** The same verse once more (memorization: "play each verse N times"). */
  | { kind: "repeat" }
  /** The last round of a range loop is over. */
  | { kind: "loopEnd" }
  /** The next round of a range loop: from its first verse again. */
  | { kind: "loopAgain"; loop: RangeLoop; surah: number; verse: number }
  /** The last verse of the juz that is being played; another juz (or the same) starts. */
  | { kind: "juzNext"; juz: JuzRef }
  /** The last verse of the juz that is being played; nothing follows. */
  | { kind: "juzEnd" }
  /** The next verse is on this page. */
  | { kind: "nextOnPage" }
  /** The last verse of the page, and the surah goes on: the next page has the verse. */
  | { kind: "nextPage"; surah: number; verse: number }
  /** The end of a surah in the middle of a juz: the juz goes on at the first verse of the next surah. */
  | { kind: "goTo"; surah: number; verse: number }
  /** The end of a surah: what the reader chose (repeat or next) starts at this verse. */
  | { kind: "startAt"; surah: number; verse: number }
  /** The end: nothing follows. */
  | { kind: "stop" };

/**
 * What follows a verse that has ended, in this order of precedence: the same verse again (memorization), the next round of a
 * range loop, the end of the juz that is being played, the next verse of the page, the next page of the surah, the next surah
 * in the middle of a juz, and last the reader's choice at the end of a surah. `lastOnPage` says the verse is the last one the
 * page shows (a page of 10 verses, or of the mushaf, which may end in the middle of a surah or hold the end of one).
 */
export function afterVerseEnds(state: {
  verse: { surah: number; verse: number; lastOnPage: boolean };
  /** How many verses the surah of the verse has. */
  verseCount: number;
  repeatsLeft: number;
  loop: RangeLoop | null;
  juzScope: number | null;
  juzs: readonly JuzRef[];
  mode: PlaybackMode;
}): EndAction {
  const { verse, verseCount, repeatsLeft, loop, juzScope, juzs, mode } = state;
  if (repeatsLeft > 0) return { kind: "repeat" };

  if (loop) {
    const step = rangeStep(loop, verse.surah, verse.verse);
    if (step.kind === "stop") return { kind: "loopEnd" };
    if (step.kind === "again") return { kind: "loopAgain", loop: step.loop, surah: loop.surah, verse: loop.from };
  }

  const juz = juzScope === null ? undefined : juzs.find((j) => j.juz === juzScope);
  if (juz && verse.surah === juz.end.surah && verse.verse === juz.end.verse) {
    // The last verse of the juz that is being played: what happens is the reader's choice, as at the end of a surah.
    const after = afterJuz(mode, juz.juz, juzs.length);
    const target = after.kind === "start" ? juzs.find((j) => j.juz === after.juz) : undefined;
    return target ? { kind: "juzNext", juz: target } : { kind: "juzEnd" };
  }
  if (!verse.lastOnPage) return { kind: "nextOnPage" };
  if (verse.verse < verseCount) return { kind: "nextPage", surah: verse.surah, verse: verse.verse + 1 };
  if (juz) return { kind: "goTo", surah: verse.surah + 1, verse: 1 };
  const after = afterSurah(mode, verse.surah);
  return after.kind === "stop" ? { kind: "stop" } : { kind: "startAt", surah: after.surah, verse: after.verse };
}

/** The mode from the account when it differs from this browser's, or null. */
export function playbackUpdate(choices: Choices, local: PlaybackMode): PlaybackMode | null {
  const chosen = choices.playbackMode?.value;
  return chosen && chosen !== local ? chosen : null;
}

// Browser side. Every access to storage is guarded: it can be missing or blocked.

export function readPlaybackMode(): PlaybackMode {
  try {
    const value = localStorage.getItem(PLAYBACK_MODE_KEY);
    return isPlaybackMode(value) ? value : DEFAULT_PLAYBACK_MODE;
  } catch {
    return DEFAULT_PLAYBACK_MODE;
  }
}

/** Store the mode in this browser and tell the controls. */
export function applyPlaybackMode(mode: PlaybackMode): void {
  try {
    localStorage.setItem(PLAYBACK_MODE_KEY, mode);
  } catch {}
  window.dispatchEvent(new Event(PLAYBACK_EVENT));
}

/** Subscribe to mode changes from this tab or another one (for useSyncExternalStore). */
export function subscribePlayback(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === PLAYBACK_MODE_KEY) callback();
  };
  window.addEventListener(PLAYBACK_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PLAYBACK_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

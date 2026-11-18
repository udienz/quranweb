// What happens when the audio reaches the end of a surah: stop (the original behaviour), repeat the surah from verse 1,
// or carry on with the next surah. Kept in local storage, and recorded in the user data as a choice so it follows a
// signed-in reader's account. No React and no "use client": the constants are shared with server code and tests.

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

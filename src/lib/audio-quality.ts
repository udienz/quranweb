// Audio quality: "standard" plays each reciter's usual recording; "saver" plays the smallest file there is (often 64 kbps
// instead of 128, half the data). It belongs to the device and its connection (mobile data or not), so it is kept in this
// browser only and does not follow the account. No React and no "use client": shared with tests.

export const AUDIO_QUALITIES = ["standard", "saver"] as const;
export type AudioQuality = (typeof AUDIO_QUALITIES)[number];
export const DEFAULT_AUDIO_QUALITY: AudioQuality = "standard";
export const isAudioQuality = (value: unknown): value is AudioQuality =>
  typeof value === "string" && (AUDIO_QUALITIES as readonly string[]).includes(value);

export const AUDIO_QUALITY_KEY = "quranweb:audio-quality";
/** Window event fired when this tab changes the quality, so controls can update. */
export const AUDIO_QUALITY_EVENT = "quranweb:audio-quality";

/** The URLs to try for a verse with this quality, preferred first. */
export function audioFor(verse: { audio: string[]; audioSaver?: string[] }, quality: AudioQuality): string[] {
  return quality === "saver" && verse.audioSaver ? verse.audioSaver : verse.audio;
}

// Browser side. Every access to storage is guarded: it can be missing or blocked.

export function readAudioQuality(): AudioQuality {
  try {
    const value = localStorage.getItem(AUDIO_QUALITY_KEY);
    return isAudioQuality(value) ? value : DEFAULT_AUDIO_QUALITY;
  } catch {
    return DEFAULT_AUDIO_QUALITY;
  }
}

/** Store the quality in this browser and tell the controls. */
export function applyAudioQuality(quality: AudioQuality): void {
  try {
    localStorage.setItem(AUDIO_QUALITY_KEY, quality);
  } catch {}
  window.dispatchEvent(new Event(AUDIO_QUALITY_EVENT));
}

/** Subscribe to quality changes from this tab or another one (for useSyncExternalStore). */
export function subscribeAudioQuality(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === AUDIO_QUALITY_KEY) callback();
  };
  window.addEventListener(AUDIO_QUALITY_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUDIO_QUALITY_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

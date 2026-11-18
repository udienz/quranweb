// One <audio> element for the whole visit, shared by every surah page. A new element is not allowed to start playing
// by itself on iPhones and in Safari (only an element that a tap already started is), so the reader reuses this one
// when playback carries on in the next surah: the page component is replaced, the element is not. Browser only: call
// it from effects and event handlers.

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

/** Take the pending start if it is for this verse of this surah (it is then cleared), else leave it. */
export function takePendingStart(surah: number, verse: number | undefined): boolean {
  if (pending && pending.surah === surah && pending.verse === verse) {
    pending = null;
    return true;
  }
  return false;
}

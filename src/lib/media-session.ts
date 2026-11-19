// The phone's lock screen and notification (and media keys on a computer) show what is playing and can pause it or move to
// the previous or next verse: the Media Session API. Browsers without it are left alone. No React here.

export interface NowPlaying {
  surahName: string;
  surah: number;
  verse: number;
  reciter: string;
  site: string;
}

/** What the lock screen shows: "Al-Baqarah 2:255", the reciter, and the site as the album. */
export function mediaMetadata(now: NowPlaying): { title: string; artist: string; album: string } {
  return { title: `${now.surahName} ${now.surah}:${now.verse}`, artist: now.reciter, album: now.site };
}

export interface MediaActions {
  play: () => void;
  pause: () => void;
  previous: () => void;
  next: () => void;
}

const supported = () => typeof navigator !== "undefined" && "mediaSession" in navigator;

/** Show a verse as playing (or paused) and route the lock-screen buttons to `actions`. */
export function showNowPlaying(now: NowPlaying, playing: boolean, actions: MediaActions): void {
  if (!supported()) return;
  const session = navigator.mediaSession;
  session.metadata = new MediaMetadata({
    ...mediaMetadata(now),
    artwork: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  });
  session.playbackState = playing ? "playing" : "paused";
  const set = (action: MediaSessionAction, handler: (() => void) | null) => {
    try {
      session.setActionHandler(action, handler);
    } catch {
      // An action this browser does not know: skip it.
    }
  };
  set("play", actions.play);
  set("pause", actions.pause);
  set("previoustrack", actions.previous);
  set("nexttrack", actions.next);
}

/** Nothing is playing from this page any more. */
export function clearNowPlaying(): void {
  if (!supported()) return;
  const session = navigator.mediaSession;
  session.metadata = null;
  session.playbackState = "none";
  for (const action of ["play", "pause", "previoustrack", "nexttrack"] as MediaSessionAction[]) {
    try {
      session.setActionHandler(action, null);
    } catch {}
  }
}

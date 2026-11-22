"use client";

// Playing a whole surah from one recording, on the shared audio element. There is no verse being recited to follow, so the
// page shows only that the surah plays; what follows its end is the reader's playback mode (stop, repeat, the next surah).

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getAudio, setPendingSurah, takePendingSurah } from "./audio";
import { readPlaybackMode } from "./playback";

export interface WholeSurahOptions {
  /** The recordings of the surahs this page can play, preferred first; a surah that is not here has none for this reciter. */
  urls: Record<number, string[]>;
  /** The address of the page that has a surah, for going on to the next one. */
  hrefFor: (surah: number) => string;
  /** Called before a surah starts, to stop the verse by verse player that shares the audio element. */
  beforeStart: () => void;
}

const absolute = (url: string): string => new URL(url, window.location.href).href;

export function useWholeSurah(options: WholeSurahOptions) {
  const router = useRouter();
  // The surah whose recording is playing now, or null.
  const [current, setCurrent] = useState<number | null>(null);
  const currentRef = useRef<number | null>(null);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  const paused = useRef<number | null>(null);
  const tried = useRef(0);
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  function begin(surah: number) {
    const list = latest.current.urls[surah];
    if (!list?.[0]) return;
    latest.current.beforeStart();
    const audio = getAudio();
    tried.current = 0;
    paused.current = null;
    audio.src = list[0];
    setCurrent(surah);
    audio.play().catch(() => setCurrent((c) => (c === surah ? null : c)));
  }

  function toggle(surah: number) {
    const audio = getAudio();
    if (current === surah) {
      audio.pause();
      paused.current = surah;
      setCurrent(null);
    } else if (paused.current === surah && audio.src === absolute(latest.current.urls[surah]?.[0] ?? "")) {
      latest.current.beforeStart();
      paused.current = null;
      setCurrent(surah);
      audio.play().catch(() => setCurrent((c) => (c === surah ? null : c)));
    } else {
      begin(surah);
    }
  }

  // The page that was heading for has arrived: carry on with the surah that was waiting for it.
  const available = Object.keys(options.urls).map(Number).join(",");
  useEffect(() => {
    const surah = takePendingSurah(available.split(",").filter(Boolean).map(Number));
    // Starting the surah sets the playing mark: that is the point of reacting to the page that has arrived.
    if (surah !== null) begin(surah);
  }, [available]);

  useEffect(() => {
    const audio = getAudio();
    const ended = () => {
      const surah = currentRef.current;
      if (surah === null) return;
      const mode = readPlaybackMode();
      if (mode === "repeat") {
        audio.currentTime = 0;
        audio.play().catch(() => setCurrent(null));
      } else if (mode === "next" && surah < 114) {
        setPendingSurah(surah + 1);
        router.push(latest.current.hrefFor(surah + 1), { scroll: false });
      } else {
        setCurrent(null);
      }
    };
    const failed = () => {
      const surah = currentRef.current;
      if (surah === null) return;
      const next = latest.current.urls[surah]?.[tried.current + 1];
      if (next) {
        tried.current += 1;
        audio.src = next;
        audio.play().catch(() => setCurrent(null));
      } else {
        setCurrent(null);
      }
    };
    // Something else took the audio element (a verse started): the surah is no longer what plays.
    const played = () => {
      const surah = currentRef.current;
      if (surah === null) return;
      if (audio.src !== absolute(latest.current.urls[surah]?.[tried.current] ?? "")) setCurrent(null);
    };
    audio.addEventListener("ended", ended);
    audio.addEventListener("error", failed);
    audio.addEventListener("play", played);
    return () => {
      audio.removeEventListener("ended", ended);
      audio.removeEventListener("error", failed);
      audio.removeEventListener("play", played);
      // Leaving the page stops the audio, as the verse player does; the page of the next surah starts it again.
      if (currentRef.current !== null) audio.pause();
      setCurrent(null);
    };
    // The handlers read the latest values through refs, so they are attached once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { current, toggle };
}

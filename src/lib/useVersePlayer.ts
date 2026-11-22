"use client";

// The audio of a reading page: which verse plays, what follows it, the lock screen and the keyboard. It knows the verses the
// page shows (each with its own surah, so a page of the mushaf, which may hold the end of one surah and the start of the next,
// can use it as well as a page of 10 verses of one surah) and nothing about how they are laid out.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getAudio, getJuzScope, setJuzScope, setPendingStart, takePendingStartAmong } from "./audio";
import { audioFor, readAudioQuality } from "./audio-quality";
import { clearNowPlaying, showNowPlaying } from "./media-session";
import { getRangeLoop, readVerseRepeat, setRangeLoop, type RangeLoop } from "./memorize";
import { afterVerseEnds, readPlaybackMode } from "./playback";
import type { JuzRef } from "./quran/types";

/** A verse of the page, with its audio. */
export interface PlayerVerse {
  surah: number;
  verse: number;
  audio: string[];
  audioSaver?: string[];
}

export interface PlayerOptions {
  /** The verses the page shows, in order. */
  verses: PlayerVerse[];
  /** Where the 30 juz start and end (empty: no juz can be played). */
  juzs: JuzRef[];
  /** How many verses a surah has. */
  verseCount: (surah: number) => number;
  /** The address that shows a verse, with the verse in view: the page that has it. */
  hrefFor: (surah: number, verse: number) => string;
  /** The address of the page that has a verse, without the verse in view (the next page, the first page of a surah). */
  pageHrefFor: (surah: number, verse: number) => string;
  /** The id of the element of a verse on the page, to scroll to it and to tell which one is in view. */
  elementId: (verse: PlayerVerse) => string;
  /** The Latin name of a surah and the reciter, for the lock screen. */
  surahName: (surah: number) => string;
  reciter: string;
  site: string;
}

export interface Playing {
  surah: number;
  verse: number;
}

const same = (a: Playing | null, b: Playing): boolean => a !== null && a.surah === b.surah && a.verse === b.verse;

export function useVersePlayer(options: PlayerOptions) {
  const router = useRouter();
  const { verses } = options;
  const [playing, setPlaying] = useState<Playing | null>(null);
  // Index of the audio URL being tried for the verse that is playing (0 = preferred).
  const audioIndex = useRef(0);
  // The URLs being tried for that verse, in the order of the audio quality chosen when it started.
  const audioUrls = useRef<string[]>([]);
  // How many more times the verse that is playing is played before moving on (memorization: "play each verse N times").
  const repeatsLeft = useRef(0);
  // The verse paused by hand or from the lock screen, so the lock screen's play button can carry on from there.
  const pausedVerse = useRef<Playing | null>(null);
  // Each play() gets a number: when it fails, only the latest one may clear the "playing" mark. Moving on quickly
  // (N, the lock screen's next button, fast clicks) interrupts the previous play() with an AbortError, which used to
  // clear the mark of the verse that had just started.
  const playToken = useRef(0);
  function play(audio: HTMLAudioElement) {
    const token = ++playToken.current;
    audio.play().catch(() => {
      if (playToken.current === token) setPlaying(null);
    });
  }

  const indexOf = (p: Playing): number => verses.findIndex((v) => v.surah === p.surah && v.verse === p.verse);

  function startVerse(index: number) {
    const audio = getAudio();
    const verse = verses[index];
    if (!verse) return;
    const urls = audioFor(verse, readAudioQuality());
    if (!urls[0]) return;
    audioUrls.current = urls;
    audioIndex.current = 0;
    repeatsLeft.current = readVerseRepeat() - 1;
    audio.src = urls[0];
    setPlaying({ surah: verse.surah, verse: verse.verse });
    play(audio);
    document.getElementById(options.elementId(verse))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function togglePlay(index: number) {
    const verse = verses[index];
    if (!verse) return;
    if (same(playing, verse)) {
      getAudio().pause();
      pausedVerse.current = { surah: verse.surah, verse: verse.verse };
      setPlaying(null);
    } else {
      setJuzScope(null); // playing from a verse by hand leaves the juz that was being played
      // and the range being looped, unless the verse is inside it (pausing and playing again keeps the loop).
      const loop = getRangeLoop();
      if (loop && (loop.surah !== verse.surah || verse.verse < loop.from || verse.verse > loop.to)) setRangeLoop(null);
      startVerse(index);
    }
  }

  /** Play from a verse of any surah: here when it is on this page, otherwise on the page that has it. */
  function goTo(surah: number, verse: number) {
    const index = verses.findIndex((v) => v.surah === surah && v.verse === verse);
    if (index >= 0) {
      startVerse(index);
      return;
    }
    setPendingStart({ surah, verse });
    router.push(options.hrefFor(surah, verse), { scroll: false });
  }

  /** Play a whole juz: from its first verse, across pages and surahs, to its last. */
  function playJuz(n: number) {
    const ref = options.juzs.find((j) => j.juz === n);
    if (!ref) return;
    setRangeLoop(null);
    setJuzScope(n);
    goTo(ref.start.surah, ref.start.verse);
  }

  /** Loop a range of verses of a surah: from its first verse, again after its last, as many rounds as chosen. */
  function startRange(loop: RangeLoop) {
    setJuzScope(null);
    setRangeLoop(loop);
    goTo(loop.surah, loop.from);
  }

  function stopRange() {
    setRangeLoop(null);
    getAudio().pause();
    setPlaying(null);
  }

  function onEnded() {
    const idx = playing ? indexOf(playing) : -1;
    const current = idx >= 0 ? verses[idx] : null;
    if (playing === null) return;
    if (!current) {
      setPlaying(null);
      return;
    }
    const action = afterVerseEnds({
      verse: { surah: current.surah, verse: current.verse, lastOnPage: idx === verses.length - 1 },
      verseCount: options.verseCount(current.surah),
      repeatsLeft: repeatsLeft.current,
      loop: getRangeLoop(),
      juzScope: getJuzScope(),
      juzs: options.juzs,
      mode: readPlaybackMode(),
    });
    switch (action.kind) {
      case "repeat": {
        repeatsLeft.current -= 1;
        const audio = getAudio();
        audio.currentTime = 0;
        play(audio);
        return;
      }
      case "loopEnd":
        setRangeLoop(null);
        setPlaying(null);
        return;
      case "loopAgain":
        setRangeLoop(action.loop);
        goTo(action.surah, action.verse);
        return;
      case "juzNext":
        setJuzScope(action.juz.juz);
        goTo(action.juz.start.surah, action.juz.start.verse);
        return;
      case "juzEnd":
        setJuzScope(null);
        setPlaying(null);
        return;
      case "nextOnPage":
        startVerse(idx + 1);
        return;
      case "nextPage":
        // The last verse of the page: continue on the next page. The audio element is shared by every page, so playback is
        // still allowed when the new verses arrive.
        setPendingStart({ surah: action.surah, verse: action.verse });
        router.push(options.pageHrefFor(action.surah, action.verse), { scroll: false });
        return;
      case "goTo":
        // The end of a surah in the middle of a juz: the juz goes on in the next surah, whatever the playback mode says.
        goTo(action.surah, action.verse);
        return;
      case "startAt": {
        // The end of the surah, and the reader chose to repeat it or to go on with the next one.
        const index = verses.findIndex((v) => v.surah === action.surah && v.verse === action.verse);
        if (index >= 0) {
          startVerse(index); // repeating a surah that is a single page
        } else {
          setPendingStart({ surah: action.surah, verse: action.verse });
          router.push(options.pageHrefFor(action.surah, action.verse), { scroll: false });
        }
        return;
      }
      case "stop":
        setPlaying(null);
        return;
    }
  }

  // The page the audio was heading for has arrived (the next page, the first page again, the next surah, or where a juz
  // starts): carry on with the verse it was heading for.
  const first = verses[0];
  useEffect(() => {
    const start = takePendingStartAmong(verses);
    // Starting the verse sets the playing verse: that is the point of reacting to the page that has arrived.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (start !== null) startVerse(start);
    // startVerse only reads the audio element and the current verses, which change with the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first?.surah, first?.verse]);

  function onError() {
    const audio = getAudio();
    const next = playing === null ? undefined : audioUrls.current[audioIndex.current + 1];
    if (next) {
      audioIndex.current += 1;
      audio.src = next;
      play(audio);
    } else {
      setPlaying(null);
    }
  }

  // Lock screen and media keys (Media Session): pause, carry on, and the previous or next verse of the surah.
  function mediaPause() {
    if (playing === null) return;
    pausedVerse.current = playing;
    getAudio().pause();
    setPlaying(null);
  }
  function mediaPlay() {
    const paused = pausedVerse.current;
    if (paused === null || indexOf(paused) < 0) return;
    pausedVerse.current = null;
    setPlaying(paused);
    play(getAudio());
  }
  function mediaStep(delta: -1 | 1) {
    const current = playing ?? pausedVerse.current;
    if (current === null) return;
    pausedVerse.current = null;
    const n = current.verse + delta;
    if (n >= 1 && n <= options.verseCount(current.surah)) goTo(current.surah, n);
    else if (delta === 1 && current.surah < 114) goTo(current.surah + 1, 1);
  }
  const mediaActions = useRef({ mediaPause, mediaPlay, mediaStep });
  useEffect(() => {
    mediaActions.current = { mediaPause, mediaPlay, mediaStep };
  });
  useEffect(() => {
    const shown = playing ?? pausedVerse.current;
    if (shown === null) return;
    showNowPlaying(
      { surahName: options.surahName(shown.surah), surah: shown.surah, verse: shown.verse, reciter: options.reciter, site: options.site },
      playing !== null,
      {
        play: () => mediaActions.current.mediaPlay(),
        pause: () => mediaActions.current.mediaPause(),
        previous: () => mediaActions.current.mediaStep(-1),
        next: () => mediaActions.current.mediaStep(1),
      },
    );
    // surahName is a function of the page; the lock screen only needs to be told again when the verse or the state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, options.reciter, options.site]);
  useEffect(() => clearNowPlaying, []);

  // Keyboard: Space plays or pauses (with nothing playing or paused, the first verse in view starts), N and P move to the
  // next and the previous verse. Ignored while typing in a field and with a modifier key, so browser shortcuts still work.
  function onKey(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
    const key = e.key.toLowerCase();
    // On a focused button or link, Space already activates it (a play button after a click, for example).
    if (key === " " && target?.closest("button, a, [role='button']")) return;
    if (key === " ") {
      e.preventDefault();
      if (playing !== null) mediaPause();
      else if (pausedVerse.current !== null && indexOf(pausedVerse.current) >= 0) mediaPlay();
      else {
        const inView = verses.findIndex((v) => {
          const el = [...document.querySelectorAll<HTMLElement>(`#${options.elementId(v)}`)].find((x) => x.offsetParent !== null);
          return el ? el.getBoundingClientRect().bottom > 0 : false;
        });
        togglePlay(Math.max(0, inView));
      }
    } else if (key === "n" || key === "p") {
      if (playing === null && pausedVerse.current === null) return;
      e.preventDefault();
      mediaStep(key === "n" ? 1 : -1);
    }
  }
  const keyHandler = useRef(onKey);
  useEffect(() => {
    keyHandler.current = onKey;
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // The one audio element reports to whichever page is showing; the handlers are the latest of this render.
  const handlers = useRef({ onEnded, onError });
  useEffect(() => {
    handlers.current = { onEnded, onError };
  });
  useEffect(() => {
    const audio = getAudio();
    const ended = () => handlers.current.onEnded();
    const failed = () => handlers.current.onError();
    audio.addEventListener("ended", ended);
    audio.addEventListener("error", failed);
    return () => {
      audio.removeEventListener("ended", ended);
      audio.removeEventListener("error", failed);
      // Leaving the page stops the audio, as when the element belonged to the page. When the page is replaced
      // on purpose (next surah), the audio has just ended and the next page starts it again. Next keeps a page
      // that was left (hidden, with its state), so the "playing" mark is cleared too: it would be wrong on return.
      audio.pause();
      setPlaying(null);
    };
  }, []);

  /** Stop whatever verse playback there is and forget it (a whole surah is about to play on the same audio element). */
  function stop() {
    setJuzScope(null);
    setRangeLoop(null);
    pausedVerse.current = null;
    getAudio().pause();
    setPlaying(null);
    clearNowPlaying();
  }

  return { playing, togglePlay, goTo, playJuz, startRange, stopRange, stop };
}

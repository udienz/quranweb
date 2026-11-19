"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { normalizeHash, pageHref, verseFromHash, verseFromId, verseHref, verseId } from "@/lib/anchors";
import { useI18n } from "@/lib/i18n/client";
import { localized } from "@/lib/i18n/translate";
import type { JuzRef, SurahView } from "@/lib/quran";
import { meaningOf } from "@/lib/quran/labels";
import { pageOf } from "@/lib/pagination";
import { getAudio, getJuzScope, setJuzScope, setPendingStart, subscribeJuzScope, takePendingStart } from "@/lib/audio";
import { audioFor, readAudioQuality } from "@/lib/audio-quality";
import { clearNowPlaying, showNowPlaying } from "@/lib/media-session";
import { getRangeLoop, rangeStep, readVerseRepeat, setRangeLoop, subscribeRangeLoop, type RangeLoop } from "@/lib/memorize";
import { afterJuz, afterSurah, readPlaybackMode } from "@/lib/playback";
import { userDataActions } from "@/lib/userdata/store";
import Pagination from "./Pagination";
import MemorizePanel from "./MemorizePanel";
import PlaybackModeSelect from "./PlaybackModeSelect";
import MushafView from "./MushafView";
import VerseCard from "./VerseCard";
import type { Layout } from "@/lib/layout";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export default function SurahReader({
  view,
  page,
  pageCount,
  prev,
  next,
  layout,
  juzs,
}: {
  view: SurahView;
  /** Mushaf (running Arabic block with the translation beside it) or one card per verse. */
  layout: Layout;
  /** The page shown and how many pages the surah has. */
  page: number;
  pageCount: number;
  prev: number | null;
  next: number | null;
  /** Where the 30 juz start and end (empty when the source could not give them: the juz control is then left out). */
  juzs: JuzRef[];
}) {
  const { t, tn, locale } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"reading" | "tafsir">("reading");
  const [playingN, setPlayingN] = useState<number | null>(null);
  // Index of the audio URL being tried for the verse that is playing (0 = preferred).
  const audioIndex = useRef(0);
  // The URLs being tried for that verse, in the order of the audio quality chosen when it started.
  const audioUrls = useRef<string[]>([]);
  // How many more times the verse that is playing is played before moving on (memorization: "play each verse N times").
  const repeatsLeft = useRef(0);
  // The verse paused by hand or from the lock screen, so the lock screen's play button can carry on from there.
  const pausedVerse = useRef<number | null>(null);
  // Each play() gets a number: when it fails, only the latest one may clear the "playing" mark. Moving on quickly
  // (N, the lock screen's next button, fast clicks) interrupts the previous play() with an AbortError, which used to
  // clear the mark of the verse that had just started.
  const playToken = useRef(0);
  function play(audio: HTMLAudioElement) {
    const token = ++playToken.current;
    audio.play().catch(() => {
      if (playToken.current === token) setPlayingN(null);
    });
  }
  const rangeLoop = useSyncExternalStore(subscribeRangeLoop, getRangeLoop, () => null);
  const [memorizeOpen, setMemorizeOpen] = useState(false);
  const playingJuz = useSyncExternalStore(subscribeJuzScope, getJuzScope, () => null);
  const { meta, verses } = view;
  const { from, to } = view.range;
  const editionInfo = Object.fromEntries(
    view.editions.map((e) => [e.id, { name: localized(e.name, locale), language: e.language }]),
  );

  // Record the verse near the top third of the screen as the "last read" position.
  // Debounced so that fast scrolling does not write to storage constantly.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const verse = verseFromId(entry.target.id);
          if (verse === null) continue;
          clearTimeout(timer);
          timer = setTimeout(() => userDataActions.setLastRead(meta.number, verse), 700);
        }
      },
      { rootMargin: "-30% 0px -65% 0px" },
    );
    document.querySelectorAll("[id^='verse-']").forEach((el) => observer.observe(el));
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [meta.number, verses.length]);
  // A link to a verse ("#verse-N", or "#ayat-N" copied from an earlier version) may point
  // to a verse on another page: go to the page that has it. On this page, make sure the
  // legacy hash is rewritten and the verse is in view.
  useEffect(() => {
    const verse = verseFromHash(location.hash);
    if (verse === null) return;
    if (verse < from || verse > to) {
      if (verse >= 1 && verse <= meta.verseCount) router.replace(verseHref(meta.number, verse));
      return;
    }
    const hash = normalizeHash(location.hash);
    if (hash !== location.hash) {
      history.replaceState(null, "", hash);
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    }
  }, [meta.number, meta.verseCount, from, to, router]);

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
    setPlayingN(verse.number);
    play(audio);
    document.getElementById(verseId(verse.number))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function togglePlay(index: number) {
    const verse = verses[index];
    if (!verse) return;
    if (playingN === verse.number) {
      getAudio().pause();
      pausedVerse.current = verse.number;
      setPlayingN(null);
    } else {
      setJuzScope(null); // playing from a verse by hand leaves the juz that was being played
      // and the range being looped, unless the verse is inside it (pausing and playing again keeps the loop).
      const loop = getRangeLoop();
      if (loop && (loop.surah !== meta.number || verse.number < loop.from || verse.number > loop.to)) setRangeLoop(null);
      startVerse(index);
    }
  }

  /** Play from a verse of any surah: here when it is on this page, otherwise on the page that has it. */
  function goTo(surah: number, verse: number) {
    if (surah === meta.number && verse >= from && verse <= to) {
      startVerse(verse - from);
      return;
    }
    setPendingStart({ surah, verse });
    router.push(verseHref(surah, verse), { scroll: false });
  }

  /** Play a whole juz: from its first verse, across pages and surahs, to its last. */
  function playJuz(n: number) {
    const ref = juzs.find((j) => j.juz === n);
    if (!ref) return;
    setRangeLoop(null);
    setJuzScope(n);
    goTo(ref.start.surah, ref.start.verse);
  }

  /** Loop a range of verses of this surah: from its first verse, again after its last, as many rounds as chosen. */
  function startRange(loop: RangeLoop) {
    setJuzScope(null);
    setRangeLoop(loop);
    goTo(loop.surah, loop.from);
  }

  function stopRange() {
    setRangeLoop(null);
    getAudio().pause();
    setPlayingN(null);
  }

  function onEnded() {
    // The same verse again, as many times as the reader chose for memorizing.
    if (playingN !== null && repeatsLeft.current > 0) {
      repeatsLeft.current -= 1;
      const audio = getAudio();
      audio.currentTime = 0;
      play(audio);
      return;
    }
    const idx = verses.findIndex((v) => v.number === playingN);
    const loop = getRangeLoop();
    if (idx >= 0 && loop) {
      const step = rangeStep(loop, meta.number, verses[idx].number);
      if (step.kind === "stop") {
        setRangeLoop(null);
        setPlayingN(null);
        return;
      }
      if (step.kind === "again") {
        setRangeLoop(step.loop);
        goTo(loop.surah, loop.from);
        return;
      }
    }
    const scope = getJuzScope();
    const juz = scope === null ? undefined : juzs.find((j) => j.juz === scope);
    if (idx >= 0 && juz && meta.number === juz.end.surah && verses[idx].number === juz.end.verse) {
      // The last verse of the juz that is being played: what happens is the reader's choice, as at the end of a surah.
      const after = afterJuz(readPlaybackMode(), juz.juz, juzs.length);
      const target = after.kind === "start" ? juzs.find((j) => j.juz === after.juz) : undefined;
      if (!target) {
        setJuzScope(null);
        setPlayingN(null);
      } else {
        setJuzScope(target.juz);
        goTo(target.start.surah, target.start.verse);
      }
    } else if (idx >= 0 && idx < verses.length - 1) {
      startVerse(idx + 1);
    } else if (idx >= 0 && to < meta.verseCount) {
      // The last verse of the page: continue on the next page. The audio element is shared by
      // every page, so playback is still allowed when the new verses arrive.
      setPendingStart({ surah: meta.number, verse: to + 1 });
      router.push(pageHref(meta.number, pageOf(to + 1)), { scroll: false });
    } else if (idx >= 0 && juz) {
      // The end of a surah in the middle of a juz: the juz goes on in the next surah, whatever the playback mode says.
      goTo(meta.number + 1, 1);
    } else if (idx >= 0) {
      // The end of the surah: what happens is the reader's choice.
      const after = afterSurah(readPlaybackMode(), meta.number);
      if (after.kind === "stop") {
        setPlayingN(null);
      } else if (after.surah === meta.number && from === after.verse) {
        startVerse(0); // repeating a surah that is a single page
      } else {
        setPendingStart(after);
        router.push(after.surah === meta.number ? pageHref(meta.number, 1) : `/surah/${after.surah}`, { scroll: false });
      }
    } else {
      setPlayingN(null);
    }
  }

  // The page the audio was heading for has arrived (the next page, the first page again, the next surah, or where a juz
  // starts): carry on with the verse it was heading for.
  useEffect(() => {
    const start = takePendingStart(meta.number, from, to);
    // Starting the verse sets the playing verse: that is the point of reacting to the page that has arrived.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (start !== null) startVerse(start - from);
    // startVerse only reads the audio element and the current verses, which change with the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.number, from]);

  function onError() {
    const audio = getAudio();
    const next = playingN === null ? undefined : audioUrls.current[audioIndex.current + 1];
    if (next) {
      audioIndex.current += 1;
      audio.src = next;
      play(audio);
    } else {
      setPlayingN(null);
    }
  }

  // Lock screen and media keys (Media Session): pause, carry on, and the previous or next verse of the surah.
  function mediaPause() {
    if (playingN === null) return;
    pausedVerse.current = playingN;
    getAudio().pause();
    setPlayingN(null);
  }
  function mediaPlay() {
    const n = pausedVerse.current;
    if (n === null || n < from || n > to) return;
    pausedVerse.current = null;
    setPlayingN(n);
    play(getAudio());
  }
  function mediaStep(delta: -1 | 1) {
    const n = playingN ?? pausedVerse.current;
    if (n === null) return;
    pausedVerse.current = null;
    if (n + delta >= 1 && n + delta <= meta.verseCount) goTo(meta.number, n + delta);
    else if (delta === 1 && meta.number < 114) goTo(meta.number + 1, 1);
  }
  const mediaActions = useRef({ mediaPause, mediaPlay, mediaStep });
  useEffect(() => {
    mediaActions.current = { mediaPause, mediaPlay, mediaStep };
  });
  useEffect(() => {
    const shown = playingN ?? pausedVerse.current;
    if (shown === null) return;
    showNowPlaying(
      { surahName: meta.name.latin, surah: meta.number, verse: shown, reciter: view.qari.name, site: t("meta.title") },
      playingN !== null,
      {
        play: () => mediaActions.current.mediaPlay(),
        pause: () => mediaActions.current.mediaPause(),
        previous: () => mediaActions.current.mediaStep(-1),
        next: () => mediaActions.current.mediaStep(1),
      },
    );
  }, [playingN, meta.name.latin, meta.number, view.qari.name, t]);
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
      if (playingN !== null) mediaPause();
      else if (pausedVerse.current !== null && pausedVerse.current >= from && pausedVerse.current <= to) mediaPlay();
      else {
        const inView = verses.findIndex((v) => {
          const el = [...document.querySelectorAll<HTMLElement>(`#${verseId(v.number)}`)].find((x) => x.offsetParent !== null);
          return el ? el.getBoundingClientRect().bottom > 0 : false;
        });
        togglePlay(Math.max(0, inView));
      }
    } else if (key === "n" || key === "p") {
      if (playingN === null && pausedVerse.current === null) return;
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

  function jump(n: number) {
    if (n >= from && n <= to) document.getElementById(verseId(n))?.scrollIntoView({ behavior: "smooth", block: "start" });
    else router.push(verseHref(meta.number, n));
  }

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
      setPlayingN(null);
    };
  }, []);

  const tabClass = (active: boolean) =>
    `rounded-full px-5 py-2 text-sm font-semibold transition ${
      active ? "bg-gold text-[hsl(190_70%_12%)]" : "border border-white/15 text-white/85 hover:bg-white/10"
    }`;

  return (
    <div>
      <header
        className="on-dark rounded-2xl p-5 text-white shadow-sm sm:px-6"
        style={{ background: "linear-gradient(135deg, hsl(var(--hero-from)), hsl(var(--hero-to)))" }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 rotate-45 items-center justify-center rounded-lg bg-white/10 ring-1 ring-gold/60">
              <span className="-rotate-45 font-display text-sm font-bold text-gold">{meta.number}</span>
            </span>
            <div>
              <h1 className="font-display text-xl font-bold">{meta.name.latin}</h1>
              <p className="tabular-nums text-xs text-white/70">
                {tn("common.verses", meta.verseCount)} · {t(`revelation.${meta.revelation}`)}
              </p>
            </div>
          </div>
          <p className="font-arabic text-3xl text-gold" dir="rtl" lang="ar" translate="no">
            {meta.name.arabic}
          </p>
        </div>
        <p className="mt-3 text-sm text-white/75">{meaningOf(meta, locale)}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button type="button" className={tabClass(mode === "reading")} onClick={() => setMode("reading")}>
              {t("common.reading")}
            </button>
            <button type="button" className={tabClass(mode === "tafsir")} onClick={() => setMode("tafsir")}>
              {t("common.tafsir")}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-white/85">
              <span className="sr-only">{t("reader.jumpToVerse")}</span>
              <select
                defaultValue=""
                onChange={(e) => e.target.value && jump(Number(e.target.value))}
                className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-gold outline-none [&>option]:bg-[hsl(192_64%_9%)] [&>option]:text-white"
              >
                <option value="" disabled>
                  {t("reader.jumpPlaceholder")}
                </option>
                {Array.from({ length: meta.verseCount }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {t("reader.verseOption", { number: n })}
                  </option>
                ))}
              </select>
            </label>
            {juzs.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-white/85">
                <span className="sr-only">{t("reader.playJuz")}</span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    e.target.value = ""; // back to the prompt, so the same juz can be chosen again
                    if (n) playJuz(n);
                  }}
                  title={t("reader.playJuz")}
                  className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-gold outline-none [&>option]:bg-[hsl(192_64%_9%)] [&>option]:text-white"
                >
                  <option value="" disabled>
                    {t("reader.juzPlaceholder")}
                  </option>
                  {juzs.map((j) => (
                    <option key={j.juz} value={j.juz}>
                      {t("reader.juzOption", { juz: j.juz, surah: j.start.surah, verse: j.start.verse })}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <PlaybackModeSelect onDark />
            <button
              type="button"
              aria-expanded={memorizeOpen}
              onClick={() => setMemorizeOpen((o) => !o)}
              className={`rounded-xl border px-3 py-2 text-sm ${memorizeOpen ? "border-gold text-gold" : "border-white/15 text-white/85 hover:bg-white/10"}`}
            >
              {t("memorize.button")}
            </button>
          </div>
        </div>
        {memorizeOpen && <MemorizePanel surah={meta.number} verseCount={meta.verseCount} first={from} onStart={startRange} />}
        {rangeLoop !== null && rangeLoop.surah === meta.number && playingN !== null && (
          <p role="status" className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gold">
            {rangeLoop.times === 0
              ? t("memorize.playingEndless", { from: rangeLoop.from, to: rangeLoop.to, round: rangeLoop.round })
              : t("memorize.playing", { from: rangeLoop.from, to: rangeLoop.to, round: rangeLoop.round, times: rangeLoop.times })}
            <button type="button" onClick={stopRange} className="rounded-full border border-gold/60 px-3 py-1 text-xs hover:bg-white/10">
              {t("memorize.stop")}
            </button>
          </p>
        )}
        {playingJuz !== null && playingN !== null && (
          <p role="status" className="mt-3 text-sm text-gold">
            {t("reader.playingJuz", { juz: playingJuz })}
          </p>
        )}
      </header>

      <Pagination surah={meta.number} page={page} count={pageCount} from={from} to={to} total={meta.verseCount} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {mode === "reading" && from === 1 && meta.number !== 1 && meta.number !== 9 && (
          <p dir="rtl" lang="ar" translate="no" className="font-arabic border-b border-border py-8 text-center text-[length:calc(2.25rem*var(--arabic-scale,1))] text-primary">
            {BISMILLAH}
          </p>
        )}
        {mode === "reading" && layout === "mushaf" ? (
          <MushafView
            verses={verses}
            surahNumber={meta.number}
            playingN={playingN}
            onPlay={(verse) => togglePlay(verses.indexOf(verse))}
            editions={editionInfo}
          />
        ) : (
          verses.map((verse, i) => (
          <VerseCard
            key={verse.number}
            verse={verse}
            surahNumber={meta.number}
            mode={mode}
            playing={playingN === verse.number}
            onPlay={() => togglePlay(i)}
            editions={editionInfo}
          />
          ))
        )}
      </div>

      <Pagination surah={meta.number} page={page} count={pageCount} from={from} to={to} total={meta.verseCount} />

      <nav className="mt-2 flex justify-between text-sm font-medium">
        {prev ? (
          <Link href={`/surah/${prev}`} className="rounded-full border border-border bg-card px-4 py-2 text-primary hover:bg-muted">
            &larr; {t("reader.previousSurah")}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/surah/${next}`} className="rounded-full border border-border bg-card px-4 py-2 text-primary hover:bg-muted">
            {t("reader.nextSurah")} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { normalizeHash, pageHref, verseFromHash, verseFromId, verseHref, verseId } from "@/lib/anchors";
import { useI18n } from "@/lib/i18n/client";
import { localized } from "@/lib/i18n/translate";
import type { JuzRef, SurahView } from "@/lib/quran";
import { meaningOf } from "@/lib/quran/labels";
import { pageOf } from "@/lib/pagination";
import { getJuzScope, setJuzScope, subscribeJuzScope } from "@/lib/audio";
import { getRangeLoop, setRangeLoop, subscribeRangeLoop } from "@/lib/memorize";
import { VERSE_COUNTS } from "@/lib/surah-number";
import { useVersePlayer } from "@/lib/useVersePlayer";
import { useWholeSurah } from "@/lib/useWholeSurah";
import { userDataActions } from "@/lib/userdata/store";
import Pagination from "./Pagination";
import MemorizePanel from "./MemorizePanel";
import PlaybackModeSelect from "./PlaybackModeSelect";
import { VerseSurahPlayer, WholeSurahPlayer } from "./SurahPlayer";
import SearchableSelect from "./SearchableSelect";
import MushafView from "./MushafView";
import VerseCard from "./VerseCard";
import type { Layout } from "@/lib/layout";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

// The controls under the surah heading are chips on the paper (the `quran-chip` rule in globals.css); only the Memorize panel
// and the playing status keep the dark forest bar.
const CHIP_SELECT = "quran-chip rounded-xl px-3.5 py-2 text-sm font-medium outline-none";
const CHIP_TRIGGER =
  "quran-chip flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl px-3.5 py-2 text-start text-sm font-medium outline-none sm:min-w-36 sm:flex-none";

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
  const rangeLoop = useSyncExternalStore(subscribeRangeLoop, getRangeLoop, () => null);
  const [memorizeOpen, setMemorizeOpen] = useState(false);
  const playingJuz = useSyncExternalStore(subscribeJuzScope, getJuzScope, () => null);
  const { meta, verses } = view;
  const { from, to } = view.range;
  const editionInfo = Object.fromEntries(
    view.editions.map((e) => [e.id, { name: localized(e.name, locale), language: e.language, direction: e.direction }]),
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

  // A reciter with whole surahs only has no file for a verse: no juz list and no memorization by ear for it (issue #111).
  const verseAudio = !view.qari.wholeSurahOnly;
  // The audio: which verse plays and what follows it (see useVersePlayer). The verses are this page's, all of this surah.
  const player = useVersePlayer({
    verses: verses.map((v) => ({ surah: meta.number, verse: v.number, audio: v.audio, audioSaver: v.audioSaver })),
    juzs,
    verseCount: (surah) => VERSE_COUNTS[surah - 1],
    hrefFor: verseHref,
    pageHrefFor: (surah, verse) => pageHref(surah, surah === meta.number ? pageOf(verse) : 1),
    elementId: (v) => verseId(v.verse),
    surahName: () => meta.name.latin,
    reciter: view.qari.name,
    site: t("meta.title"),
  });
  const { togglePlay, playJuz, startRange, stopRange } = player;
  // The whole surah from one recording, for a reciter that has one.
  const whole = useWholeSurah({
    urls: view.surahAudio ? { [meta.number]: view.surahAudio } : {},
    hrefFor: (surah) => `/surah/${surah}`,
    beforeStart: () => player.stop(),
    surahName: () => meta.name.latin,
    reciter: view.qari.name,
    site: t("meta.title"),
  });
  const playingN = player.playing?.surah === meta.number ? player.playing.verse : null;

  function jump(n: number) {
    if (n >= from && n <= to) document.getElementById(verseId(n))?.scrollIntoView({ behavior: "smooth", block: "start" });
    else router.push(verseHref(meta.number, n));
  }

  const tabClass = (active: boolean) => `quran-chip rounded-full px-5 py-2 text-sm font-semibold transition ${active ? "quran-chip--on" : ""}`;

  // Playing from a verse by hand (the play bar, or its slider) leaves the juz and the range that were being played, as a verse button does.
  function playFrom(n: number) {
    setJuzScope(null);
    const loop = getRangeLoop();
    if (loop && (loop.surah !== meta.number || n < loop.from || n > loop.to)) setRangeLoop(null);
    player.goTo(meta.number, n);
  }
  const pausedHere = player.paused?.surah === meta.number ? player.paused.verse : null;
  function toggleVerses() {
    if (player.playing !== null) player.pause();
    else if (pausedHere !== null) player.resume();
    else playFrom(1);
  }
  const showPlayer = Boolean(view.surahAudio) || verseAudio;

  return (
    <div className="quran-reading">
      <header className="quran-reading__header">
        <p className="quran-reading__eyebrow tabular-nums">
          {meta.number} · {t(`revelation.${meta.revelation}`)} · {tn("common.verses", meta.verseCount)}
        </p>
        <div className="quran-reading__title">
          <h1 className="font-display">{meta.name.latin}</h1>
          <span aria-hidden className="quran-reading__title-rule" />
          <p className="font-arabic" dir="rtl" lang="ar" translate="no">
            {meta.name.arabic}
          </p>
        </div>
        <p className="quran-reading__meaning">{meaningOf(meta, locale)}</p>
        <span aria-hidden className="quran-reading__ornament" />
      </header>

      {showPlayer &&
        (view.surahAudio?.[0] ? (
          <WholeSurahPlayer
            url={view.surahAudio[0]}
            playing={whole.current === meta.number}
            onToggle={() => whole.toggle(meta.number)}
            reciter={view.qari.name}
            surahName={meta.name.latin}
          />
        ) : (
          <VerseSurahPlayer
            verse={playingN ?? pausedHere}
            verseCount={meta.verseCount}
            playing={playingN !== null}
            onToggle={toggleVerses}
            onGoTo={playFrom}
            reciter={view.qari.name}
            surahName={meta.name.latin}
          />
        ))}

      <div className="quran-reading__chips">
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" aria-pressed={mode === "reading"} className={tabClass(mode === "reading")} onClick={() => setMode("reading")}>
            {t("common.reading")}
          </button>
          <button type="button" aria-pressed={mode === "tafsir"} className={tabClass(mode === "tafsir")} onClick={() => setMode("tafsir")}>
            {t("common.tafsir")}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <SearchableSelect
            label={t("reader.jumpToVerse")}
            labelHidden
            placeholder={t("reader.jumpPlaceholder")}
            value=""
            onChange={(v) => v && jump(Number(v))}
            options={Array.from({ length: meta.verseCount }, (_, i) => ({ value: String(i + 1), label: t("reader.verseOption", { number: i + 1 }) }))}
            selectClassName={CHIP_SELECT}
            triggerClassName={CHIP_TRIGGER}
          />
          {verseAudio && juzs.length > 0 && (
            // The value stays empty: choosing starts the juz, and the same juz can be chosen again.
            <SearchableSelect
              label={t("reader.playJuz")}
              labelHidden
              placeholder={t("reader.juzPlaceholder")}
              value=""
              onChange={(v) => v && playJuz(Number(v))}
              options={juzs.map((j) => ({ value: String(j.juz), label: t("reader.juzOption", { juz: j.juz, surah: j.start.surah, verse: j.start.verse }) }))}
              selectClassName={CHIP_SELECT}
              triggerClassName={CHIP_TRIGGER}
            />
          )}
          <PlaybackModeSelect chip />
          <button
            type="button"
            aria-expanded={memorizeOpen}
            onClick={() => setMemorizeOpen((o) => !o)}
            className={`quran-chip rounded-xl px-3.5 py-2 text-sm font-medium ${memorizeOpen ? "quran-chip--on" : ""}`}
          >
            {t("memorize.button")}
          </button>
        </div>
      </div>
      {view.qari.wholeSurahOnly && <p className="mt-3 text-center text-xs text-muted-foreground">{t("reader.surahOnlyHint")}</p>}
      {(memorizeOpen || (rangeLoop !== null && rangeLoop.surah === meta.number && playingN !== null) || (playingJuz !== null && playingN !== null)) && (
        <div className="quran-reading__bar on-dark">
          {memorizeOpen && <MemorizePanel surah={meta.number} verseCount={meta.verseCount} first={from} onStart={startRange} withAudio={verseAudio} />}
          {rangeLoop !== null && rangeLoop.surah === meta.number && playingN !== null && (
            <p role="status" className="flex flex-wrap items-center gap-3 text-sm text-gold">
              {rangeLoop.times === 0
                ? t("memorize.playingEndless", { from: rangeLoop.from, to: rangeLoop.to, round: rangeLoop.round })
                : t("memorize.playing", { from: rangeLoop.from, to: rangeLoop.to, round: rangeLoop.round, times: rangeLoop.times })}
              <button type="button" onClick={stopRange} className="rounded-full border border-gold/60 px-3 py-1 text-xs hover:bg-white/10">
                {t("memorize.stop")}
              </button>
            </p>
          )}
          {playingJuz !== null && playingN !== null && (
            <p role="status" className="text-sm text-gold">
              {t("reader.playingJuz", { juz: playingJuz })}
            </p>
          )}
        </div>
      )}

      {view.unavailable.length > 0 && (
        <p role="status" className="mt-3 rounded-xl border border-border bg-muted px-4 py-3 text-sm">
          {t("reader.unavailable", { names: view.unavailable.map((e) => localized(e.name, locale)).join(", ") })}
        </p>
      )}

      <Pagination surah={meta.number} page={page} count={pageCount} from={from} to={to} total={meta.verseCount} />

      <div className="quran-reading__surface overflow-hidden rounded-2xl border border-border bg-card">
        {mode === "reading" && from === 1 && meta.number !== 1 && meta.number !== 9 && (
          <p dir="rtl" lang="ar" translate="no" className="font-arabic border-b border-border py-8 text-center text-[length:calc(2.25rem*var(--arabic-scale,1))] text-primary">
            {BISMILLAH}
          </p>
        )}
        {mode === "reading" && layout === "mushaf" ? (
          <MushafView
            verses={verses}
            surahNumber={meta.number}
            surahName={meta.name.latin}
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
            surahName={meta.name.latin}
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
            <span aria-hidden className="inline-block rtl:-scale-x-100">&larr;</span> {t("reader.previousSurah")}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/surah/${next}`} className="rounded-full border border-border bg-card px-4 py-2 text-primary hover:bg-muted">
            {t("reader.nextSurah")} <span aria-hidden className="inline-block rtl:-scale-x-100">&rarr;</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

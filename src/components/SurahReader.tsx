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
import { getJuzScope, subscribeJuzScope } from "@/lib/audio";
import { getRangeLoop, subscribeRangeLoop } from "@/lib/memorize";
import { VERSE_COUNTS } from "@/lib/surah-number";
import { useVersePlayer } from "@/lib/useVersePlayer";
import { useWholeSurah } from "@/lib/useWholeSurah";
import { userDataActions } from "@/lib/userdata/store";
import Pagination from "./Pagination";
import MemorizePanel from "./MemorizePanel";
import PlaybackModeSelect from "./PlaybackModeSelect";
import PlaySurahButton from "./PlaySurahButton";
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
            {view.surahAudio && <PlaySurahButton onDark playing={whole.current === meta.number} onToggle={() => whole.toggle(meta.number)} />}
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

      {view.unavailable.length > 0 && (
        <p role="status" className="mt-3 rounded-xl border border-border bg-muted px-4 py-3 text-sm">
          {t("reader.unavailable", { names: view.unavailable.map((e) => localized(e.name, locale)).join(", ") })}
        </p>
      )}

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

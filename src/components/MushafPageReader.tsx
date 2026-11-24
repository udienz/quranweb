"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mushafHref, mushafVerseId } from "@/lib/anchors";
import { userDataActions } from "@/lib/userdata/store";
import { useI18n } from "@/lib/i18n/client";
import { localized } from "@/lib/i18n/translate";
import type { Edition, JuzRef, MushafPageRef, SurahMeta, VerseView } from "@/lib/quran";
import { meaningOf } from "@/lib/quran/labels";
import { mushafPageOf } from "@/lib/quran/mushaf-pages";
import { MUSHAF_PAGES, VERSE_COUNTS } from "@/lib/surah-number";
import { useVersePlayer } from "@/lib/useVersePlayer";
import { useWholeSurah } from "@/lib/useWholeSurah";
import { takePendingVerse } from "@/lib/pending-verse";
import MushafPageNav from "./MushafPageNav";
import MushafView from "./MushafView";
import PlaybackModeSelect from "./PlaybackModeSelect";
import PlaySurahButton from "./PlaySurahButton";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

/** The verses of one surah that a page of the mushaf shows. */
export interface MushafPageSegment {
  meta: SurahMeta;
  verses: VerseView[];
  /** The recording of the whole surah as one file, when the reciter has one. */
  surahAudio?: string[];
}

/**
 * One page of the printed Madinah mushaf: its verses, from one to three surahs, each surah's part in the mushaf layout (the
 * Arabic as one running block, the translation beside it). A surah that starts on the page has its name and the Bismillah; one
 * that goes on from the page before has only its name. The audio is the same player as the surah reader's, so it plays on
 * across the surahs of the page and on to the next page.
 */
export default function MushafPageReader({
  page,
  segments,
  pages,
  juzs,
  editions,
  qari,
  unavailable,
}: {
  page: number;
  segments: MushafPageSegment[];
  /** The 604 pages, to find the page that has a verse the audio goes to. */
  pages: MushafPageRef[];
  juzs: JuzRef[];
  editions: Edition[];
  qari: string;
  /** Names of the translations or tafsir that could not be loaded this time. */
  unavailable: string[];
}) {
  const { t, tn, locale } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<{ surah: number; verse: number } | null>(null);
  const editionInfo = Object.fromEntries(
    editions.map((e) => [e.id, { name: localized(e.name, locale), language: e.language, direction: e.direction }]),
  );

  const all = segments.flatMap((s) => s.verses.map((v) => ({ surah: s.meta.number, verse: v.number, audio: v.audio, audioSaver: v.audioSaver })));
  const names = new Map(segments.map((s) => [s.meta.number, s.meta.name.latin]));
  const pageAddress = (surah: number, verse: number) => mushafHref(mushafPageOf(pages, { surah, verse }) ?? page);
  const player = useVersePlayer({
    verses: all,
    juzs,
    verseCount: (surah) => VERSE_COUNTS[surah - 1],
    hrefFor: pageAddress,
    pageHrefFor: pageAddress,
    elementId: (v) => mushafVerseId(v.surah, v.verse),
    surahName: (surah) => names.get(surah) ?? String(surah),
    reciter: qari,
    site: t("meta.title"),
  });

  // The recordings of whole surahs, for the surahs of this page whose reciter has one.
  const whole = useWholeSurah({
    urls: Object.fromEntries(segments.filter((s) => s.surahAudio).map((s) => [s.meta.number, s.surahAudio as string[]])),
    hrefFor: (surah) => pageAddress(surah, 1),
    beforeStart: () => player.stop(),
    surahName: (surah) => names.get(surah) ?? String(surah),
    reciter: qari,
    site: t("meta.title"),
  });
  // The button of a surah plays its recording as one file; a reciter with no such file has the surah played verse by verse from
  // where it starts on this page, or paused where it is.
  const surahButton = (seg: MushafPageSegment) => {
    const n = seg.meta.number;
    if (seg.surahAudio) return <PlaySurahButton playing={whole.current === n} onToggle={() => whole.toggle(n)} />;
    const first = all.findIndex((v) => v.surah === n);
    const now = player.playing?.surah === n ? all.findIndex((v) => v.surah === n && v.verse === player.playing?.verse) : -1;
    return <PlaySurahButton playing={now >= 0} onToggle={() => player.togglePlay(now >= 0 ? now : first)} />;
  };

  // Record the verse near the top third of the screen as the "last read" position, as the surah reader does. The ids carry the
  // surah (`verse-112-1`), because a page can hold several. Debounced so that fast scrolling does not write to storage constantly.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const match = /^verse-(\d+)-(\d+)$/.exec(entry.target.id);
          if (!match) continue;
          clearTimeout(timer);
          timer = setTimeout(() => userDataActions.setLastRead(Number(match[1]), Number(match[2])), 700);
        }
      },
      { rootMargin: "-30% 0px -65% 0px" },
    );
    document.querySelectorAll("[id^='verse-']").forEach((el) => observer.observe(el));
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [page]);
  // A link made for the pages of 10 verses ends in "#verse-255": when it brings the reader here (a hard load keeps the hash), show
  // that verse of the surah of this page that has it.
  useEffect(() => {
    const match = /^#verse-(\d+)$/.exec(location.hash);
    if (!match) return;
    const verse = Number(match[1]);
    const segment = segments.find((s) => s.verses.some((v) => v.number === verse));
    if (segment) document.getElementById(mushafVerseId(segment.meta.number, verse))?.scrollIntoView({ block: "center" });
    // Only on arrival: the page's own verses decide, not later changes of the segments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // A link to a verse that was followed from inside the site: the server has sent it to the mushaf page of the first verse of that page
  // of 10, and the move dropped the `#verse` part. Put the verse back and show it; when it is on the next page, go there.
  useEffect(() => {
    const target = takePendingVerse();
    if (!target || location.hash) return;
    const id = mushafVerseId(target.surah, target.verse);
    const element = document.getElementById(id);
    if (element) {
      history.replaceState(null, "", `#${id}`);
      element.scrollIntoView({ block: "start" });
      return;
    }
    const there = mushafPageOf(pages, target);
    if (there !== undefined && there !== page) router.replace(`${mushafHref(there)}#${id}`);
    // Only on arrival of a page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // The next page is forward in the reading direction of the interface: to the right in a left-to-right one, to the left in a
  // right-to-left one. The arrow keys and a swipe follow it. Ignored while typing in a field and with a modifier key.
  const step = useRef<(delta: -1 | 1) => void>(() => {});
  useEffect(() => {
    step.current = (delta) => {
      // Read the current URL rather than the page prop: a second key press can arrive
      // after the URL changes but before React commits the next page's render.
      const match = /^\/mushaf\/(\d+)\/?$/.exec(window.location.pathname);
      const currentPage = Number(match?.[1]);
      if (!Number.isInteger(currentPage)) return;
      const to = currentPage + delta;
      if (to >= 1 && to <= MUSHAF_PAGES) router.push(mushafHref(to));
    };
  }, [router]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
      if ((e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const forward = (e.key === "ArrowRight") !== (document.documentElement.dir === "rtl");
      e.preventDefault();
      step.current(forward ? 1 : -1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // A swipe across the page turns it: at least 80 px sideways, and clearly more sideways than up or down (so scrolling and
  // selecting text are left alone). Swiping towards the start of the line turns to the next page, as in a book.
  const touch = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      className="quran-reading"
      onTouchStart={(e) => {
        const p = e.changedTouches[0];
        touch.current = e.touches.length === 1 ? { x: p.clientX, y: p.clientY } : null;
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const p = e.changedTouches[0];
        const dx = p.clientX - start.x;
        const dy = p.clientY - start.y;
        if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 2) return;
        if (window.getSelection()?.toString()) return;
        const towardsStart = dx > 0 === (document.documentElement.dir === "rtl");
        step.current(towardsStart ? 1 : -1);
      }}
    >
      <header className="quran-reading__header">
        <p className="quran-reading__eyebrow">{segments.map((s) => s.meta.name.latin).join(" · ")}</p>
        <div className="quran-reading__title">
          <h1 className="font-display">{t("mushaf.page", { page })}</h1>
        </div>
        <span aria-hidden className="quran-reading__ornament" />
      </header>

      <div className="quran-reading__bar on-dark">
        <PlaybackModeSelect onDark />
      </div>

      <div className="mt-4">
        <MushafPageNav page={page} />
      </div>

      {unavailable.length > 0 && (
        <p role="status" className="mt-3 rounded-xl border border-border bg-muted px-4 py-3 text-sm">
          {t("reader.unavailable", { names: unavailable.join(", ") })}
        </p>
      )}

      <div className="quran-reading__surface mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {segments.map((seg) => {
          const starts = seg.verses[0]?.number === 1;
          return (
            <Fragment key={seg.meta.number}>
              {starts ? (
                <div className="border-b border-border px-5 py-5 text-center">
                  <p className="font-arabic text-3xl text-primary" dir="rtl" lang="ar" translate="no">
                    {seg.meta.name.arabic}
                  </p>
                  <p className="mt-1 font-display text-sm font-semibold">{seg.meta.name.latin}</p>
                  <p className="text-xs text-muted-foreground">
                    {meaningOf(seg.meta, locale)} · {tn("common.verses", seg.meta.verseCount)} · {t(`revelation.${seg.meta.revelation}`)}
                  </p>
                  <div className="mt-3 flex justify-center">{surahButton(seg)}</div>
                  {seg.meta.number !== 1 && seg.meta.number !== 9 && (
                    <p dir="rtl" lang="ar" translate="no" className="font-arabic mt-4 text-[length:calc(2rem*var(--arabic-scale,1))] text-primary">
                      {BISMILLAH}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-2">
                  <p className="text-xs font-medium text-muted-foreground">{seg.meta.name.latin}</p>
                  {surahButton(seg)}
                </div>
              )}
              <MushafView
                verses={seg.verses}
                surahNumber={seg.meta.number}
                surahName={seg.meta.name.latin}
                playingN={player.playing?.surah === seg.meta.number ? player.playing.verse : null}
                onPlay={(verse) => player.togglePlay(all.findIndex((v) => v.surah === seg.meta.number && v.verse === verse.number))}
                editions={editionInfo}
                idFor={(verse) => mushafVerseId(seg.meta.number, verse)}
                selected={selected?.surah === seg.meta.number ? selected.verse : null}
                onSelect={(verse) => setSelected(verse === null ? null : { surah: seg.meta.number, verse })}
              />
            </Fragment>
          );
        })}
        <p className="border-t border-border py-3 text-center font-display text-sm tabular-nums text-muted-foreground" aria-hidden="true">
          — {page} —
        </p>
      </div>

      <div className="mt-4">
        <MushafPageNav page={page} />
      </div>
    </div>
  );
}

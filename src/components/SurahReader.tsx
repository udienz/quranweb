"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { normalizeHash, pageHref, verseFromHash, verseFromId, verseHref, verseId } from "@/lib/anchors";
import { useI18n } from "@/lib/i18n/client";
import { localized } from "@/lib/i18n/translate";
import type { SurahView } from "@/lib/quran";
import { meaningOf } from "@/lib/quran/labels";
import { pageOf } from "@/lib/pagination";
import { userDataActions } from "@/lib/userdata/store";
import Pagination from "./Pagination";
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
}: {
  view: SurahView;
  /** Mushaf (running Arabic block with the translation beside it) or one card per verse. */
  layout: Layout;
  /** The page shown and how many pages the surah has. */
  page: number;
  pageCount: number;
  prev: number | null;
  next: number | null;
}) {
  const { t, tn, locale } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"reading" | "tafsir">("reading");
  const [playingN, setPlayingN] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Index of the audio URL being tried for the verse that is playing (0 = preferred).
  const audioIndex = useRef(0);
  // The verse to start playing when the next page has arrived (auto-advance across pages).
  const playOnArrival = useRef<number | null>(null);
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

  // Group the names by credit: "Arabic text, Translation: Ministry of Religious Affairs, via EQuran.id".
  const groups = new Map<string, string[]>();
  const addCredit = (credit: string, name: string) => groups.set(credit, [...(groups.get(credit) ?? []), name]);
  for (const e of view.editions) addCredit(localized(e.source.attribution, locale), localized(e.name, locale));
  addCredit(localized(view.qari.source.attribution, locale), t("reader.audioBy", { qari: view.qari.name }));
  const credits = [...groups].map(([credit, names]) => `${names.join(", ")}: ${credit}`);

  function startVerse(index: number) {
    const audio = audioRef.current;
    const verse = verses[index];
    if (!audio || !verse?.audio[0]) return;
    audioIndex.current = 0;
    audio.src = verse.audio[0];
    setPlayingN(verse.number);
    audio.play().catch(() => setPlayingN(null));
    document.getElementById(verseId(verse.number))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function togglePlay(index: number) {
    const audio = audioRef.current;
    const verse = verses[index];
    if (!audio || !verse) return;
    if (playingN === verse.number) {
      audio.pause();
      setPlayingN(null);
    } else {
      startVerse(index);
    }
  }

  function onEnded() {
    const idx = verses.findIndex((v) => v.number === playingN);
    if (idx >= 0 && idx < verses.length - 1) {
      startVerse(idx + 1);
    } else if (idx >= 0 && to < meta.verseCount) {
      // The last verse of the page: continue on the next page. The audio element stays
      // mounted, so playback is still allowed when the new verses arrive.
      playOnArrival.current = to + 1;
      router.push(pageHref(meta.number, pageOf(to + 1)), { scroll: false });
    } else {
      setPlayingN(null);
    }
  }

  // The next page has arrived: carry on with the verse the audio was heading for.
  useEffect(() => {
    if (playOnArrival.current !== null && playOnArrival.current === verses[0]?.number) {
      playOnArrival.current = null;
      startVerse(0);
    }
    // startVerse only reads refs and the current verses, which change with `from`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  function onError() {
    const audio = audioRef.current;
    const verse = verses.find((v) => v.number === playingN);
    const next = verse?.audio[audioIndex.current + 1];
    if (audio && next) {
      audioIndex.current += 1;
      audio.src = next;
      audio.play().catch(() => setPlayingN(null));
    } else {
      setPlayingN(null);
    }
  }

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
      <audio ref={audioRef} onEnded={onEnded} onError={onError} preload="none" />

      <header
        className="rounded-2xl p-5 text-white shadow-sm sm:px-6"
        style={{ background: "linear-gradient(135deg, hsl(var(--hero-from)), hsl(var(--hero-to)))" }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 rotate-45 items-center justify-center rounded-lg bg-white/10 ring-1 ring-gold/60">
              <span className="-rotate-45 font-display text-sm font-bold text-gold">{meta.number}</span>
            </span>
            <div>
              <h1 className="font-display text-xl font-bold">{meta.name.latin}</h1>
              <p className="font-mono text-xs text-white/70">
                {tn("common.verses", meta.verseCount)} · {t(`revelation.${meta.revelation}`)}
              </p>
            </div>
          </div>
          <p className="font-arabic text-3xl text-gold" dir="rtl" lang="ar">
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
        </div>
      </header>

      <Pagination surah={meta.number} page={page} count={pageCount} from={from} to={to} total={meta.verseCount} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {mode === "reading" && from === 1 && meta.number !== 1 && meta.number !== 9 && (
          <p dir="rtl" lang="ar" className="font-arabic border-b border-border py-8 text-center text-4xl text-primary">
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
        <p className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground sm:px-8">
          {t("reader.sources", { list: credits.join("; ") })}.
        </p>
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

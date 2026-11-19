"use client";

import { useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";
import {
  applyVerseRepeat,
  DEFAULT_VERSE_REPEAT,
  makeRange,
  RANGE_TIMES,
  readVerseRepeat,
  subscribeVerseRepeat,
  VERSE_REPEATS,
  type RangeLoop,
  type VerseRepeat,
} from "@/lib/memorize";

const selectClass =
  "rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-gold outline-none [&>option]:bg-[hsl(192_64%_9%)] [&>option]:text-white";

/**
 * Memorization controls in the surah header: how many times each verse is played, and a range of verses of this surah to
 * loop. `first` is the first verse of the page shown, the default start of the range.
 */
export default function MemorizePanel({
  surah,
  verseCount,
  first,
  onStart,
}: {
  surah: number;
  verseCount: number;
  first: number;
  onStart: (loop: RangeLoop) => void;
}) {
  const { t } = useI18n();
  const repeat = useSyncExternalStore(subscribeVerseRepeat, readVerseRepeat, () => DEFAULT_VERSE_REPEAT);
  const [from, setFrom] = useState(first);
  const [to, setTo] = useState(Math.min(first + 4, verseCount));
  const [times, setTimes] = useState<number>(3);
  const verses = Array.from({ length: verseCount }, (_, i) => i + 1);
  const range = makeRange(surah, verseCount, from, to, times);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/15 p-3 text-sm text-white/85">
      <label className="flex flex-wrap items-center gap-2">
        <span>{t("memorize.eachVerse")}</span>
        <select value={repeat} onChange={(e) => applyVerseRepeat(Number(e.target.value) as VerseRepeat)} className={selectClass}>
          {VERSE_REPEATS.map((n) => (
            <option key={n} value={n}>
              {n === 1 ? t("memorize.once") : t("memorize.times", { count: n })}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span>{t("memorize.range")}</span>
        {/* The two verses stay on one line, so "1 – 5" is never split on a phone. */}
        <span className="flex items-center gap-2">
          <label className="flex items-center gap-2">
            <span className="sr-only">{t("memorize.from")}</span>
            <select value={from} onChange={(e) => setFrom(Number(e.target.value))} className={selectClass} aria-label={t("memorize.from")}>
              {verses.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <span aria-hidden="true">–</span>
          <label className="flex items-center gap-2">
            <span className="sr-only">{t("memorize.to")}</span>
            <select value={to} onChange={(e) => setTo(Number(e.target.value))} className={selectClass} aria-label={t("memorize.to")}>
              {verses.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </span>
        <label className="flex items-center gap-2">
          <span className="sr-only">{t("memorize.rounds")}</span>
          <select value={times} onChange={(e) => setTimes(Number(e.target.value))} className={selectClass} aria-label={t("memorize.rounds")}>
            {RANGE_TIMES.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? t("memorize.untilStopped") : t("memorize.times", { count: n })}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!range}
          onClick={() => range && onStart(range)}
          className="rounded-full bg-gold px-4 py-2 font-semibold text-[hsl(190_70%_12%)] disabled:opacity-50"
        >
          {t("memorize.start")}
        </button>
      </div>
      <p className="text-xs text-white/65">{t("memorize.hint")}</p>
    </div>
  );
}

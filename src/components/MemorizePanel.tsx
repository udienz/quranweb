"use client";

import { useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";
import {
  applyHideMode,
  applyVerseRepeat,
  DEFAULT_HIDE_MODE,
  DEFAULT_VERSE_REPEAT,
  HIDE_MODES,
  makeRange,
  RANGE_TIMES,
  readHideMode,
  readVerseRepeat,
  subscribeHiding,
  subscribeVerseRepeat,
  VERSE_REPEATS,
  type HideMode,
  type RangeLoop,
  type VerseRepeat,
} from "@/lib/memorize";
import SearchableSelect from "./SearchableSelect";

const selectClass =
  "rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-gold outline-none [&>option]:bg-[hsl(192_64%_9%)] [&>option]:text-white";
// A long surah's verse list (more than 10) opens a search box: the same look as the select it replaces.
const TRIGGER_CLASS = "flex min-w-20 items-center justify-between gap-2 rounded-xl border border-white/15 bg-transparent px-3 py-2 text-start text-sm text-gold outline-none";

/**
 * Memorization controls in the surah header: how many times each verse is played, and a range of verses of this surah to
 * loop. `first` is the first verse of the page shown, the default start of the range.
 */
export default function MemorizePanel({
  surah,
  verseCount,
  first,
  onStart,
  withAudio = true,
}: {
  surah: number;
  verseCount: number;
  first: number;
  onStart: (loop: RangeLoop) => void;
  /** False for a reciter with whole surahs only: no verse is played, so only hiding the text is left (issue #111). */
  withAudio?: boolean;
}) {
  const { t } = useI18n();
  const repeat = useSyncExternalStore(subscribeVerseRepeat, readVerseRepeat, () => DEFAULT_VERSE_REPEAT);
  const hide = useSyncExternalStore(subscribeHiding, readHideMode, () => DEFAULT_HIDE_MODE);
  const [from, setFrom] = useState(first);
  const [to, setTo] = useState(Math.min(first + 4, verseCount));
  const [times, setTimes] = useState<number>(3);
  const verseOptions = Array.from({ length: verseCount }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
  const range = makeRange(surah, verseCount, from, to, times);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/15 p-3 text-sm text-white/85">
      {withAudio && (
        <>
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
              <SearchableSelect
                label={t("memorize.from")}
                labelHidden
                value={String(from)}
                onChange={(v) => setFrom(Number(v))}
                options={verseOptions}
                selectClassName={selectClass}
                triggerClassName={TRIGGER_CLASS}
              />
              <span aria-hidden="true">–</span>
              <SearchableSelect
                label={t("memorize.to")}
                labelHidden
                value={String(to)}
                onChange={(v) => setTo(Number(v))}
                options={verseOptions}
                selectClassName={selectClass}
                triggerClassName={TRIGGER_CLASS}
              />
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
        </>
      )}
      <label className="flex flex-wrap items-center gap-2">
        <span>{t("memorize.hide")}</span>
        <select value={hide} onChange={(e) => applyHideMode(e.target.value as HideMode)} className={selectClass}>
          {HIDE_MODES.map((m) => (
            <option key={m} value={m}>
              {t(`memorize.hideModes.${m}`)}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-white/65">{t("memorize.hint")}</p>
    </div>
  );
}

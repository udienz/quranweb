"use client";

import { useHiding } from "@/lib/useHiding";
import { Fragment, useState } from "react";
import { verseId } from "@/lib/anchors";
import { useI18n } from "@/lib/i18n/client";
import type { VerseView } from "@/lib/quran";
import { findBookmark, progressOf } from "@/lib/userdata/schema";
import { useUserData } from "@/lib/userdata/store";
import Footnotes from "./Footnotes";
import { usePrefs } from "./PrefsProvider";
import { NoteEditor, VerseActions } from "./VerseCard";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const arabicNumber = (n: number) => String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

/**
 * The verses of a page laid out like a printed mushaf: the Arabic text as one running block with a numbered marker
 * after each verse, and the translation in a numbered column beside it (below it on phones). Selecting a verse
 * (its marker or its number) shows that verse's actions in a bar fixed at the bottom of the screen.
 */
export default function MushafView({
  verses,
  surahNumber,
  playingN,
  onPlay,
  editions,
}: {
  verses: VerseView[];
  surahNumber: number;
  playingN: number | null;
  onPlay: (verse: VerseView) => void;
  editions: Record<string, { name: string; language: string; direction: "ltr" | "rtl" }>;
}) {
  const { t } = useI18n();
  const { prefs } = usePrefs();
  const data = useUserData();
  const [selected, setSelected] = useState<number | null>(null);
  const readUpTo = progressOf(data, surahNumber);
  // The numbered column only when it has text to show: with no translation chosen and no transliteration (the Arabic
  // interface's default) the Arabic takes the whole width instead of sitting beside a column of bare numbers.
  const side =
    (prefs.translation && verses.some((v) => v.translations.length > 0)) || (prefs.transliteration && verses.some((v) => v.transliteration));
  const current = verses.find((v) => v.number === selected) ?? null;
  const hiding = useHiding(surahNumber);
  const currentBookmark = current ? findBookmark(data, surahNumber, current.number) : undefined;

  const select = (n: number) => setSelected((s) => (s === n ? null : n));
  const markerClass = (n: number) => {
    const bookmarked = !!findBookmark(data, surahNumber, n);
    const state = selected === n || playingN === n ? "bg-primary text-white dark:text-[hsl(192_64%_8%)]" : bookmarked ? "text-gold" : "text-primary";
    return `mx-1 inline-block rounded-md px-1 align-middle font-arabic text-[0.7em] leading-none transition hover:bg-primary-soft ${state}`;
  };

  return (
    <section className="px-5 py-6 sm:px-8" aria-label={t("settings.layoutMushaf")}>
      {current && (
        <div role="toolbar" aria-label={t("mushaf.selected", { n: current.number })} className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-lg">
          <span className="font-medium">
            {t("mushaf.selected", { n: current.number })}
            <span className="ms-2 tabular-nums text-xs text-muted-foreground">
              {surahNumber}:{current.number}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <VerseActions verse={current} surahNumber={surahNumber} playing={playingN === current.number} onPlay={() => onPlay(current)} />
            <button type="button" onClick={() => setSelected(null)} className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-muted">
              {t("mushaf.close")}
            </button>
          </div>
          {currentBookmark && (
            <div className="w-full">
              <NoteEditor key={currentBookmark.note} surah={surahNumber} verse={current.number} note={currentBookmark.note} />
            </div>
          )}
        </div>
      )}

      <div className={side && prefs.arabic ? "grid gap-6 lg:grid-cols-[2fr_3fr]" : ""}>
        {prefs.arabic && (
          <p dir="rtl" lang="ar" translate="no" className="font-arabic text-justify text-[length:calc(2rem*var(--arabic-scale,1))] leading-[2.4] lg:order-2 sm:text-[length:calc(2.25rem*var(--arabic-scale,1))]">
            {verses.map((v) => (
              <Fragment key={v.number}>
                <span
                  id={side ? undefined : verseId(v.number)}
                  {...hiding.props("arabic", v.number, t("memorize.showVerse", { n: v.number }))}
                  className={`scroll-mt-24 rounded ${playingN === v.number ? "bg-primary-soft" : ""}`}
                >
                  {v.arabic}
                </span>
                <button
                  type="button"
                  onClick={() => select(v.number)}
                  aria-label={t("mushaf.verseActions", { n: v.number })}
                  aria-pressed={selected === v.number}
                  className={markerClass(v.number)}
                >
                  ﴿{arabicNumber(v.number)}﴾
                </button>{" "}
              </Fragment>
            ))}
          </p>
        )}

        {side && (
          <ol className="space-y-3 lg:order-1 lg:border-e lg:border-border lg:pe-6">
            {verses.map((v) => {
              const bookmark = findBookmark(data, surahNumber, v.number);
              const isRead = v.number <= readUpTo;
              return (
                <li
                  key={v.number}
                  id={verseId(v.number)}
                  translate="no"
                  className={`scroll-mt-24 rounded-xl border-s-4 px-3 py-1 text-[length:calc(15px*var(--latin-scale,1))] leading-relaxed ${
                    playingN === v.number ? "bg-primary-soft" : ""
                  } ${isRead ? "border-s-primary/50" : "border-s-transparent"}`}
                >
                  <button
                    type="button"
                    onClick={() => select(v.number)}
                    aria-label={t("mushaf.verseActions", { n: v.number })}
                    className={`me-2 font-display text-sm font-bold ${bookmark ? "text-gold" : "text-primary"} hover:underline`}
                  >
                    {v.number}.
                  </button>
                  {prefs.transliteration && v.transliteration && (
                    <span dir="ltr" {...hiding.props("translation", v.number, t("memorize.showVerse", { n: v.number }))} className="italic text-primary">
                      {v.transliteration}{" "}
                    </span>
                  )}
                  {prefs.translation &&
                    v.translations.map((tr, i) => (
                      <Fragment key={tr.edition}>
                        <span
                          lang={editions[tr.edition]?.language}
                          dir={editions[tr.edition]?.direction}
                          {...hiding.props("translation", v.number, t("memorize.showVerse", { n: v.number }))}
                          className={i > 0 ? "mt-1 block" : ""}
                        >
                          {v.translations.length > 1 && (
                            <span className="me-1 text-xs font-medium text-muted-foreground">{editions[tr.edition]?.name}:</span>
                          )}
                          {tr.text}
                        </span>
                        {tr.notes && <Footnotes notes={tr.notes} lang={editions[tr.edition]?.language} dir={editions[tr.edition]?.direction} />}
                      </Fragment>
                    ))}
                  {bookmark?.note && <span className="mt-1 block whitespace-pre-line text-sm text-muted-foreground">{bookmark.note}</span>}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}

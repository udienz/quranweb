"use client";

import { useHiding } from "@/lib/useHiding";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import Link from "next/link";
import { verseHref, verseId } from "@/lib/anchors";
import type { VerseView } from "@/lib/quran";
import { findBookmark, progressOf } from "@/lib/userdata/schema";
import { userDataActions, useUserData } from "@/lib/userdata/store";
import { usePrefs } from "./PrefsProvider";
import Footnotes from "./Footnotes";
import ArabicText, { RukuMark } from "./ArabicText";
import ShareMenu from "./ShareMenu";

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function IconButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-muted relative after:absolute after:-inset-1 after:rounded-full ${
        active ? "bg-primary-soft text-primary" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function NoteEditor({ surah, verse, note }: { surah: number; verse: number; note: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm font-medium text-primary hover:underline"
      >
        {note ? t("verse.note", { note }) : t("verse.addNote")}
      </button>
    );
  }
  return (
    <textarea
      autoFocus
      defaultValue={note}
      maxLength={500}
      rows={3}
      aria-label={t("verse.noteLabel")}
      placeholder={t("verse.notePlaceholder")}
      onBlur={(e) => {
        userDataActions.setBookmarkNote(surah, verse, e.target.value);
        setOpen(false);
      }}
      className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
    />
  );
}

/** The buttons of one verse: play, bookmark, mark as read, share (copy, link, share sheet, WhatsApp). Shared by the card and the mushaf view. */
export function VerseActions({
  verse,
  surahNumber,
  surahName,
  playing,
  onPlay,
  editions,
  menuUp = false,
}: {
  verse: VerseView;
  surahNumber: number;
  surahName: string;
  playing: boolean;
  onPlay: () => void;
  /** Name and direction of each edition in use, for the credit on the picture. */
  editions?: Record<string, { name: string; language: string; direction: "ltr" | "rtl" }>;
  /** Open the share menu above its button, for the bar at the bottom of the screen. */
  menuUp?: boolean;
}) {
  const { t } = useI18n();
  const data = useUserData();
  const n = verse.number;
  const bookmark = findBookmark(data, surahNumber, n);
  const readUpTo = progressOf(data, surahNumber);

  return (
    <div className="flex items-center">
      {/* A reciter with whole surahs only has no file for a single verse (issue #111): no play button for it. */}
      {verse.audio.length > 0 && (
        <IconButton label={playing ? t("verse.pause") : t("verse.play")} onClick={onPlay} active={playing}>
          {playing ? (
            <svg {...iconProps}>
              <path d="M8 5v14M16 5v14" />
            </svg>
          ) : (
            <svg {...iconProps}>
              <path d="M7 4.5v15l12-7.5z" />
            </svg>
          )}
        </IconButton>
      )}
      <IconButton
        label={bookmark ? t("verse.removeBookmark") : t("verse.bookmark")}
        onClick={() => userDataActions.toggleBookmark(surahNumber, n)}
        active={!!bookmark}
      >
        <svg {...iconProps} fill={bookmark ? "currentColor" : "none"}>
          <path d="M6 4h12v17l-6-4-6 4z" />
        </svg>
      </IconButton>
      <IconButton
        label={readUpTo === n ? t("verse.unmarkRead") : t("verse.markRead")}
        onClick={() => userDataActions.toggleReadUpTo(surahNumber, n)}
        active={readUpTo === n}
      >
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l3 3 5-6" />
        </svg>
      </IconButton>
      <ShareMenu
        surah={surahNumber}
        surahName={surahName}
        verse={n}
        arabic={verse.arabic}
        translations={verse.translations.map((tr) => tr.text)}
        card={
          verse.translations[0]
            ? {
                text: verse.translations[0].text,
                credit: editions?.[verse.translations[0].edition]?.name ?? "",
                dir: editions?.[verse.translations[0].edition]?.direction ?? "ltr",
              }
            : undefined
        }
        up={menuUp}
      />
    </div>
  );
}

export default function VerseCard({
  verse,
  surahNumber,
  surahName,
  mode,
  playing,
  onPlay,
  editions,
}: {
  verse: VerseView;
  surahNumber: number;
  /** The Latin name of the surah, for the citation when the verse is shared. */
  surahName: string;
  mode: "reading" | "tafsir";
  playing: boolean;
  onPlay: () => void;
  /** Name and language of each edition in use, for labels and the `lang` attribute. */
  editions: Record<string, { name: string; language: string; direction: "ltr" | "rtl" }>;
}) {
  const { t } = useI18n();
  const { prefs } = usePrefs();
  const data = useUserData();
  const n = verse.number;
  const hiding = useHiding(surahNumber);
  const showLabel = t("memorize.showVerse", { n });

  const bookmark = findBookmark(data, surahNumber, n);
  const readUpTo = progressOf(data, surahNumber);
  const isRead = n <= readUpTo;

  return (
    <article
      id={verseId(n)}
      className={`quran-reading__verse scroll-mt-24 border-b border-s-4 border-border px-5 py-6 last:border-b-0 sm:px-8 ${
        isRead ? "border-s-primary/50" : "border-s-transparent"
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 rotate-45 items-center justify-center rounded-md bg-primary-soft text-primary">
            <span className="-rotate-45 font-display text-xs font-bold">{n}</span>
          </span>
          <span className="tabular-nums text-xs text-muted-foreground">
            {surahNumber}:{n}
          </span>
          {isRead && <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">{t("verse.read")}</span>}
        </div>
        <VerseActions verse={verse} surahNumber={surahNumber} surahName={surahName} playing={playing} onPlay={onPlay} editions={editions} />
      </div>

      {mode === "reading" ? (
        <>
          {prefs.arabic && (
            <p dir="rtl" lang="ar" translate="no" {...hiding.props("arabic", n, showLabel)} className="font-arabic mb-4 text-right text-[length:calc(2.25rem*var(--arabic-scale,1))] leading-[2.4] sm:text-[length:calc(2.6rem*var(--arabic-scale,1))]">
              <ArabicText verse={verse} />
              <RukuMark verse={verse} />
            </p>
          )}
          {prefs.transliteration && verse.transliteration && (
            <p dir="ltr" translate="no" {...hiding.props("translation", n, showLabel)} className="mb-3 text-[length:calc(15px*var(--latin-scale,1))] italic leading-relaxed text-primary">{verse.transliteration}</p>
          )}
          {prefs.translation &&
            verse.translations.map((tr) => (
              <div key={tr.edition} className="mb-2 last:mb-0">
                {verse.translations.length > 1 && (
                  <p className="text-xs font-medium text-muted-foreground">{editions[tr.edition]?.name}</p>
                )}
                <p lang={editions[tr.edition]?.language} dir={editions[tr.edition]?.direction} translate="no" {...hiding.props("translation", n, showLabel)} className="text-[length:calc(1rem*var(--latin-scale,1))] leading-relaxed">
                  {tr.text}
                </p>
                {tr.notes && <Footnotes notes={tr.notes} lang={editions[tr.edition]?.language} dir={editions[tr.edition]?.direction} />}
              </div>
            ))}
        </>
      ) : (
        <>
          <p dir="rtl" lang="ar" translate="no" className="font-arabic mb-4 text-right text-[length:calc(1.5rem*var(--arabic-scale,1))] leading-loose text-muted-foreground">
            <ArabicText verse={verse} />
          </p>
          {verse.tafsirSharedWith ? (
            // One passage explains several verses and sits on the first of them (Tafsir Ibn Kathir): point there.
            <p className="text-sm text-muted-foreground">
              <Link href={verseHref(surahNumber, verse.tafsirSharedWith)} className="font-medium text-primary hover:underline">
                {t("verse.tafsirSharedWith", { verse: `${surahNumber}:${verse.tafsirSharedWith}` })}
              </Link>
            </p>
          ) : (
            <p dir="auto" translate="no" className="whitespace-pre-line text-[length:calc(1rem*var(--latin-scale,1))] leading-relaxed">
              {verse.tafsir ?? t("verse.tafsirNotSelected")}
            </p>
          )}
        </>
      )}

      {bookmark && <NoteEditor key={bookmark.note} surah={surahNumber} verse={n} note={bookmark.note} />}
    </article>
  );
}

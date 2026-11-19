"use client";

import { useHiding } from "@/lib/useHiding";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { verseHref, verseId } from "@/lib/anchors";
import type { VerseView } from "@/lib/quran";
import { findBookmark, progressOf } from "@/lib/userdata/schema";
import { userDataActions, useUserData } from "@/lib/userdata/store";
import { usePrefs } from "./PrefsProvider";
import Footnotes from "./Footnotes";

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

/** The buttons of one verse: play, bookmark, mark as read, copy text, copy link. Shared by the card and the mushaf view. */
export function VerseActions({
  verse,
  surahNumber,
  playing,
  onPlay,
}: {
  verse: VerseView;
  surahNumber: number;
  playing: boolean;
  onPlay: () => void;
}) {
  const { t } = useI18n();
  const data = useUserData();
  const [copied, setCopied] = useState(false);
  const n = verse.number;
  const bookmark = findBookmark(data, surahNumber, n);
  const readUpTo = progressOf(data, surahNumber);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  const copyText = () =>
    copy(`${verse.arabic}\n\n${verse.translations.map((tr) => tr.text).join("\n\n")}\n\n(QS ${surahNumber}:${n})`);
  const copyLink = () => copy(`${location.origin}${verseHref(surahNumber, n)}`);

  return (
    <div className="flex items-center">
      {copied && <span className="mr-1 text-xs text-primary">{t("verse.copied")}</span>}
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
      <IconButton label={t("verse.copy")} onClick={copyText}>
        <svg {...iconProps}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V6a2 2 0 0 1 2-2h9" />
        </svg>
      </IconButton>
      <IconButton label={t("verse.copyLink")} onClick={copyLink}>
        <svg {...iconProps}>
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        </svg>
      </IconButton>
    </div>
  );
}

export default function VerseCard({
  verse,
  surahNumber,
  mode,
  playing,
  onPlay,
  editions,
}: {
  verse: VerseView;
  surahNumber: number;
  mode: "reading" | "tafsir";
  playing: boolean;
  onPlay: () => void;
  /** Name and language of each edition in use, for labels and the `lang` attribute. */
  editions: Record<string, { name: string; language: string }>;
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
      className={`scroll-mt-24 border-b border-l-4 border-border px-5 py-6 last:border-b-0 sm:px-8 ${
        isRead ? "border-l-primary/50" : "border-l-transparent"
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
        <VerseActions verse={verse} surahNumber={surahNumber} playing={playing} onPlay={onPlay} />
      </div>

      {mode === "reading" ? (
        <>
          {prefs.arabic && (
            <p dir="rtl" lang="ar" translate="no" {...hiding.props("arabic", n, showLabel)} className="font-arabic mb-4 text-right text-[length:calc(2.25rem*var(--arabic-scale,1))] leading-[2.4] sm:text-[length:calc(2.6rem*var(--arabic-scale,1))]">
              {verse.arabic}
            </p>
          )}
          {prefs.transliteration && verse.transliteration && (
            <p translate="no" {...hiding.props("translation", n, showLabel)} className="mb-3 text-[length:calc(15px*var(--latin-scale,1))] italic leading-relaxed text-primary">{verse.transliteration}</p>
          )}
          {prefs.translation &&
            verse.translations.map((tr) => (
              <div key={tr.edition} className="mb-2 last:mb-0">
                {verse.translations.length > 1 && (
                  <p className="text-xs font-medium text-muted-foreground">{editions[tr.edition]?.name}</p>
                )}
                <p lang={editions[tr.edition]?.language} translate="no" {...hiding.props("translation", n, showLabel)} className="text-[length:calc(1rem*var(--latin-scale,1))] leading-relaxed">
                  {tr.text}
                </p>
                {tr.notes && <Footnotes notes={tr.notes} lang={editions[tr.edition]?.language} />}
              </div>
            ))}
        </>
      ) : (
        <>
          <p dir="rtl" lang="ar" translate="no" className="font-arabic mb-4 text-right text-[length:calc(1.5rem*var(--arabic-scale,1))] leading-loose text-muted-foreground">
            {verse.arabic}
          </p>
          <p translate="no" className="whitespace-pre-line text-[length:calc(1rem*var(--latin-scale,1))] leading-relaxed">
            {verse.tafsir ?? t("verse.tafsirNotSelected")}
          </p>
        </>
      )}

      {bookmark && <NoteEditor key={bookmark.note} surah={surahNumber} verse={n} note={bookmark.note} />}
    </article>
  );
}

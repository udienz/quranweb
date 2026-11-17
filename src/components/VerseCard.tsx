"use client";

import { useState } from "react";
import type { VerseView } from "@/lib/quran";
import { findBookmark } from "@/lib/userdata/schema";
import { userDataActions, useUserData } from "@/lib/userdata/store";
import { usePrefs } from "./PrefsProvider";

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
      className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-muted ${
        active ? "bg-primary-soft text-primary" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function NoteEditor({ surah, ayat, note }: { surah: number; ayat: number; note: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm font-medium text-primary hover:underline"
      >
        {note ? `Catatan: ${note}` : "Tambah catatan"}
      </button>
    );
  }
  return (
    <textarea
      autoFocus
      defaultValue={note}
      maxLength={500}
      rows={3}
      aria-label="Catatan untuk ayat ini"
      placeholder="Catatan pribadi (disimpan di browser ini)"
      onBlur={(e) => {
        userDataActions.setBookmarkNote(surah, ayat, e.target.value);
        setOpen(false);
      }}
      className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
    />
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
  mode: "bacaan" | "tafsir";
  playing: boolean;
  onPlay: () => void;
  /** Nama dan bahasa tiap edisi yang dipakai, untuk label dan atribut `lang`. */
  editions: Record<string, { name: string; language: string }>;
}) {
  const { prefs } = usePrefs();
  const data = useUserData();
  const [copied, setCopied] = useState(false);
  const n = verse.number;

  const bookmark = findBookmark(data, surahNumber, n);
  const readUpTo = data.progress[surahNumber]?.readUpTo ?? 0;
  const isRead = n <= readUpTo;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const copyText = () =>
    copy(`${verse.arabic}\n\n${verse.translations.map((t) => t.text).join("\n\n")}\n\n(QS ${surahNumber}:${n})`);
  const copyLink = () => copy(`${location.origin}/surah/${surahNumber}#ayat-${n}`);

  return (
    <article
      id={`ayat-${n}`}
      className={`scroll-mt-24 border-b border-l-4 border-border px-5 py-6 last:border-b-0 sm:px-8 ${
        isRead ? "border-l-primary/50" : "border-l-transparent"
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 rotate-45 items-center justify-center rounded-md bg-primary-soft text-primary">
            <span className="-rotate-45 font-display text-xs font-bold">{n}</span>
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {surahNumber}:{n}
          </span>
          {copied && <span className="text-xs text-primary">Tersalin</span>}
          {isRead && <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">sudah dibaca</span>}
        </div>
        <div className="flex items-center">
          <IconButton label={playing ? "Jeda audio" : "Putar audio"} onClick={onPlay} active={playing}>
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
            label={bookmark ? "Hapus penanda ayat" : "Beri penanda ayat"}
            onClick={() => userDataActions.toggleBookmark(surahNumber, n)}
            active={!!bookmark}
          >
            <svg {...iconProps} fill={bookmark ? "currentColor" : "none"}>
              <path d="M6 4h12v17l-6-4-6 4z" />
            </svg>
          </IconButton>
          <IconButton
            label={readUpTo === n ? "Batalkan tanda sudah dibaca" : "Tandai sudah dibaca sampai ayat ini"}
            onClick={() => userDataActions.toggleReadUpTo(surahNumber, n)}
            active={readUpTo === n}
          >
            <svg {...iconProps}>
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12.5l3 3 5-6" />
            </svg>
          </IconButton>
          <IconButton label="Salin ayat" onClick={copyText}>
            <svg {...iconProps}>
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V6a2 2 0 0 1 2-2h9" />
            </svg>
          </IconButton>
          <IconButton label="Salin tautan ayat" onClick={copyLink}>
            <svg {...iconProps}>
              <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
            </svg>
          </IconButton>
        </div>
      </div>

      {mode === "bacaan" ? (
        <>
          {prefs.arab && (
            <p dir="rtl" lang="ar" className="font-arabic mb-4 text-right text-[2.25rem] leading-[2.4] sm:text-[2.6rem]">
              {verse.arabic}
            </p>
          )}
          {prefs.latin && verse.transliteration && (
            <p className="mb-3 text-[15px] italic leading-relaxed text-primary">{verse.transliteration}</p>
          )}
          {prefs.terjemahan &&
            verse.translations.map((t) => (
              <div key={t.edition} className="mb-2 last:mb-0">
                {verse.translations.length > 1 && (
                  <p className="text-xs font-medium text-muted-foreground">{editions[t.edition]?.name}</p>
                )}
                <p lang={editions[t.edition]?.language} className="leading-relaxed">
                  {t.text}
                </p>
              </div>
            ))}
        </>
      ) : (
        <>
          <p dir="rtl" lang="ar" className="font-arabic mb-4 text-right text-2xl leading-loose text-muted-foreground">
            {verse.arabic}
          </p>
          <p className="whitespace-pre-line leading-relaxed">
            {verse.tafsir ?? "Tafsir tidak dipilih. Pilih tafsir di Pengaturan bacaan."}
          </p>
        </>
      )}

      {bookmark && <NoteEditor key={bookmark.note} surah={surahNumber} ayat={n} note={bookmark.note} />}
    </article>
  );
}

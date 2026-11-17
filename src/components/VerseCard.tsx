"use client";

import { useState } from "react";
import type { VerseView } from "@/lib/quran";
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
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-muted ${
        active ? "bg-primary-soft text-primary" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function VerseCard({
  verse,
  surahNumber,
  mode,
  playing,
  onPlay,
}: {
  verse: VerseView;
  surahNumber: number;
  mode: "bacaan" | "tafsir";
  playing: boolean;
  onPlay: () => void;
}) {
  const { prefs } = usePrefs();
  const [copied, setCopied] = useState(false);
  const n = verse.number;

  async function copyText() {
    const translation = verse.translations.map((t) => t.text).join("\n\n");
    const text = `${verse.arabic}\n\n${translation}\n\n(QS ${surahNumber}:${n})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/surah/${surahNumber}#ayat-${n}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <article id={`ayat-${n}`} className="scroll-mt-24 border-b border-border px-5 py-6 last:border-b-0 sm:px-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 rotate-45 items-center justify-center rounded-md bg-primary-soft text-primary">
            <span className="-rotate-45 font-display text-xs font-bold">{n}</span>
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {surahNumber}:{n}
          </span>
          {copied && <span className="text-xs text-primary">Tersalin</span>}
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
              <p key={t.edition} className="leading-relaxed">
                {t.text}
              </p>
            ))}
        </>
      ) : (
        <>
          <p dir="rtl" lang="ar" className="font-arabic mb-4 text-right text-2xl leading-loose text-muted-foreground">
            {verse.arabic}
          </p>
          <p className="whitespace-pre-line leading-relaxed">
            {verse.tafsir || "Tafsir untuk ayat ini belum tersedia."}
          </p>
        </>
      )}
    </article>
  );
}

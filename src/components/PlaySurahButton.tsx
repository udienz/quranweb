"use client";

import { useI18n } from "@/lib/i18n/client";

/** Play or pause the recording of a whole surah (one file, so no verse is followed while it plays). */
export default function PlaySurahButton({ playing, onToggle, onDark = false }: { playing: boolean; onToggle: () => void; onDark?: boolean }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={playing}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
        onDark ? "border-white/15 text-gold hover:bg-white/10" : "border-border text-primary hover:bg-muted"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {playing ? <path d="M8 5v14M16 5v14" /> : <path d="M7 4.5v15l12-7.5z" />}
      </svg>
      {playing ? t("reader.pauseSurah") : t("reader.playSurah")}
    </button>
  );
}

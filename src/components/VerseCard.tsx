"use client";

import { useState } from "react";
import type { Verse } from "@/lib/quran";

export default function VerseCard({ verse }: { verse: Verse }) {
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirExpanded, setTafsirExpanded] = useState(false);

  return (
    <article
      id={`ayat-${verse.number.inSurah}`}
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {verse.number.inSurah}
        </span>
        <audio
          controls
          preload="none"
          className="h-8 flex-1 max-w-[220px]"
          src={verse.audio.primary}
          onError={(e) => {
            const fallback = verse.audio.secondary[0];
            if (fallback && e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
        >
          Browser Anda tidak mendukung pemutar audio.
        </audio>
      </div>

      <p dir="rtl" lang="ar" className="mb-3 text-right text-2xl leading-loose">
        {verse.text.arab}
      </p>

      <p className="mb-2 text-sm italic text-zinc-500 dark:text-zinc-400">
        {verse.text.transliteration.en}
      </p>

      <p className="text-zinc-800 dark:text-zinc-200">{verse.translation.id}</p>

      <button
        type="button"
        onClick={() => setShowTafsir((v) => !v)}
        className="mt-3 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        {showTafsir ? "Sembunyikan tafsir" : "Lihat tafsir"}
      </button>

      {showTafsir && (
        <div className="mt-2 rounded-md bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <p>{verse.tafsir.id.short}</p>
          {verse.tafsir.id.long && verse.tafsir.id.long !== verse.tafsir.id.short && (
            <>
              {tafsirExpanded && (
                <p className="mt-2 whitespace-pre-line border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  {verse.tafsir.id.long}
                </p>
              )}
              <button
                type="button"
                onClick={() => setTafsirExpanded((v) => !v)}
                className="mt-2 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                {tafsirExpanded ? "Tutup tafsir lengkap" : "Baca tafsir lengkap"}
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

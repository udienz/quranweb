"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { SurahDetail } from "@/lib/quran";
import VerseCard from "./VerseCard";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export default function SurahReader({
  surah,
  prev,
  next,
}: {
  surah: SurahDetail;
  prev: number | null;
  next: number | null;
}) {
  const [mode, setMode] = useState<"bacaan" | "tafsir">("bacaan");
  const [playingN, setPlayingN] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fallbackTried = useRef(false);

  function startVerse(index: number) {
    const audio = audioRef.current;
    const verse = surah.verses[index];
    if (!audio || !verse) return;
    fallbackTried.current = false;
    audio.src = verse.audio.primary;
    setPlayingN(verse.number.inSurah);
    audio.play().catch(() => setPlayingN(null));
    document.getElementById(`ayat-${verse.number.inSurah}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function togglePlay(index: number) {
    const audio = audioRef.current;
    const verse = surah.verses[index];
    if (!audio || !verse) return;
    if (playingN === verse.number.inSurah) {
      audio.pause();
      setPlayingN(null);
    } else {
      startVerse(index);
    }
  }

  function onEnded() {
    const idx = surah.verses.findIndex((v) => v.number.inSurah === playingN);
    if (idx >= 0 && idx < surah.verses.length - 1) startVerse(idx + 1);
    else setPlayingN(null);
  }

  function onError() {
    const audio = audioRef.current;
    const verse = surah.verses.find((v) => v.number.inSurah === playingN);
    const fallback = verse?.audio.secondary[0];
    if (audio && fallback && !fallbackTried.current) {
      fallbackTried.current = true;
      audio.src = fallback;
      audio.play().catch(() => setPlayingN(null));
    } else {
      setPlayingN(null);
    }
  }

  function jump(n: number) {
    document.getElementById(`ayat-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
              <span className="-rotate-45 font-display text-sm font-bold text-gold">{surah.number}</span>
            </span>
            <div>
              <h1 className="font-display text-xl font-bold">{surah.name.transliteration.id}</h1>
              <p className="font-mono text-xs text-white/70">
                {surah.numberOfVerses} ayat · {surah.revelation.id}
              </p>
            </div>
          </div>
          <p className="font-arabic text-3xl text-gold" dir="rtl" lang="ar">
            {surah.name.long}
          </p>
        </div>
        <p className="mt-3 text-sm text-white/75">{surah.name.translation.id}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button type="button" className={tabClass(mode === "bacaan")} onClick={() => setMode("bacaan")}>
              Bacaan
            </button>
            <button type="button" className={tabClass(mode === "tafsir")} onClick={() => setMode("tafsir")}>
              Tafsir
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/85">
            <span className="sr-only">Lompat ke ayat</span>
            <select
              defaultValue=""
              onChange={(e) => e.target.value && jump(Number(e.target.value))}
              className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-gold outline-none [&>option]:bg-[hsl(192_64%_9%)] [&>option]:text-white"
            >
              <option value="" disabled>
                Ayat…
              </option>
              {surah.verses.map((v) => (
                <option key={v.number.inSurah} value={v.number.inSurah}>
                  Ayat {v.number.inSurah}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {mode === "bacaan" && surah.number !== 1 && surah.number !== 9 && (
          <p dir="rtl" lang="ar" className="font-arabic border-b border-border py-8 text-center text-4xl text-primary">
            {BISMILLAH}
          </p>
        )}
        {surah.verses.map((verse, i) => (
          <VerseCard
            key={verse.number.inSurah}
            verse={verse}
            surahNumber={surah.number}
            mode={mode}
            playing={playingN === verse.number.inSurah}
            onPlay={() => togglePlay(i)}
          />
        ))}
      </div>

      <nav className="mt-6 flex justify-between text-sm font-medium">
        {prev ? (
          <Link href={`/surah/${prev}`} className="rounded-full border border-border bg-card px-4 py-2 text-primary hover:bg-muted">
            &larr; Surat sebelumnya
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/surah/${next}`} className="rounded-full border border-border bg-card px-4 py-2 text-primary hover:bg-muted">
            Surat berikutnya &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

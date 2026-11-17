"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { SurahView } from "@/lib/quran";
import { meaningOf, revelationLabel } from "@/lib/quran/labels";
import VerseCard from "./VerseCard";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export default function SurahReader({
  view,
  prev,
  next,
}: {
  view: SurahView;
  prev: number | null;
  next: number | null;
}) {
  const [mode, setMode] = useState<"bacaan" | "tafsir">("bacaan");
  const [playingN, setPlayingN] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Indeks URL audio yang sedang dicoba untuk ayat yang diputar (0 = utama).
  const audioIndex = useRef(0);
  const { meta, verses } = view;
  // Kelompokkan nama edisi per atribusi: "Teks Arab, Terjemahan: Kemenag RI, melalui EQuran.id".
  const groups = new Map<string, string[]>();
  for (const e of view.editions) groups.set(e.source.attribution, [...(groups.get(e.source.attribution) ?? []), e.name]);
  groups.set(view.qari.source.attribution, [...(groups.get(view.qari.source.attribution) ?? []), `Audio ${view.qari.name}`]);
  const attributions = [...groups].map(([attribution, names]) => `${names.join(", ")}: ${attribution}`);

  function startVerse(index: number) {
    const audio = audioRef.current;
    const verse = verses[index];
    if (!audio || !verse?.audio[0]) return;
    audioIndex.current = 0;
    audio.src = verse.audio[0];
    setPlayingN(verse.number);
    audio.play().catch(() => setPlayingN(null));
    document.getElementById(`ayat-${verse.number}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function togglePlay(index: number) {
    const audio = audioRef.current;
    const verse = verses[index];
    if (!audio || !verse) return;
    if (playingN === verse.number) {
      audio.pause();
      setPlayingN(null);
    } else {
      startVerse(index);
    }
  }

  function onEnded() {
    const idx = verses.findIndex((v) => v.number === playingN);
    if (idx >= 0 && idx < verses.length - 1) startVerse(idx + 1);
    else setPlayingN(null);
  }

  function onError() {
    const audio = audioRef.current;
    const verse = verses.find((v) => v.number === playingN);
    const next = verse?.audio[audioIndex.current + 1];
    if (audio && next) {
      audioIndex.current += 1;
      audio.src = next;
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
              <span className="-rotate-45 font-display text-sm font-bold text-gold">{meta.number}</span>
            </span>
            <div>
              <h1 className="font-display text-xl font-bold">{meta.name.latin}</h1>
              <p className="font-mono text-xs text-white/70">
                {meta.ayatCount} ayat · {revelationLabel(meta.revelation)}
              </p>
            </div>
          </div>
          <p className="font-arabic text-3xl text-gold" dir="rtl" lang="ar">
            {meta.name.arabic}
          </p>
        </div>
        <p className="mt-3 text-sm text-white/75">{meaningOf(meta)}</p>
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
              {verses.map((v) => (
                <option key={v.number} value={v.number}>
                  Ayat {v.number}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {mode === "bacaan" && meta.number !== 1 && meta.number !== 9 && (
          <p dir="rtl" lang="ar" className="font-arabic border-b border-border py-8 text-center text-4xl text-primary">
            {BISMILLAH}
          </p>
        )}
        {verses.map((verse, i) => (
          <VerseCard
            key={verse.number}
            verse={verse}
            surahNumber={meta.number}
            mode={mode}
            playing={playingN === verse.number}
            onPlay={() => togglePlay(i)}
          />
        ))}
        <p className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground sm:px-8">
          Sumber: {attributions.join("; ")}.
        </p>
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

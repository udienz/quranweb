"use client";

import { useEffect, useRef, useState } from "react";
import { getAudio } from "@/lib/audio";
import { formatTime } from "@/lib/audio-time";
import { useI18n } from "@/lib/i18n/client";

interface Shell {
  playing: boolean;
  onToggle: () => void;
  reciter: string;
  /** The surah's name, which names the slider for a screen reader. */
  surahName: string;
  slider: { value: number; max: number; disabled: boolean; valueText: string; onInput: (value: number) => void; onCommit: () => void };
  /** The text at the end of the bar: the time, or the verse. */
  end: string;
}

/**
 * The play bar of a surah: a round gold button, what it plays, a slider and the time or the verse. It shows the state of
 * what already plays (one recording of the whole surah, or the verse by verse player) and adds no way to play of its own.
 */
function PlayerShell({ playing, onToggle, reciter, surahName, slider, end }: Shell) {
  const { t } = useI18n();
  const label = playing ? t("reader.pauseSurah") : t("reader.playSurah");
  const pct = slider.max > 0 ? Math.min(100, Math.max(0, (slider.value / slider.max) * 100)) : 0;
  return (
    <div className="surah-player on-dark">
      <button type="button" onClick={onToggle} aria-pressed={playing} aria-label={label} className="surah-player__button">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {playing ? <path d="M8 5h3v14H8zM13 5h3v14h-3z" /> : <path d="M8 5.5v13l11-6.5z" />}
        </svg>
      </button>
      <p className="surah-player__label">
        <span>{label}</span>
        <span translate="no">{reciter}</span>
      </p>
      <input
        type="range"
        className="surah-player__range"
        min={0}
        max={slider.max > 0 ? slider.max : 1}
        step="any"
        value={slider.value}
        disabled={slider.disabled}
        aria-label={surahName}
        aria-valuetext={slider.valueText}
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
        onChange={(e) => slider.onInput(Number(e.target.value))}
        onPointerUp={slider.onCommit}
        onKeyUp={slider.onCommit}
      />
      <span className="surah-player__end" dir="ltr">
        {end}
      </span>
    </div>
  );
}

/** One recording of the whole surah: the slider seeks in it and the end of the bar shows the time. */
export function WholeSurahPlayer({
  url,
  playing,
  onToggle,
  reciter,
  surahName,
}: {
  url: string;
  playing: boolean;
  onToggle: () => void;
  reciter: string;
  surahName: string;
}) {
  const [progress, setProgress] = useState({ time: 0, duration: 0 });
  // Only the shared audio element knows how far it is. A verse that starts on it replaces the surah, and the bar goes back to the start.
  const urlRef = useRef(url);
  useEffect(() => {
    urlRef.current = url;
  });
  useEffect(() => {
    const audio = getAudio();
    const read = () => {
      const ours = audio.src === new URL(urlRef.current, window.location.href).href;
      setProgress(ours ? { time: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : 0 } : { time: 0, duration: 0 });
    };
    const events = ["timeupdate", "durationchange", "loadedmetadata", "emptied", "ended", "play", "pause"] as const;
    events.forEach((name) => audio.addEventListener(name, read));
    return () => events.forEach((name) => audio.removeEventListener(name, read));
  }, []);
  const known = progress.duration > 0;
  const end = `${formatTime(progress.time)} / ${known ? formatTime(progress.duration) : "--:--"}`;
  return (
    <PlayerShell
      playing={playing}
      onToggle={onToggle}
      reciter={reciter}
      surahName={surahName}
      end={end}
      slider={{
        value: progress.time,
        max: progress.duration,
        disabled: !known,
        valueText: end,
        onInput: (value) => {
          getAudio().currentTime = value;
          setProgress((p) => ({ ...p, time: value }));
        },
        onCommit: () => {},
      }}
    />
  );
}

/** A reciter with a file per verse and none for the whole surah: the slider runs over the verses and moving it starts that verse. */
export function VerseSurahPlayer({
  verse,
  verseCount,
  playing,
  onToggle,
  onGoTo,
  reciter,
  surahName,
}: {
  /** The verse that plays or that was paused, or null before anything started. */
  verse: number | null;
  verseCount: number;
  playing: boolean;
  onToggle: () => void;
  onGoTo: (verse: number) => void;
  reciter: string;
  surahName: string;
}) {
  const { t, tn } = useI18n();
  // While the slider is dragged it shows where it is; the verse starts when it is let go (starting one per step would restart the audio).
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = dragging ?? verse ?? 1;
  const end = verse === null && dragging === null ? tn("common.verses", verseCount) : `${t("reader.verseOption", { number: Math.round(shown) })} / ${verseCount}`;
  return (
    <PlayerShell
      playing={playing}
      onToggle={onToggle}
      reciter={reciter}
      surahName={surahName}
      end={end}
      slider={{
        value: shown,
        max: verseCount,
        disabled: false,
        valueText: end,
        onInput: (value) => setDragging(Math.max(1, Math.round(value))),
        onCommit: () => {
          if (dragging !== null && dragging !== verse) onGoTo(dragging);
          setDragging(null);
        },
      }}
    />
  );
}

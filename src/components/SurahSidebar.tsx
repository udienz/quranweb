"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SurahSummary } from "@/lib/quran";
import { usePrefs, type Prefs } from "./PrefsProvider";

const PREF_LABELS: { key: keyof Prefs; label: string }[] = [
  { key: "arab", label: "Teks Arab" },
  { key: "latin", label: "Transliterasi" },
  { key: "terjemahan", label: "Terjemahan" },
];

export default function SurahSidebar({
  surahs,
  current,
  showPrefs = true,
}: {
  surahs: SurahSummary[];
  current?: number;
  showPrefs?: boolean;
}) {
  const [q, setQ] = useState("");
  const { prefs, toggle } = usePrefs();
  const listRef = useRef<HTMLUListElement>(null);

  // Gulirkan daftar ke surat yang sedang dibuka (hanya di dalam daftar, bukan halaman).
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>("[aria-current=page]");
    if (list && active) list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return surahs;
    return surahs.filter(
      (s) =>
        String(s.number) === term ||
        s.name.transliteration.id.toLowerCase().includes(term) ||
        s.name.translation.id.toLowerCase().includes(term),
    );
  }, [q, surahs]);

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="px-4 pt-4 font-display font-semibold">Daftar surat</h2>
        <div className="px-4 py-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau nomor…"
            aria-label="Cari surat"
            className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <ul ref={listRef} className="thin-scroll relative max-h-[420px] overflow-y-auto border-t border-border">
          {filtered.map((s) => {
            const active = s.number === current;
            return (
              <li key={s.number}>
                <Link
                  href={`/surah/${s.number}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm transition hover:bg-muted ${
                    active ? "border-gold bg-primary-soft" : "border-transparent"
                  }`}
                >
                  <span className="w-8 font-mono text-xs text-muted-foreground">
                    {String(s.number).padStart(3, "0")}
                  </span>
                  <span className="flex-1 font-medium">{s.name.transliteration.id}</span>
                  <span className="font-arabic text-lg text-muted-foreground" dir="rtl">
                    {s.name.short}
                  </span>
                </Link>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">Surat tidak ditemukan.</li>
          )}
        </ul>
      </section>

      {showPrefs && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 font-display font-semibold">Preferensi bacaan</h2>
          <ul className="flex flex-col gap-3">
            {PREF_LABELS.map(({ key, label }) => (
              <li key={key} className="flex items-center justify-between text-sm">
                <span id={`pref-${key}`}>{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[key]}
                  aria-labelledby={`pref-${key}`}
                  onClick={() => toggle(key)}
                  className={`relative h-6 w-11 rounded-full transition ${prefs[key] ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      prefs[key] ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

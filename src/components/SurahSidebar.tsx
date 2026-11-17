"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SurahMeta } from "@/lib/quran";
import { meaningOf } from "@/lib/quran/labels";

export default function SurahSidebar({
  surahs,
  current,
}: {
  surahs: SurahMeta[];
  current?: number;
}) {
  const [q, setQ] = useState("");
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
        s.name.latin.toLowerCase().includes(term) ||
        meaningOf(s).toLowerCase().includes(term),
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
                  <span className="flex-1 font-medium">{s.name.latin}</span>
                  <span className="font-arabic text-lg text-muted-foreground" dir="rtl">
                    {s.name.arabic}
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
    </div>
  );
}

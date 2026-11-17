"use client";

import Link from "next/link";
import type { SurahMeta } from "@/lib/quran";
import { useUserData } from "@/lib/userdata/store";

/** Kartu "Lanjutkan membaca" di beranda; tidak tampil sebelum ada bacaan tersimpan. */
export default function ContinueReading({ surahs }: { surahs: SurahMeta[] }) {
  const { lastRead } = useUserData();
  const surah = lastRead && surahs.find((s) => s.number === lastRead.surah);
  if (!lastRead || !surah) return null;

  return (
    <Link
      href={`/surah/${lastRead.surah}#ayat-${lastRead.ayat}`}
      className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition hover:border-primary/50 hover:shadow-sm"
    >
      <span className="flex h-11 w-11 shrink-0 rotate-45 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <span className="-rotate-45 font-display text-sm font-bold">{surah.number}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Lanjutkan membaca</span>
        <span className="block truncate font-display text-lg font-semibold">
          {surah.name.latin}, ayat {lastRead.ayat}
        </span>
      </span>
      <span className="font-arabic text-2xl text-primary" dir="rtl">
        {surah.name.arabic}
      </span>
    </Link>
  );
}

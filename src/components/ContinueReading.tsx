"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { verseHref } from "@/lib/anchors";
import type { SurahMeta } from "@/lib/quran";
import { useUserData } from "@/lib/userdata/store";

/** The "Continue reading" card on the home page; hidden until a reading position is saved. */
export default function ContinueReading({ surahs }: { surahs: SurahMeta[] }) {
  const { t } = useI18n();
  const { lastRead } = useUserData();
  const surah = lastRead && surahs.find((s) => s.number === lastRead.surah);
  if (!lastRead || !surah) return null;

  return (
    <Link
      href={verseHref(lastRead.surah, lastRead.verse)}
      className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition hover:border-primary/50 hover:shadow-sm"
    >
      <span className="flex h-11 w-11 shrink-0 rotate-45 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <span className="-rotate-45 font-display text-sm font-bold">{surah.number}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("continueReading.label")}</span>
        <span className="block truncate font-display text-lg font-semibold">
          {t("continueReading.position", { surah: surah.name.latin, verse: lastRead.verse })}
        </span>
      </span>
      <span className="font-arabic text-2xl text-primary" dir="rtl" lang="ar" translate="no">
        {surah.name.arabic}
      </span>
    </Link>
  );
}

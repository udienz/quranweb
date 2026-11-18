"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { SurahMeta } from "@/lib/quran";
import { meaningOf } from "@/lib/quran/labels";

export default function SurahGrid({ surahs }: { surahs: SurahMeta[] }) {
  const { t, tn, locale } = useI18n();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return surahs;
    return surahs.filter(
      (s) =>
        String(s.number) === term ||
        s.name.latin.toLowerCase().includes(term) ||
        meaningOf(s, locale).toLowerCase().includes(term),
    );
  }, [q, surahs, locale]);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">{t("home.listTitle")}</h2>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("home.searchPlaceholder")}
          aria-label={t("home.searchLabel")}
          className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary sm:w-72"
        />
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <li key={s.number}>
            <Link
              href={`/surah/${s.number}`}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3.5 transition hover:border-primary/50 hover:shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 rotate-45 items-center justify-center rounded-md bg-primary-soft text-primary">
                <span className="-rotate-45 font-display text-xs font-bold">{s.number}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{s.name.latin}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {meaningOf(s, locale)} · {tn("common.verses", s.verseCount)} · {t(`revelation.${s.revelation}`)}
                </span>
              </span>
              <span className="font-arabic text-2xl text-primary" dir="rtl" lang="ar" translate="no">
                {s.name.arabic}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p className="py-10 text-center text-muted-foreground">{t("home.noResults")}</p>}
    </section>
  );
}

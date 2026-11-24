"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { SurahMeta } from "@/lib/quran";
import { meaningOf } from "@/lib/quran/labels";
import ReferenceLink, { useEnterToGo, useReference } from "./ReferenceLink";

export default function SurahGrid({ surahs }: { surahs: SurahMeta[] }) {
  const { t, tn, locale } = useI18n();
  const [q, setQ] = useState("");
  const reference = useReference(q, surahs);
  const onKeyDown = useEnterToGo(reference);

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
    <section className="home-editorial__surahs">
      <div className="home-editorial__section-head mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="home-editorial__eyebrow mb-2 text-[10px] font-bold uppercase tracking-[0.2em]">{t("meta.title")}</p>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("home.listTitle")}</h2>
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("home.searchPlaceholder")}
          aria-label={t("home.searchLabel")}
          className="home-editorial__surah-search w-full rounded-full border px-5 py-3 text-sm outline-none transition sm:w-72"
        />
      </div>
      {reference && (
        <ReferenceLink
          target={reference}
          className="mb-4 flex rounded-xl border border-primary/40 bg-primary-soft px-4 py-3 font-medium text-primary hover:border-primary"
        />
      )}
      <ul className="home-editorial__surah-list grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {filtered.map((s) => (
          <li key={s.number}>
            <Link href={`/surah/${s.number}`} className="home-editorial__surah group flex min-h-[5.25rem] items-center gap-4 border-b px-1 py-3 transition">
              <span className="home-editorial__surah-number flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">{String(s.number).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[15px] font-semibold">{s.name.latin}</span>
                <span className="home-editorial__surah-meta mt-1 block truncate text-xs">
                  {meaningOf(s, locale)} <span aria-hidden>·</span> {tn("common.verses", s.verseCount)} <span aria-hidden>·</span> {t(`revelation.${s.revelation}`)}
                </span>
              </span>
              <span className="home-editorial__surah-arabic font-arabic text-[1.8rem]" dir="rtl" lang="ar" translate="no">{s.name.arabic}</span>
              <span className="home-editorial__surah-arrow ms-1 text-sm transition group-hover:translate-x-1" aria-hidden>↗</span>
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && !reference && <p className="py-10 text-center text-muted-foreground">{t("home.noResults")}</p>}
    </section>
  );
}

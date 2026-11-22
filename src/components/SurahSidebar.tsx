"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { SurahMeta } from "@/lib/quran";
import { meaningOf } from "@/lib/quran/labels";
import ReferenceLink, { useEnterToGo, useReference } from "./ReferenceLink";

export default function SurahSidebar({
  surahs,
  current,
}: {
  surahs: SurahMeta[];
  current?: number;
}) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  // Scroll the list to the open surah (inside the list only, not the page).
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>("[aria-current=page]");
    if (list && active) list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
  }, []);

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
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="px-4 pt-4 font-display font-semibold">{t("home.listTitle")}</h2>
        <div className="px-4 py-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("home.searchPlaceholder")}
            aria-label={t("home.searchLabel")}
            className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        {reference && (
          <ReferenceLink
            target={reference}
            className="mx-4 mb-3 block rounded-xl border border-primary/40 bg-primary-soft px-3 py-2 text-sm font-medium text-primary hover:border-primary"
          />
        )}
        <ul ref={listRef} className="thin-scroll relative max-h-[420px] overflow-y-auto border-t border-border">
          {filtered.map((s) => {
            const active = s.number === current;
            return (
              <li key={s.number}>
                <Link
                  href={`/surah/${s.number}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 border-s-2 px-4 py-2.5 text-sm transition hover:bg-muted ${
                    active ? "border-gold bg-primary-soft" : "border-transparent"
                  }`}
                >
                  <span className="w-8 tabular-nums text-xs text-muted-foreground">
                    {String(s.number).padStart(3, "0")}
                  </span>
                  <span className="flex-1 font-medium">{s.name.latin}</span>
                  <span className="font-arabic text-lg text-muted-foreground" dir="rtl" lang="ar" translate="no">
                    {s.name.arabic}
                  </span>
                </Link>
              </li>
            );
          })}
          {filtered.length === 0 && !reference && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">{t("home.noResults")}</li>
          )}
        </ul>
      </section>
    </div>
  );
}

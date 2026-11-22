"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { mushafHref } from "@/lib/anchors";
import { useI18n } from "@/lib/i18n/client";
import { MUSHAF_PAGES } from "@/lib/surah-number";

/** Previous and next page, the page number, and a box to go to any page (1 to 604), above or below a page of the mushaf. */
export default function MushafPageNav({ page }: { page: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [typed, setTyped] = useState("");

  function go(e: FormEvent) {
    e.preventDefault();
    const n = Number(typed);
    if (Number.isInteger(n) && n >= 1 && n <= MUSHAF_PAGES) {
      setTyped("");
      router.push(mushafHref(n));
    }
  }

  const pill = "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary hover:bg-muted";
  return (
    <nav aria-label={t("pagination.label")} className="grid grid-cols-2 items-center gap-3 sm:flex sm:justify-between">
      {page > 1 ? (
        <Link href={mushafHref(page - 1)} className={`${pill} justify-self-start`} rel="prev">
          <span aria-hidden className="inline-block rtl:-scale-x-100">&larr;</span> {t("pagination.previous")}
        </Link>
      ) : (
        <span className="w-24" />
      )}
      <form onSubmit={go} className="order-last col-span-2 flex items-center justify-center gap-2 sm:order-none">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span dir="ltr" className="tabular-nums">
            {page} / {MUSHAF_PAGES}
          </span>
          <span className="sr-only">{t("mushaf.goToPage")}</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MUSHAF_PAGES}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={t("mushaf.goToPage")}
            className="w-32 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <button type="submit" className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-primary hover:bg-muted">
          {t("mushaf.go")}
        </button>
      </form>
      {page < MUSHAF_PAGES ? (
        <Link href={mushafHref(page + 1)} className={`${pill} justify-self-end`} rel="next">
          {t("pagination.next")} <span aria-hidden className="inline-block rtl:-scale-x-100">&rarr;</span>
        </Link>
      ) : (
        <span className="w-24" />
      )}
    </nav>
  );
}

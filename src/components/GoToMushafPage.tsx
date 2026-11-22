"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { mushafHref } from "@/lib/anchors";
import { useI18n } from "@/lib/i18n/client";
import { MUSHAF_PAGES } from "@/lib/surah-number";

/** A box to open any of the 604 pages of the printed mushaf, beside the surah list. */
export default function GoToMushafPage() {
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

  return (
    <form onSubmit={go} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
      <label className="flex-1">
        <span className="sr-only">{t("mushaf.goToPage")}</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MUSHAF_PAGES}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={`${t("mushaf.goToPage")} (1–${MUSHAF_PAGES})`}
          className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      <button type="submit" className="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-primary hover:bg-muted">
        {t("mushaf.go")}
      </button>
    </form>
  );
}

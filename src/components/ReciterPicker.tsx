"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Qari } from "@/lib/quran";
import { matchesReciter, orderReciters } from "@/lib/quran/reciter-order";
import { useDismiss } from "@/lib/useDismiss";

/**
 * Choose the reciter from a long list: a button shows the one chosen; it opens a search box and the list, the best known
 * reciters first, then the others by name. The search looks at the name in Latin and Arabic letters.
 */
export default function ReciterPicker({ qaris, value, onChange }: { qaris: Qari[]; value: string; onChange: (id: string) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);
  useDismiss(open, close, box);
  const { bestKnown, others } = useMemo(() => orderReciters(qaris), [qaris]);
  const current = qaris.find((q) => q.id === value);
  const filter = (list: Qari[]) => list.filter((q) => matchesReciter(q, query));
  const groups = [
    { label: t("settings.qariBestKnown"), list: filter(bestKnown) },
    { label: t("settings.qariOthers"), list: filter(others) },
  ].filter((g) => g.list.length > 0);
  const choose = (id: string) => {
    onChange(id);
    close();
  };

  return (
    <div ref={box} className="relative text-sm">
      <span id={labelId} className="mb-1 block font-medium">
        {t("settings.qari")}
      </span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-describedby={`${labelId}-value`}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left outline-none focus:border-primary"
      >
        <span id={`${labelId}-value`} className="truncate">
          {current?.name ?? value}
        </span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div role="dialog" aria-label={t("settings.qari")} className="absolute left-0 right-0 top-full z-40 mt-1 rounded-xl border border-border bg-card p-2 shadow-lg">
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              const first = groups[0]?.list[0];
              if (e.key === "Enter" && first) {
                e.preventDefault();
                choose(first.id);
              }
            }}
            placeholder={t("settings.qariSearch")}
            aria-label={t("settings.qariSearch")}
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 outline-none focus:border-primary"
          />
          <div className="thin-scroll max-h-72 overflow-y-auto">
            {groups.length === 0 && <p className="px-2 py-3 text-muted-foreground">{t("settings.qariNone")}</p>}
            {groups.map((g) => (
              <div key={g.label} className="mb-1 last:mb-0">
                <p className="px-2 pb-1 pt-1.5 text-xs font-semibold text-muted-foreground">{g.label}</p>
                <ul>
                  {g.list.map((q) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        aria-current={q.id === value}
                        onClick={() => choose(q.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-background ${
                          q.id === value ? "font-semibold text-primary" : ""
                        }`}
                      >
                        <span>{q.name}</span>
                        {q.arabicName && (
                          <span dir="rtl" lang="ar" translate="no" className="font-arabic shrink-0 text-base text-muted-foreground">
                            {q.arabicName}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

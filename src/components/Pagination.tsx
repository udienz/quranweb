"use client";

import Link from "next/link";
import { pageHref } from "@/lib/anchors";
import { useI18n } from "@/lib/i18n/client";
import { pageItems } from "@/lib/pagination";

/** The pages of a surah: previous and next, the page numbers, and which verses are shown. Nothing for a one-page surah. */
export default function Pagination({
  surah,
  page,
  count,
  from,
  to,
  total,
}: {
  surah: number;
  page: number;
  count: number;
  from: number;
  to: number;
  total: number;
}) {
  const { t } = useI18n();
  if (count <= 1) return null;

  // 36px to look at, 44px or more to tap: the ::after layer reaches 6px out from inside the 1px border.
  const box = "flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium relative after:absolute after:-inset-1.5 after:rounded-full";
  const link = `${box} border border-border bg-card text-primary hover:bg-muted`;
  const off = `${box} border border-transparent text-muted-foreground/50`;

  return (
    <nav aria-label={t("pagination.label")} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <p className="text-sm text-muted-foreground">{t("pagination.range", { from, to, total })}</p>
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link href={pageHref(surah, page - 1)} className={link} aria-label={t("pagination.previous")} rel="prev">
              &larr;
            </Link>
          ) : (
            <span className={off} aria-hidden>
              &larr;
            </span>
          )}
        </li>
        {pageItems(page, count).map((item, i) => (
          <li key={item === "gap" ? `gap-${i}` : item}>
            {item === "gap" ? (
              <span className={`${box} text-muted-foreground`} aria-hidden>
                …
              </span>
            ) : item === page ? (
              <span
                className={`${box} bg-primary text-white dark:text-[hsl(192_64%_8%)]`}
                aria-current="page"
                aria-label={t("pagination.page", { number: item })}
              >
                {item}
              </span>
            ) : (
              <Link href={pageHref(surah, item)} className={link} aria-label={t("pagination.page", { number: item })}>
                {item}
              </Link>
            )}
          </li>
        ))}
        <li>
          {page < count ? (
            <Link href={pageHref(surah, page + 1)} className={link} aria-label={t("pagination.next")} rel="next">
              &rarr;
            </Link>
          ) : (
            <span className={off} aria-hidden>
              &rarr;
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

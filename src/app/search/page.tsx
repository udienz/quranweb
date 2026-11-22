import type { Metadata } from "next";
import Link from "next/link";
import { verseHref } from "@/lib/anchors";
import { getI18n } from "@/lib/i18n/server";
import { getQuran } from "@/lib/quran";
import { parseReference } from "@/lib/reference";
import { MARK_END, MARK_START, search, type SearchSource } from "@/lib/search/search";
import { surahFromSegment } from "@/lib/surah-number";

// Rendered per request: the query is in the address, and the index is read from disk.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  // A page of results is not a page to index (robots.txt also keeps crawlers out of /search).
  return { title: `${t("search.title")} | ${t("meta.title")}`, robots: { index: false, follow: true } };
}

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] : value) ?? "";

/** A snippet with its matches marked. The text is shown as the index holds it (the Arabic without its vowel marks). */
function Snippet({ snippet, source }: { snippet: string; source: SearchSource }) {
  const parts = snippet.split(new RegExp(`(${MARK_START}.*?${MARK_END})`, "g")).filter(Boolean);
  const arabic = source === "ar";
  const language = source === "translit" ? undefined : source;
  return (
    <p
      lang={language}
      dir={arabic ? "rtl" : "ltr"}
      translate="no"
      className={arabic ? "font-arabic text-right text-2xl leading-loose" : `leading-relaxed ${source === "translit" ? "italic text-primary" : ""}`}
    >
      {parts.map((part, i) =>
        part.startsWith(MARK_START) ? (
          <mark key={i} className="rounded bg-gold/30 px-0.5 text-foreground">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = first(params.q).trim().slice(0, 200);
  const surah = surahFromSegment(first(params.surah)) ?? undefined;
  const page = Number.parseInt(first(params.page), 10) || 1;
  const { t, locale } = await getI18n();
  const surahs = await getQuran().getSurahList();

  const outcome = query ? search({ query, locale, surah, page }) : null;
  // A typed reference ("2:255", "baqarah 255") is offered as a link, whatever the search finds.
  const ref = query ? parseReference(query, surahs) : null;
  const refMeta = ref && surahs.find((s) => s.number === ref.surah);

  const link = (to: number) => {
    const q = new URLSearchParams({ q: query });
    if (surah) q.set("surah", String(surah));
    if (to > 1) q.set("page", String(to));
    return `/search?${q}`;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-display text-2xl font-semibold">{t("search.title")}</h1>

      <form action="/search" method="get" role="search" className="mb-6 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={200}
          placeholder={t("search.placeholder")}
          aria-label={t("search.title")}
          className="min-w-0 flex-1 basis-56 rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary"
        />
        <select
          name="surah"
          defaultValue={surah ? String(surah) : ""}
          aria-label={t("search.surah")}
          className="max-w-full rounded-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">{t("search.allSurahs")}</option>
          {surahs.map((s) => (
            <option key={s.number} value={s.number}>
              {s.number}. {s.name.latin}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 dark:text-[hsl(192_64%_8%)]">
          {t("search.button")}
        </button>
      </form>

      {ref && refMeta && (
        <Link
          href={ref.verse === null ? `/surah/${ref.surah}` : verseHref(ref.surah, ref.verse)}
          className="mb-4 flex rounded-2xl border border-primary/40 bg-primary-soft px-4 py-3 font-medium text-primary hover:border-primary"
        >
          {t("home.goTo", { reference: ref.verse === null ? refMeta.name.latin : `${refMeta.name.latin} ${ref.surah}:${ref.verse}` })}
        </Link>
      )}

      {!query && <p className="py-8 text-center text-muted-foreground">{t("search.hint")}</p>}
      {outcome?.status === "unavailable" && <p className="py-8 text-center text-muted-foreground">{t("search.unavailable")}</p>}
      {outcome?.status === "short" && <p className="py-8 text-center text-muted-foreground">{t("search.short")}</p>}

      {outcome?.status === "ok" && (
        <>
          <p role="status" className="mb-3 text-sm text-muted-foreground">
            {outcome.total > 0 ? t("search.found", { count: outcome.total }) : t("search.none")}
          </p>
          <ol className="space-y-3">
            {outcome.hits.map((hit) => {
              const meta = surahs.find((s) => s.number === hit.surah);
              return (
                <li key={`${hit.surah}:${hit.verse}`} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <Link href={verseHref(hit.surah, hit.verse)} className="mb-1 inline-block font-medium text-primary hover:underline">
                    {meta?.name.latin ?? hit.surah} {hit.surah}:{hit.verse}
                  </Link>
                  <Snippet snippet={hit.snippet} source={hit.source} />
                </li>
              );
            })}
          </ol>
          {outcome.pages > 1 && (
            <nav className="mt-5 flex items-center justify-between text-sm font-medium" aria-label={t("pagination.label")}>
              {outcome.page > 1 ? (
                <Link href={link(outcome.page - 1)} className="rounded-full border border-border bg-card px-4 py-2 text-primary hover:bg-muted">
                  <span aria-hidden className="inline-block rtl:-scale-x-100">&larr;</span> {t("pagination.previous")}
                </Link>
              ) : (
                <span />
              )}
              <span className="tabular-nums text-muted-foreground">
                {outcome.page} / {outcome.pages}
              </span>
              {outcome.page < outcome.pages ? (
                <Link href={link(outcome.page + 1)} className="rounded-full border border-border bg-card px-4 py-2 text-primary hover:bg-muted">
                  {t("pagination.next")} <span aria-hidden className="inline-block rtl:-scale-x-100">&rarr;</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

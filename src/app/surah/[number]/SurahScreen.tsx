import type { Metadata } from "next";
import { meaningOf } from "@/lib/quran/labels";
import { shareMetadata } from "@/lib/site";
import { mushafHref, pageHref } from "@/lib/anchors";
import { LAYOUT_COOKIE, parseLayout, SIDEBAR_COOKIE } from "@/lib/layout";
import { PAGING_COOKIE, parsePaging } from "@/lib/paging";
import { mushafPageOf } from "@/lib/quran/mushaf-pages";
import { cookies } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { surahFromSegment } from "@/lib/surah-number";
import { getI18n, getLocale } from "@/lib/i18n/server";
import { clampPage, PAGE_SIZE, pageCount, pageRange } from "@/lib/pagination";
import { getQuran } from "@/lib/quran";
import { parseSelectionCookie, SELECTION_COOKIE } from "@/lib/selection";
import SettingsPanel from "@/components/SettingsPanel";
import SurahLayout from "@/components/SurahLayout";
import SurahReader from "@/components/SurahReader";
import SurahSidebar from "@/components/SurahSidebar";

/**
 * What a link to a surah shows in a preview: its name and meaning, then how many verses it has and where it was revealed.
 * The canonical address is `/surah/N` for every page of it (`/surah/2/page/2` is the same surah), so the pages do not compete.
 */
export async function surahMetadata(params: Promise<{ number: string }>): Promise<Metadata> {
  const number = surahFromSegment((await params).number);
  if (number === null) return {};
  const [{ t, tn, locale }, surahs] = await Promise.all([getI18n(), getQuran().getSurahList()]);
  const meta = surahs.find((s) => s.number === number);
  if (!meta) return {};
  const meaning = meaningOf(meta, locale);
  return shareMetadata({
    title: `${meta.name.latin} (${meaning}) | ${t("meta.title")}`,
    description: `${meaning} · ${tn("common.verses", meta.verseCount)} · ${t(`revelation.${meta.revelation}`)}`,
    path: `/surah/${number}`,
    locale,
  });
}


/**
 * One page of verses of a surah. `/surah/2` and `/surah/2/page/3` render it; `legacy` is set for the first, which an old link
 * `/surah/2?page=3` can reach: that is sent on to `/surah/2/page/3`.
 */
export default async function SurahScreen({ number, rawPage, legacy }: { number: string; rawPage: string | string[] | undefined; legacy: boolean }) {
  // proxy.ts already answers 404 for anything else; this stays for a request that reaches the page another way.
  const surahNumber = surahFromSegment(number);
  if (surahNumber === null) notFound();

  // The reader's edition and reciter choice is in a cookie; anything that is not valid
  // against the catalog is ignored and the defaults are used.
  const quran = getQuran();
  const locale = await getLocale();
  const jar = await cookies();
  const saved = parseSelectionCookie(jar.get(SELECTION_COOKIE)?.value);
  const layout = parseLayout(jar.get(LAYOUT_COOKIE)?.value);
  const paging = parsePaging(jar.get(PAGING_COOKIE)?.value);
  let selection;
  try {
    selection = quran.resolveSelection(saved, locale);
  } catch {
    selection = quran.resolveSelection({}, locale);
  }

  // Only the verses of the requested page are built and sent to the browser.
  const surahs = await quran.getSurahList();
  const meta = surahs.find((s) => s.number === surahNumber);
  if (!meta) notFound();
  const count = pageCount(meta.verseCount);
  const page = clampPage(rawPage, meta.verseCount);
  // A reader who chose the pages of the mushaf is taken to the page that has this surah's start, or, from an old link to a page
  // of 10 verses (`?page=3`), the page that has that page's first verse. Without the page table the surah is shown as usual.
  if (paging === "mushaf") {
    const pages = await quran.getMushafPages().catch(() => null);
    const target = pages && mushafPageOf(pages, { surah: surahNumber, verse: Math.min((page - 1) * PAGE_SIZE + 1, meta.verseCount) });
    if (target) redirect(mushafHref(target));
  }
  // An old link `?page=3` and `/surah/2/page/1` are the same page as the clean address.
  if (legacy && page > 1) permanentRedirect(pageHref(surahNumber, page));
  if (!legacy && page === 1) permanentRedirect(pageHref(surahNumber, 1));
  const view = await quran.getSurahView(surahNumber, selection, locale, pageRange(page, meta.verseCount));
  const catalog = quran.getCatalog();
  // Where the juz start and end, for "Play a juz". Without them the rest of the page still works.
  const juzs = await quran.getJuzList().catch((error) => {
    console.error("The juz boundaries are not available:", error);
    return [];
  });
  const { t } = await getI18n();

  return (
    <SurahLayout
      initiallyCollapsed={jar.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      side={
        // The column can be taller than the screen; it scrolls on its own so every setting stays reachable.
        <div className="thin-scroll sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-4 overflow-y-auto pe-1">
          <SurahSidebar surahs={surahs} current={surahNumber} />
          <SettingsPanel catalog={catalog} selection={view.selection} layout={layout} paging={paging} />
        </div>
      }
    >
        {/* Phones and tablets: the same surah list and settings as the side panel, folded above the surah. */}
        <details className="mb-4 rounded-2xl border border-border bg-card lg:hidden">
          <summary className="cursor-pointer px-4 py-3 font-display text-sm font-semibold">{t("reader.panel")}</summary>
          <div className="flex flex-col gap-4 px-2 pb-2">
            <SurahSidebar surahs={surahs} current={surahNumber} />
            <SettingsPanel catalog={catalog} selection={view.selection} layout={layout} paging={paging} />
          </div>
        </details>
        <SurahReader
          view={view}
          page={page}
          pageCount={count}
          prev={surahNumber > 1 ? surahNumber - 1 : null}
          next={surahNumber < 114 ? surahNumber + 1 : null}
          layout={layout}
          juzs={juzs}
        />
    </SurahLayout>
  );
}

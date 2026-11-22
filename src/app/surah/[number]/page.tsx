import type { Metadata } from "next";
import { LAYOUT_COOKIE, parseLayout, SIDEBAR_COOKIE } from "@/lib/layout";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { surahFromSegment } from "@/lib/surah-number";
import { getI18n, getLocale } from "@/lib/i18n/server";
import { clampPage, pageCount, pageRange } from "@/lib/pagination";
import { getQuran } from "@/lib/quran";
import { meaningOf } from "@/lib/quran/labels";
import { shareMetadata } from "@/lib/site";
import { parseSelectionCookie, SELECTION_COOKIE } from "@/lib/selection";
import SettingsPanel from "@/components/SettingsPanel";
import SurahLayout from "@/components/SurahLayout";
import SurahReader from "@/components/SurahReader";
import SurahSidebar from "@/components/SurahSidebar";

// Rendered per request, see the note in app/page.tsx.
export const instant = false;

/**
 * What a link to a surah shows in a preview: its name and meaning, then how many verses it has and where it was revealed.
 * The canonical address is `/surah/N` for every page of it (`?page=2` is the same surah), so the pages do not compete.
 */
export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
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

export default async function SurahPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { number } = await params;
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
  const page = clampPage((await searchParams).page, meta.verseCount);
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
          <SettingsPanel catalog={catalog} selection={view.selection} layout={layout} />
        </div>
      }
    >
        {/* Phones and tablets: the same surah list and settings as the side panel, folded above the surah. */}
        <details className="mb-4 rounded-2xl border border-border bg-card lg:hidden">
          <summary className="cursor-pointer px-4 py-3 font-display text-sm font-semibold">{t("reader.panel")}</summary>
          <div className="flex flex-col gap-4 px-2 pb-2">
            <SurahSidebar surahs={surahs} current={surahNumber} />
            <SettingsPanel catalog={catalog} selection={view.selection} layout={layout} />
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

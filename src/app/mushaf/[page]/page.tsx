import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import MushafPageReader, { type MushafPageSegment } from "@/components/MushafPageReader";
import SettingsPanel from "@/components/SettingsPanel";
import SurahLayout from "@/components/SurahLayout";
import SurahSidebar from "@/components/SurahSidebar";
import { mushafHref, verseHref } from "@/lib/anchors";
import { getI18n } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/translate";
import { LAYOUT_COOKIE, parseLayout, SIDEBAR_COOKIE } from "@/lib/layout";
import { PAGING_COOKIE, parsePaging } from "@/lib/paging";
import { getQuran, languageDefaults } from "@/lib/quran";
import type { Edition, MushafPageRef } from "@/lib/quran";
import { parseSelectionCookie, SELECTION_COOKIE } from "@/lib/selection";
import { shareMetadata } from "@/lib/site";
import { mushafPageFromSegment, VERSE_COUNTS } from "@/lib/surah-number";

// Rendered per request, like the surah page (the text comes from the sources, and the reader's choices from a cookie).
export const instant = false;

type Params = Promise<{ page: string }>;

/** The surahs a page has and the verses of each: a page can hold the end of one surah and the start of the next. */
function parts(ref: MushafPageRef): { surah: number; from: number; to: number }[] {
  const list = [];
  for (let surah = ref.start.surah; surah <= ref.end.surah; surah++) {
    list.push({
      surah,
      from: surah === ref.start.surah ? ref.start.verse : 1,
      to: surah === ref.end.surah ? ref.end.verse : VERSE_COUNTS[surah - 1],
    });
  }
  return list;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = mushafPageFromSegment((await params).page);
  if (page === null) return {};
  const { t, locale } = await getI18n();
  const quran = getQuran();
  const [pages, surahs] = await Promise.all([quran.getMushafPages(), quran.getSurahList()]);
  const ref = pages.find((p) => p.page === page);
  if (!ref) return {};
  const description = parts(ref)
    .map((p) => `${surahs.find((s) => s.number === p.surah)?.name.latin ?? p.surah} ${p.surah}:${p.from}–${p.to}`)
    .join(" · ");
  return shareMetadata({ title: `${t("mushaf.page", { page })} | ${t("meta.title")}`, description, path: mushafHref(page), locale });
}

/** One page of the printed Madinah mushaf (604 in all), with the reader's chosen editions. */
export default async function MushafPage({ params }: { params: Params }) {
  const page = mushafPageFromSegment((await params).page);
  if (page === null) notFound();
  const { t, locale } = await getI18n();
  const quran = getQuran();
  const pages = await quran.getMushafPages();
  const ref = pages.find((p) => p.page === page);
  if (!ref) notFound();

  const jar = await cookies();
  const saved = parseSelectionCookie(jar.get(SELECTION_COOKIE)?.value);
  let selection;
  try {
    selection = quran.resolveSelection(saved, locale);
  } catch {
    selection = quran.resolveSelection({}, locale);
  }
  // The reading page has no tafsir tab: only what a page of the mushaf shows is loaded.
  const light = quran.resolveSelection({ ...selection, tafsir: null }, locale);

  const views = await Promise.all(parts(ref).map((p) => quran.getSurahView(p.surah, light, locale, { from: p.from, to: p.to })));
  const segments: MushafPageSegment[] = views.map((v) => ({ meta: v.meta, verses: v.verses, surahAudio: v.surahAudio }));
  const editions = new Map<string, Edition>();
  for (const v of views) for (const e of v.editions) editions.set(e.id, e);
  const unavailable = [...new Map(views.flatMap((v) => v.unavailable).map((e) => [e.id, localized(e.name, locale)])).values()];
  const juzs = await quran.getJuzList().catch((error) => {
    console.error("The juz boundaries are not available:", error);
    return [];
  });

  // The same side panel as a surah page (issue #125), so a reader can change a setting or go back to pages of 10 verses
  // without opening Settings. Those pages start at the verse this page starts with.
  const surahs = await quran.getSurahList();
  const onPage = parts(ref).map((p) => p.surah);
  const settings = (
    <SettingsPanel
      catalog={quran.getCatalog()}
      selection={selection}
      layout={parseLayout(jar.get(LAYOUT_COOKIE)?.value)}
      paging={parsePaging(jar.get(PAGING_COOKIE)?.value)}
      languageDefaults={languageDefaults(locale)}
      versesHref={verseHref(ref.start.surah, ref.start.verse)}
    />
  );

  return (
    <SurahLayout
      initiallyCollapsed={jar.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      side={
        <div className="thin-scroll sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-4 overflow-y-auto pe-1">
          <SurahSidebar surahs={surahs} current={onPage} />
          {settings}
        </div>
      }
    >
      {/* Phones and tablets: the same surah list and settings, folded above the page. */}
      <details className="mb-4 rounded-2xl border border-border bg-card lg:hidden">
        <summary className="cursor-pointer px-4 py-3 font-display text-sm font-semibold">{t("reader.panel")}</summary>
        <div className="flex flex-col gap-4 px-2 pb-2">
          <SurahSidebar surahs={surahs} current={onPage} />
          {settings}
        </div>
      </details>
      <MushafPageReader
        page={page}
        segments={segments}
        pages={pages}
        juzs={juzs}
        editions={[...editions.values()]}
        qari={views[0].qari.name}
        unavailable={unavailable}
      />
    </SurahLayout>
  );
}

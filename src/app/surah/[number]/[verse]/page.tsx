import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Footnotes from "@/components/Footnotes";
import ShareMenu from "@/components/ShareMenu";
import { verseHref, versePageHref } from "@/lib/anchors";
import { getI18n } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/translate";
import { getQuran } from "@/lib/quran";
import { parseSelectionCookie, SELECTION_COOKIE } from "@/lib/selection";
import { excerpt, shareMetadata } from "@/lib/site";
import ArabicText, { RukuMark } from "@/components/ArabicText";
import PrefGate from "@/components/PrefGate";
import { surahFromSegment, VERSE_COUNTS, verseFromSegment } from "@/lib/surah-number";

// Rendered per request, like the surah page (the text comes from the sources, and the reader's choices from a cookie).
export const instant = false;

type Params = Promise<{ number: string; verse: string }>;

/** The surah and verse of the address, or null (proxy.ts already answers 404 for a wrong one; this is for any other way in). */
function parse({ number, verse }: { number: string; verse: string }): { surah: number; verse: number } | null {
  const surah = surahFromSegment(number);
  if (surah === null) return null;
  const v = verseFromSegment(surah, verse);
  return v === null ? null : { surah, verse: v };
}

/** One verse as the reader has chosen to see it (no tafsir): the Arabic, the transliteration (while it is on) and the translations. */
async function loadVerse(surah: number, verse: number, locale: string) {
  const quran = getQuran();
  const saved = parseSelectionCookie((await cookies()).get(SELECTION_COOKIE)?.value);
  let chosen;
  try {
    chosen = quran.resolveSelection(saved, locale);
  } catch {
    chosen = quran.resolveSelection({}, locale);
  }
  const view = await quran.getSurahView(surah, quran.resolveSelection({ ...chosen, tafsir: null }, locale), locale, { from: verse, to: verse });
  return { view, verse: view.verses[0] };
}

/**
 * What a link to a verse shows in a preview: the surah and the verse number as the title, and the start of the translation
 * as the description (the Arabic when no translation is chosen). The footnote markers ("[252]") are left out of the preview
 * only; the page shows the text as published.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const ref = parse(await params);
  if (!ref) return {};
  const { t, locale } = await getI18n();
  try {
    const { view, verse } = await loadVerse(ref.surah, ref.verse, locale);
    const first = verse.translations[0]?.text.replace(/\s*\[\d+\]/g, "");
    return shareMetadata({
      title: `${view.meta.name.latin} ${ref.surah}:${ref.verse} | ${t("meta.title")}`,
      description: excerpt(first || verse.arabic, first ? 180 : 120),
      path: versePageHref(ref.surah, ref.verse),
      locale,
      type: "article",
    });
  } catch {
    // The text could not be read: the page then fails the same way, and the layout's preview stays.
    return {};
  }
}

/** The verse before or after, across the edge of a surah. */
function neighbour(surah: number, verse: number, step: -1 | 1): { surah: number; verse: number } | null {
  const v = verse + step;
  if (v >= 1 && v <= VERSE_COUNTS[surah - 1]) return { surah, verse: v };
  const s = surah + step;
  if (s < 1 || s > 114) return null;
  return { surah: s, verse: step === 1 ? 1 : VERSE_COUNTS[s - 1] };
}

/** One verse on its own page: the address to share, with its own preview; the link back leads on to the surah. */
export default async function VersePage({ params }: { params: Params }) {
  const ref = parse(await params);
  if (!ref) notFound();
  const { t, locale } = await getI18n();
  const { view, verse } = await loadVerse(ref.surah, ref.verse, locale);
  if (!verse) notFound();
  const { meta } = view;
  const editions = new Map(view.editions.map((e) => [e.id, e]));
  const prev = neighbour(ref.surah, ref.verse, -1);
  const next = neighbour(ref.surah, ref.verse, 1);
  const link = "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary hover:bg-muted";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <p className="mb-3 text-sm">
        <Link href="/" className="font-medium text-primary hover:underline">
          {t("home.listTitle")}
        </Link>
        {" / "}
        <Link href={`/surah/${ref.surah}`} className="font-medium text-primary hover:underline">
          {meta.name.latin}
        </Link>
      </p>
      <h1 className="mb-4 font-display text-2xl font-semibold">
        {meta.name.latin} {ref.surah}:{ref.verse}
      </h1>

      <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p dir="rtl" lang="ar" translate="no" className="font-arabic text-right text-[length:calc(2.25rem*var(--arabic-scale,1))] leading-[2.4] sm:text-[length:calc(2.6rem*var(--arabic-scale,1))]">
          <ArabicText verse={verse} />
          <RukuMark verse={verse} />
        </p>
        {verse.transliteration && (
          // Like the reader: hidden until the reader turns the transliteration on (issue #126).
          <PrefGate pref="transliteration">
            <p dir="ltr" translate="no" className="mt-3 text-[length:calc(15px*var(--latin-scale,1))] italic leading-relaxed text-primary">
              {verse.transliteration}
            </p>
          </PrefGate>
        )}
        {verse.translations.map((tr) => {
          const edition = editions.get(tr.edition);
          return (
            <div key={tr.edition} className="mt-4 border-t border-border pt-3">
              {edition && <p className="mb-1 text-xs text-muted-foreground">{localized(edition.name, locale)}</p>}
              <p lang={edition?.language} dir={edition?.direction} translate="no" className="text-[length:calc(1rem*var(--latin-scale,1))] leading-relaxed">
                {tr.text}
              </p>
              {tr.notes && <Footnotes notes={tr.notes} lang={edition?.language} dir={edition?.direction} />}
            </div>
          );
        })}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <Link href={verseHref(ref.surah, ref.verse)} className="text-sm font-medium text-primary hover:underline">
            {t("verse.readInSurah")}
          </Link>
          <ShareMenu
            surah={ref.surah}
            surahName={meta.name.latin}
            verse={ref.verse}
            arabic={verse.arabic}
            translations={verse.translations.map((tr) => tr.text)}
            card={
              verse.translations[0]
                ? {
                    text: verse.translations[0].text,
                    credit: editions.get(verse.translations[0].edition) ? localized(editions.get(verse.translations[0].edition)!.name, locale) : "",
                    dir: editions.get(verse.translations[0].edition)?.direction ?? "ltr",
                  }
                : undefined
            }
          />
        </div>
      </article>

      <nav className="mt-4 flex justify-between gap-3">
        {prev ? (
          <Link href={versePageHref(prev.surah, prev.verse)} className={link}>
            <span aria-hidden className="inline-block rtl:-scale-x-100">&larr;</span> {t("verse.previousVerse")}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={versePageHref(next.surah, next.verse)} className={link}>
            {t("verse.nextVerse")} <span aria-hidden className="inline-block rtl:-scale-x-100">&rarr;</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

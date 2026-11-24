import Link from "next/link";
import { verseHref, versePageHref } from "@/lib/anchors";
import { getI18n } from "@/lib/i18n/server";
import { meaningOf } from "@/lib/quran/labels";
import ArabicText, { RukuMark } from "./ArabicText";
import type { SurahView } from "@/lib/quran/types";

/**
 * The verse of the day: the Arabic text and the reader's first translation, the reference as a link to the verse's own page, and a
 * link to read it in the surah. Only shows text a source gave, as it gave it.
 */
export default async function DailyVerse({ view }: { view: SurahView }) {
  const { t, locale } = await getI18n();
  const { meta, verses, editions } = view;
  const verse = verses[0];
  if (!verse) return null;
  const translation = view.selection.translations[0];
  const edition = editions.find((e) => e.id === translation);
  const text = verse.translations.find((x) => x.edition === translation)?.text;

  return (
    <section aria-labelledby="daily-verse" className="mb-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p id="daily-verse" className="text-sm font-medium text-muted-foreground">
        {t("home.daily.title")}
      </p>
      <p dir="rtl" lang="ar" translate="no" className="font-arabic mt-3 text-right text-[length:calc(1.75rem*var(--arabic-scale,1))] leading-[2.1]">
        <ArabicText verse={verse} />
        <RukuMark verse={verse} />
      </p>
      {text && (
        <p lang={edition?.language} dir={edition?.direction} translate="no" className="mt-2 text-[length:calc(1rem*var(--latin-scale,1))] leading-relaxed text-foreground/85">
          {text}
        </p>
      )}
      <p className="mt-3 text-sm text-muted-foreground">
        <Link href={versePageHref(meta.number, verse.number)} className="font-medium text-primary hover:underline">
          {meta.name.latin} {meta.number}:{verse.number}
        </Link>
        <span aria-hidden> · </span>
        <span>{meaningOf(meta, locale)}</span>
      </p>
      <Link
        href={verseHref(meta.number, verse.number)}
        className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 dark:text-[hsl(192_64%_8%)]"
      >
        {t("verse.readInSurah")}
      </Link>
    </section>
  );
}

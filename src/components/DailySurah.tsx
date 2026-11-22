import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { meaningOf } from "@/lib/quran/labels";
import type { SurahView } from "@/lib/quran/types";

/**
 * The surah of the day: its name, its meaning, and its first verses in the Arabic text and the reader's first translation,
 * with a link to read it. Only shows text a source gave, as it gave it (the verses are cut, never changed).
 */
export default async function DailySurah({ view }: { view: SurahView }) {
  const { t, tn, locale } = await getI18n();
  const { meta, verses, editions } = view;
  const translation = view.selection.translations[0];
  const edition = editions.find((e) => e.id === translation);

  return (
    <section aria-labelledby="daily-surah" className="mb-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p id="daily-surah" className="text-sm font-medium text-muted-foreground">
        {t("home.daily.title")}
      </p>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        {/* Flex items, not inline text, so the gap between the name and the meaning also holds when the page is right to left. */}
        <h2 className="flex flex-wrap items-baseline gap-x-2 font-display text-xl font-semibold">
          <Link href={`/surah/${meta.number}`} className="hover:underline">
            {meta.name.latin}
          </Link>
          <span className="text-base font-normal text-muted-foreground">
            {meaningOf(meta, locale)} · {tn("common.verses", meta.verseCount)}
          </span>
        </h2>
        <span className="font-arabic text-2xl text-primary" dir="rtl" lang="ar" translate="no">
          {meta.name.arabic}
        </span>
      </div>
      <ol className="mt-3 space-y-3">
        {verses.map((verse) => {
          const text = verse.translations.find((x) => x.edition === translation)?.text;
          return (
            <li key={verse.number}>
              <p dir="rtl" lang="ar" translate="no" className="font-arabic text-right text-[length:calc(1.5rem*var(--arabic-scale,1))] leading-[2.1]">
                {verse.arabic}
              </p>
              {text && (
                <p lang={edition?.language} dir={edition?.direction} translate="no" className="mt-1 text-[length:calc(1rem*var(--latin-scale,1))] leading-relaxed text-foreground/85">
                  <span className="me-1.5 tabular-nums text-muted-foreground">{verse.number}.</span>
                  {text}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <Link
        href={`/surah/${meta.number}`}
        className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 dark:text-[hsl(192_64%_8%)]"
      >
        {t("home.daily.read")}
      </Link>
    </section>
  );
}

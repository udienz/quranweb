import Link from "next/link";
import { verseHref, versePageHref } from "@/lib/anchors";
import { getI18n } from "@/lib/i18n/server";
import { meaningOf } from "@/lib/quran/labels";
import ArabicText, { RukuMark } from "./ArabicText";
import type { SurahView } from "@/lib/quran/types";

export default async function DailyVerse({ view }: { view: SurahView }) {
  const { t, locale } = await getI18n();
  const { meta, verses, editions } = view;
  const verse = verses[0];
  if (!verse) return null;
  const translation = view.selection.translations[0];
  const edition = editions.find((e) => e.id === translation);
  const text = verse.translations.find((x) => x.edition === translation)?.text;

  return (
    <section aria-labelledby="daily-verse" className="home-editorial__daily mb-12 overflow-hidden rounded-[1.5rem]">
      <div className="home-editorial__daily-label flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <p id="daily-verse" className="text-xs font-bold uppercase tracking-[0.18em]">{t("home.daily.title")}</p>
        <span className="home-editorial__daily-rule h-px flex-1" aria-hidden />
        <Link href={versePageHref(meta.number, verse.number)} className="text-xs font-semibold hover:underline">
          {meta.name.latin} {meta.number}:{verse.number}
        </Link>
      </div>
      <div className="grid gap-5 px-5 pb-6 pt-2 sm:px-8 sm:pb-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(220px,0.7fr)] lg:gap-10 lg:px-10">
        <div className="flex min-w-0 flex-col justify-center">
          <p dir="rtl" lang="ar" translate="no" className="font-arabic text-right text-[length:calc(2rem*var(--arabic-scale,1))] leading-[2.15] sm:text-[length:calc(2.45rem*var(--arabic-scale,1))]">
            <ArabicText verse={verse} />
            <RukuMark verse={verse} />
          </p>
        </div>
        <div className="home-editorial__translation flex flex-col justify-center border-t pt-5 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
          {text && (
            <p lang={edition?.language} dir={edition?.direction} translate="no" className="text-[length:calc(1rem*var(--latin-scale,1))] leading-[1.9]">
              {text}
            </p>
          )}
          <p className="mt-5 text-xs">{meaningOf(meta, locale)}</p>
          <Link href={verseHref(meta.number, verse.number)} className="home-editorial__verse-link mt-4 inline-flex w-fit items-center rounded-full px-5 py-2.5 text-sm font-semibold transition">
            {t("verse.readInSurah")} <span aria-hidden className="ms-2">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

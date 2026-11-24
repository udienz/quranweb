import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getAllSurah, getQuran } from "@/lib/quran";
import { todaysVerse } from "@/lib/daily";
import { parseSelectionCookie, SELECTION_COOKIE } from "@/lib/selection";
import { getI18n } from "@/lib/i18n/server";
import { shareMetadata } from "@/lib/site";
import ContinueReading from "@/components/ContinueReading";
import DailyVerse from "@/components/DailyVerse";
import SurahGrid from "@/components/SurahGrid";
import { errorOncePerHour } from "@/lib/log-limited";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return shareMetadata({ title: t("meta.title"), description: t("meta.description"), path: "/", locale });
}

// Rendered per request instead of prerendered at build time: the data comes from
// external sources that must not be needed while `docker build` / `next build` run.
export const instant = false;

/** The view for the verse of the day (its Arabic text and the reader's first translation, nothing else), or null when its text cannot be read (the home page works without the card). */
async function dailyView(locale: string) {
  try {
    const quran = getQuran();
    const { surah, verse } = todaysVerse();
    const saved = parseSelectionCookie((await cookies()).get(SELECTION_COOKIE)?.value);
    let chosen;
    try {
      chosen = quran.resolveSelection(saved, locale);
    } catch {
      chosen = quran.resolveSelection({}, locale);
    }
    // Only what the card shows is loaded: no tafsir, no transliteration, one translation.
    const light = quran.resolveSelection(
      { ...chosen, translations: chosen.translations.slice(0, 1), transliteration: null, tafsir: null },
      locale,
    );
    const meta = (await quran.getSurahList()).find((s) => s.number === surah);
    if (!meta) return null;
    return await quran.getSurahView(surah, light, locale, { from: verse, to: verse });
  } catch (error) {
    errorOncePerHour("daily-verse", "The verse of the day is not available:", error);
    return null;
  }
}

export default async function Home() {
  const [surahList, i18n] = await Promise.all([getAllSurah(), getI18n()]);
  const { t, locale } = i18n;
  const daily = await dailyView(locale);

  // The hero stays short so "continue reading", what a returning reader came for, is high on the first screen.
  return (
    <div className="home-editorial mx-auto max-w-[1200px] px-4 py-8">
      <section
        className="home-editorial__hero on-dark mb-6 rounded-2xl px-6 py-6 text-white sm:px-10 sm:py-8"
        style={{ background: "linear-gradient(135deg, hsl(var(--hero-from)), hsl(var(--hero-to)))" }}
      >
        <p className="font-arabic text-center text-3xl text-gold sm:text-4xl" dir="rtl" lang="ar" translate="no">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
        <h1 className="mt-3 text-center font-display text-2xl font-bold sm:text-3xl">{t("home.title")}</h1>
        <p className="mx-auto mt-1 max-w-xl text-center text-white/75">{t("home.subtitle")}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <form action="/search" method="get" role="search" className="flex gap-2">
            <input
              type="search"
              name="q"
              maxLength={200}
              placeholder={t("search.placeholder")}
              aria-label={t("search.title")}
              className="w-44 rounded-full border border-white/40 bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/75 focus:border-white sm:w-60"
            />
            <button type="submit" className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              {t("search.button")}
            </button>
          </form>
          <Link href="/surah/1" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-[hsl(190_70%_12%)] hover:opacity-90">
            {t("home.start")}
          </Link>
        </div>
      </section>
      <ContinueReading surahs={surahList} />
      {daily && <DailyVerse view={daily} />}
      <SurahGrid surahs={surahList} />
    </div>
  );
}

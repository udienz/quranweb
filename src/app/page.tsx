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

export const instant = false;

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

  return (
    <main className="home-editorial mx-auto max-w-[1200px] px-4 pb-16 pt-7 sm:px-6 lg:pt-10">
      <section className="home-editorial__hero mb-8 grid items-center overflow-hidden rounded-[1.75rem] px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div className="home-editorial__intro relative z-10 lg:max-w-[34rem]">
          <div className="home-editorial__top">
            <div className="home-editorial__lead">
              <p className="home-editorial__eyebrow mb-4 text-[11px] font-bold uppercase tracking-[0.24em]">{t("meta.title")}</p>
              <h1 className="max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-[3.25rem]">{t("home.title")}</h1>
              <p className="home-editorial__subtitle mt-3 max-w-xl text-sm leading-7 sm:text-base">{t("home.subtitle")}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 lg:mt-7">
            <form action="/search" method="get" role="search" className="home-editorial__search flex w-full max-w-[28rem] gap-2">
              <input
                type="search"
                name="q"
                maxLength={200}
                placeholder={t("search.placeholder")}
                aria-label={t("search.title")}
                className="home-editorial__input w-44 min-w-0 flex-1 rounded-full border border-border px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary sm:w-60"
              />
              <button type="submit" className="home-editorial__search-button rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-soft">
                {t("search.button")}
              </button>
            </form>
            <Link href="/surah/1" className="home-editorial__start inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition">
              {t("home.start")} <span aria-hidden className="ms-2">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <ContinueReading surahs={surahList} />
      {daily && <DailyVerse view={daily} />}
      <SurahGrid surahs={surahList} />
    </main>
  );
}

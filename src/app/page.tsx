import Link from "next/link";
import { getAllSurah } from "@/lib/quran";
import { getI18n } from "@/lib/i18n/server";
import ContinueReading from "@/components/ContinueReading";
import SurahGrid from "@/components/SurahGrid";

// Rendered per request instead of prerendered at build time: the data comes from
// external sources that must not be needed while `docker build` / `next build` run.
export const instant = false;

export default async function Home() {
  const [surahList, { t }] = await Promise.all([getAllSurah(), getI18n()]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <section
        className="mb-8 rounded-2xl px-6 py-10 text-white sm:px-10"
        style={{ background: "linear-gradient(135deg, hsl(var(--hero-from)), hsl(var(--hero-to)))" }}
      >
        <p className="font-arabic text-center text-4xl text-gold sm:text-5xl" dir="rtl" lang="ar">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
        <h1 className="mt-6 text-center font-display text-3xl font-bold">{t("home.title")}</h1>
        <p className="mx-auto mt-2 max-w-xl text-center text-white/75">{t("home.subtitle")}</p>
        <div className="mt-6 flex justify-center">
          <Link href="/surah/1" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-[hsl(190_70%_12%)] hover:opacity-90">
            {t("home.start")}
          </Link>
        </div>
      </section>
      <ContinueReading surahs={surahList} />
      <SurahGrid surahs={surahList} />
    </div>
  );
}

import type { Metadata } from "next";
import SurahGrid from "@/components/SurahGrid";
import { getAllSurah } from "@/lib/quran";
import { getI18n } from "@/lib/i18n/server";
import { shareMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return shareMetadata({ title: `${t("home.listTitle")} · ${t("meta.title")}`, description: t("meta.description"), path: "/surahs", locale });
}

export const instant = false;

/** The full list of the 114 surahs: the home page lists six and links here. */
export default async function SurahsPage() {
  const surahs = await getAllSurah();
  return (
    <main className="home-editorial mx-auto max-w-[1200px] px-4 pb-16 pt-7 sm:px-6 lg:pt-10">
      <SurahGrid surahs={surahs} mode="all" />
    </main>
  );
}

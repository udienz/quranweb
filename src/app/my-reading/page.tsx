import type { Metadata } from "next";
import { getAllSurah } from "@/lib/quran";
import { getI18n } from "@/lib/i18n/server";
import MyReading from "@/components/MyReading";
import { signInEnabled } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t("meta.myReadingTitle")} | ${t("meta.title")}` };
}

// Rendered per request, see the note in app/page.tsx.
export const instant = false;

export default async function MyReadingPage() {
  const [surahs, { t }] = await Promise.all([getAllSurah(), getI18n()]);
  const accounts = signInEnabled();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-semibold">{t("myReading.title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t(accounts ? "myReading.subtitleAccount" : "myReading.subtitle")}</p>
      <MyReading surahs={surahs} accounts={accounts} />
    </div>
  );
}

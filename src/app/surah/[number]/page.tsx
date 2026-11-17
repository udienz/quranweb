import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getI18n, getLocale } from "@/lib/i18n/server";
import { getQuran } from "@/lib/quran";
import { parseSelectionCookie, SELECTION_COOKIE } from "@/lib/selection";
import SettingsPanel from "@/components/SettingsPanel";
import SurahReader from "@/components/SurahReader";
import SurahSidebar from "@/components/SurahSidebar";

// Rendered per request, see the note in app/page.tsx.
export const instant = false;

export default async function SurahPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const surahNumber = Number(number);

  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    notFound();
  }

  // The reader's edition and reciter choice is in a cookie; anything that is not valid
  // against the catalog is ignored and the defaults are used.
  const quran = getQuran();
  const locale = await getLocale();
  const saved = parseSelectionCookie((await cookies()).get(SELECTION_COOKIE)?.value);
  let selection;
  try {
    selection = quran.resolveSelection(saved, locale);
  } catch {
    selection = quran.resolveSelection({}, locale);
  }

  const [view, surahs] = await Promise.all([quran.getSurahView(surahNumber, selection, locale), quran.getSurahList()]);
  const catalog = quran.getCatalog();
  const { t } = await getI18n();

  return (
    <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-6 lg:grid-cols-[320px_1fr]">
      <aside className="hidden lg:block">
        {/* The column can be taller than the screen; it scrolls on its own so every setting stays reachable. */}
        <div className="thin-scroll sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-4 overflow-y-auto pr-1">
          <SurahSidebar surahs={surahs} current={surahNumber} />
          <SettingsPanel catalog={catalog} selection={view.selection} />
        </div>
      </aside>
      <div className="min-w-0">
        <details className="mb-4 rounded-2xl border border-border bg-card lg:hidden">
          <summary className="cursor-pointer px-4 py-3 font-display text-sm font-semibold">{t("settings.title")}</summary>
          <div className="px-2 pb-2">
            <SettingsPanel catalog={catalog} selection={view.selection} hideTitle />
          </div>
        </details>
        <SurahReader
          view={view}
          prev={surahNumber > 1 ? surahNumber - 1 : null}
          next={surahNumber < 114 ? surahNumber + 1 : null}
        />
      </div>
    </div>
  );
}

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getQuran } from "@/lib/quran";
import { parseSelectionCookie, SELECTION_COOKIE } from "@/lib/selection";
import SettingsPanel from "@/components/SettingsPanel";
import SurahReader from "@/components/SurahReader";
import SurahSidebar from "@/components/SurahSidebar";

// Render per-request — lihat catatan di app/page.tsx.
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

  // Pilihan edisi dan qari pengguna ada di cookie; nilai yang tidak valid terhadap
  // katalog diabaikan dan jatuh ke pilihan bawaan.
  const quran = getQuran();
  const saved = parseSelectionCookie((await cookies()).get(SELECTION_COOKIE)?.value);
  let selection;
  try {
    selection = quran.resolveSelection(saved);
  } catch {
    selection = quran.resolveSelection();
  }

  const [view, surahs] = await Promise.all([quran.getSurahView(surahNumber, selection), quran.getSurahList()]);
  const catalog = quran.getCatalog();

  return (
    <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-6 lg:grid-cols-[320px_1fr]">
      <aside className="hidden lg:block">
        {/* Kolom bisa lebih tinggi dari layar; menggulir sendiri supaya semua pengaturan terjangkau. */}
        <div className="thin-scroll sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-4 overflow-y-auto pr-1">
          <SurahSidebar surahs={surahs} current={surahNumber} />
          <SettingsPanel catalog={catalog} selection={view.selection} />
        </div>
      </aside>
      <div className="min-w-0">
        <details className="mb-4 rounded-2xl border border-border bg-card lg:hidden">
          <summary className="cursor-pointer px-4 py-3 font-display text-sm font-semibold">Pengaturan bacaan</summary>
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

import { notFound } from "next/navigation";
import { getAllSurah, getSurah } from "@/lib/quran";
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

  const [surah, surahs] = await Promise.all([getSurah(surahNumber), getAllSurah()]);

  return (
    <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-6 lg:grid-cols-[320px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <SurahSidebar surahs={surahs} current={surahNumber} />
        </div>
      </aside>
      <SurahReader
        surah={surah}
        prev={surahNumber > 1 ? surahNumber - 1 : null}
        next={surahNumber < 114 ? surahNumber + 1 : null}
      />
    </div>
  );
}

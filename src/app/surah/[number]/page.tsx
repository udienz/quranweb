import Link from "next/link";
import { notFound } from "next/navigation";
import { getSurah } from "@/lib/quran";
import VerseCard from "@/components/VerseCard";

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

  const surah = await getSurah(surahNumber);

  const prev = surahNumber > 1 ? surahNumber - 1 : null;
  const next = surahNumber < 114 ? surahNumber + 1 : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="mb-4 inline-block text-sm text-emerald-700 hover:underline dark:text-emerald-400">
        &larr; Daftar surah
      </Link>

      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p dir="rtl" className="text-2xl">
          {surah.name.long}
        </p>
        <h1 className="mt-1 text-xl font-semibold">
          {surah.name.transliteration.id} &middot; {surah.name.translation.id}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {surah.revelation.id} &middot; {surah.numberOfVerses} ayat
        </p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{surah.tafsir.id}</p>
      </div>

      {surah.preBismillah && (
        <div className="mb-4">
          <VerseCard verse={surah.preBismillah} />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {surah.verses.map((verse) => (
          <VerseCard key={verse.number.inQuran} verse={verse} />
        ))}
      </div>

      <div className="mt-8 flex justify-between text-sm">
        {prev ? (
          <Link href={`/surah/${prev}`} className="text-emerald-700 hover:underline dark:text-emerald-400">
            &larr; Surah sebelumnya
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/surah/${next}`} className="text-emerald-700 hover:underline dark:text-emerald-400">
            Surah berikutnya &rarr;
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

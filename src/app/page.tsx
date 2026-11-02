import Link from "next/link";
import { getAllSurah } from "@/lib/quran";

export default async function Home() {
  const surahList = await getAllSurah();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Daftar Surah</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        114 surah &middot; pilih salah satu untuk membaca
      </p>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {surahList.map((surah) => (
          <li key={surah.number}>
            <Link
              href={`/surah/${surah.number}`}
              className="flex items-center gap-4 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {surah.number}
              </span>
              <span className="flex-1">
                <span className="block font-medium">
                  {surah.name.transliteration.id}
                </span>
                <span className="block text-sm text-zinc-500 dark:text-zinc-400">
                  {surah.name.translation.id} &middot; {surah.numberOfVerses} ayat &middot;{" "}
                  {surah.revelation.id}
                </span>
              </span>
              <span className="shrink-0 text-lg" dir="rtl">
                {surah.name.short}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

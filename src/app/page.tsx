import Link from "next/link";
import { getAllSurah } from "@/lib/quran";
import SurahGrid from "@/components/SurahGrid";

// Render per-request, jangan prerender statis saat build — data berasal
// dari API eksternal yang tidak perlu/bisa dijangkau saat
// `docker build`/`next build` berjalan.
export const instant = false;

export default async function Home() {
  const surahList = await getAllSurah();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <section
        className="mb-8 rounded-2xl px-6 py-10 text-white sm:px-10"
        style={{ background: "linear-gradient(135deg, hsl(var(--hero-from)), hsl(var(--hero-to)))" }}
      >
        <p className="font-arabic text-center text-4xl text-gold sm:text-5xl" dir="rtl" lang="ar">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
        <h1 className="mt-6 text-center font-display text-3xl font-bold">Baca Al-Qur&apos;an</h1>
        <p className="mx-auto mt-2 max-w-xl text-center text-white/75">
          Teks Arab, transliterasi, terjemahan Bahasa Indonesia, audio murottal, dan tafsir.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/surah/1" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-[hsl(190_70%_12%)] hover:opacity-90">
            Mulai dari Al-Fatihah
          </Link>
        </div>
      </section>
      <SurahGrid surahs={surahList} />
    </div>
  );
}

import type { Metadata } from "next";
import { getAllSurah } from "@/lib/quran";
import MyReading from "@/components/MyReading";

export const metadata: Metadata = { title: "Bacaan saya | QuranWeb" };

// Render per-request — lihat catatan di app/page.tsx.
export const instant = false;

export default async function MyReadingPage() {
  const surahs = await getAllSurah();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-semibold">Bacaan saya</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Terakhir dibaca, progres, dan penanda ayat. Tersimpan di browser ini, tanpa akun.
      </p>
      <MyReading surahs={surahs} />
    </div>
  );
}

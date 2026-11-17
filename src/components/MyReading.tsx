"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { SurahMeta } from "@/lib/quran";
import { exportUserData } from "@/lib/userdata/schema";
import { userDataActions, useUserData } from "@/lib/userdata/store";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-2xl border border-border bg-card">
      <h2 className="border-b border-border px-5 py-3 font-display font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="px-5 py-6 text-sm text-muted-foreground">{children}</p>
);

export default function MyReading({ surahs }: { surahs: SurahMeta[] }) {
  const data = useUserData();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const meta = (n: number) => surahs.find((s) => s.number === n);

  const progress = Object.entries(data.progress)
    .map(([key, p]) => ({ surah: Number(key), ...p }))
    .sort((a, b) => a.surah - b.surah);
  const bookmarks = [...data.bookmarks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const last = data.lastRead && meta(data.lastRead.surah);

  function download() {
    const blob = new Blob([exportUserData(userDataActions.current(), new Date().toISOString())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quranweb-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Mencabut URL terlalu cepat bisa membatalkan unduhan di sebagian browser.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      userDataActions.importMerge(await file.text());
      setMessage({ ok: true, text: "Cadangan digabungkan dengan data di browser ini." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Gagal membaca berkas." });
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div>
      <Section title="Terakhir dibaca">
        {data.lastRead && last ? (
          <Link
            href={`/surah/${data.lastRead.surah}#ayat-${data.lastRead.ayat}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-muted"
          >
            <span>
              <span className="block font-semibold">{last.name.latin}, ayat {data.lastRead.ayat}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(data.lastRead.at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </span>
            <span className="text-sm font-medium text-primary">Lanjutkan &rarr;</span>
          </Link>
        ) : (
          <Empty>Belum ada bacaan tersimpan. Buka sebuah surat dan posisi bacaan Anda akan dicatat otomatis.</Empty>
        )}
      </Section>

      <Section title="Progres baca">
        {progress.length === 0 ? (
          <Empty>Belum ada surat yang ditandai. Pakai tombol centang di sebuah ayat untuk menandai bacaan sampai ayat itu.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {progress.map((p) => {
              const s = meta(p.surah);
              if (!s) return null;
              const pct = Math.min(100, Math.round((p.readUpTo / s.ayatCount) * 100));
              return (
                <li key={p.surah} className="flex items-center gap-4 px-5 py-3">
                  <Link href={`/surah/${p.surah}#ayat-${p.readUpTo}`} className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.name.latin}</span>
                    <span className="text-xs text-muted-foreground">
                      ayat {p.readUpTo} dari {s.ayatCount} ({pct}%)
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => userDataActions.clearProgress(p.surah)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Hapus
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Penanda ayat">
        {bookmarks.length === 0 ? (
          <Empty>Belum ada penanda. Pakai ikon penanda di sebuah ayat untuk menyimpannya.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {bookmarks.map((b) => {
              const s = meta(b.surah);
              return (
                <li key={`${b.surah}:${b.ayat}`} className="flex items-start gap-4 px-5 py-3">
                  <Link href={`/surah/${b.surah}#ayat-${b.ayat}`} className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {s?.name.latin ?? `Surat ${b.surah}`} {b.surah}:{b.ayat}
                    </span>
                    {b.note && <span className="block whitespace-pre-line text-sm text-muted-foreground">{b.note}</span>}
                  </Link>
                  <button
                    type="button"
                    onClick={() => userDataActions.removeBookmark(b.surah, b.ayat)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Hapus
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Cadangan">
        <div className="px-5 py-4 text-sm">
          <p className="mb-3 text-muted-foreground">
            Data ini hanya tersimpan di browser ini. Unduh cadangan untuk memindahkannya ke perangkat lain, lalu impor di
            sana; data yang diimpor digabungkan, tidak menimpa.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={download}
              className="rounded-full bg-primary px-5 py-2 font-medium text-white hover:opacity-90 dark:text-[hsl(192_64%_8%)]"
            >
              Unduh cadangan
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-full border border-border px-5 py-2 font-medium hover:bg-muted"
            >
              Impor cadangan
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </div>
          {message && (
            <p role="status" className={`mt-3 ${message.ok ? "text-primary" : "text-red-600 dark:text-red-400"}`}>
              {message.text}
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}

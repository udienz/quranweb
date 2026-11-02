import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuranWeb",
  description: "Baca Al-Qur'an: teks Arab, terjemahan, audio murottal, dan tafsir Bahasa Indonesia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              QuranWeb
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Data: teks, terjemahan, audio murottal, dan tafsir dari Quran API.
        </footer>
      </body>
    </html>
  );
}

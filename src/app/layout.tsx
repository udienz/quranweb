import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/amiri/arabic-700.css";
import "@fontsource/amiri/latin-400.css";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import PrefsProvider from "@/components/PrefsProvider";

export const metadata: Metadata = {
  title: "QuranWeb",
  description: "Baca Al-Qur'an: teks Arab, terjemahan, audio murottal, dan tafsir Bahasa Indonesia.",
};

// Terapkan tema sebelum render pertama supaya tidak berkedip.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo />
              <span className="hidden font-display text-xl font-bold tracking-tight text-primary min-[480px]:inline">QuranWeb</span>
            </Link>
            <nav className="flex rounded-full border border-border bg-card p-1 text-sm">
              <Link href="/" className="flex items-center gap-2 rounded-full px-3 py-1.5 font-medium hover:bg-background sm:px-4">
                <span className="h-2 w-2 rounded-full bg-gold" />
                Al-Quran
              </Link>
              <Link href="/saya" className="rounded-full px-3 py-1.5 font-medium hover:bg-background sm:px-4">
                Bacaan saya
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </header>
        <PrefsProvider>
          <main className="flex-1">{children}</main>
        </PrefsProvider>
        <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
          Sumber tiap teks, terjemahan, tafsir, dan audio tercantum di bawah setiap surat. Data utama dari{" "}
          <a href="https://equran.id" className="text-primary hover:underline" rel="noopener">
            EQuran.id
          </a>{" "}
          dan{" "}
          <a href="https://github.com/fawazahmed0/quran-api" className="text-primary hover:underline" rel="noopener">
            fawazahmed0/quran-api
          </a>
          .
        </footer>
      </body>
    </html>
  );
}

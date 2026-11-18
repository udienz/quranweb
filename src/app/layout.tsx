import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/amiri/arabic-700.css";
import "@fontsource/amiri/latin-400.css";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import { Suspense } from "react";
import AccountMenu from "@/components/AccountMenu";
import LanguageSwitch from "@/components/LanguageSwitch";
import Logo from "@/components/Logo";
import PrefsProvider from "@/components/PrefsProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { I18nProvider } from "@/lib/i18n/client";
import { MESSAGES } from "@/lib/i18n/messages";
import { signInEnabled } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("meta.title"), description: t("meta.description") };
}

// Apply the theme before the first paint so the page does not flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t } = await getI18n();
  const accounts = signInEnabled();

  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} messages={MESSAGES[locale]}>
          <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
            {/* On phones the navigation takes a second row, so the controls never push the header wider than the screen. */}
            <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-2 gap-y-2 px-4 py-2 sm:h-16 sm:flex-nowrap sm:py-0">
              <Link href="/" className="flex items-center gap-2.5">
                <Logo />
                <span className="hidden font-display text-xl font-bold tracking-tight text-primary min-[480px]:inline">QuranWeb</span>
              </Link>
              <nav className="order-last flex w-full justify-center rounded-full border border-border bg-card p-1 text-xs sm:order-none sm:w-auto sm:text-sm">
                <Link href="/" className="flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1.5 font-medium hover:bg-background sm:px-4">
                  <span className="hidden h-2 w-2 rounded-full bg-gold sm:block" />
                  {t("nav.quran")}
                </Link>
                <Link href="/my-reading" className="whitespace-nowrap rounded-full px-2.5 py-1.5 font-medium hover:bg-background sm:px-4">
                  {t("nav.myReading")}
                </Link>
              </nav>
              <div className="flex items-center gap-2">
                <LanguageSwitch />
                <ThemeToggle />
                {accounts && (
                  <Suspense>
                    <AccountMenu />
                  </Suspense>
                )}
              </div>
            </div>
          </header>
          <PrefsProvider>
            <main className="flex-1">{children}</main>
          </PrefsProvider>
          <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
            {t("footer.intro")}{" "}
            <a href="https://equran.id" className="text-primary hover:underline" rel="noopener">
              EQuran.id
            </a>{" "}
            {t("footer.and")}{" "}
            <a href="https://github.com/fawazahmed0/quran-api" className="text-primary hover:underline" rel="noopener">
              fawazahmed0/quran-api
            </a>
            .{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              {t("footer.privacy")}
            </Link>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}

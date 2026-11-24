import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/amiri/arabic-700.css";
import "@fontsource/amiri/latin-400.css";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import { Suspense } from "react";
import AccountMenu from "@/components/AccountMenu";
import LanguageMenu from "@/components/LanguageMenu";
import NavLink from "@/components/NavLink";
import Logo from "@/components/Logo";
import PrefsProvider from "@/components/PrefsProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { I18nProvider } from "@/lib/i18n/client";
import { directionOf } from "@/lib/i18n/config";
import { MESSAGES } from "@/lib/i18n/messages";
import { signInEnabled } from "@/lib/auth";
import { displayScript } from "@/lib/display";
import KeepVerseInView from "@/components/KeepVerseInView";
import { getI18n } from "@/lib/i18n/server";
import { isInstallable, shareMetadata } from "@/lib/site";
import { siteOrigin } from "@/lib/site-origin";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  const origin = await siteOrigin();
  return {
    // Relative addresses in the metadata (the canonical link, the preview image) are made absolute from this.
    metadataBase: new URL(origin),
    // The layout sets the preview data every page falls back on; a page that can be shared sets its own (shareMetadata).
    ...shareMetadata({ title: t("meta.title"), description: t("meta.description"), path: "/", locale, canonical: false }),
    // Only production can be installed (see app/manifest.webmanifest/route.ts): QA gets no manifest and no data for "Add to Home Screen".
    ...(isInstallable(origin)
      ? {
          manifest: "/manifest.webmanifest",
          // On an iPhone, "Add to Home Screen" opens the site in its own window with this name.
          appleWebApp: { capable: true, title: t("meta.title"), statusBarStyle: "default" as const },
        }
      : {}),
  };
}

// The colour of the browser's bar (and of the installed app's title bar): the page background of each theme.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2eb" },
    { media: "(prefers-color-scheme: dark)", color: "#141c17" },
  ],
};


export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t } = await getI18n();
  const accounts = signInEnabled();

  return (
    <html lang={locale} dir={directionOf(locale)} className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Apply the theme and text size before the first paint so the page does not flash. */}
        <script dangerouslySetInnerHTML={{ __html: displayScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} messages={MESSAGES[locale]}>
          <KeepVerseInView />
          <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
            {/* On phones the navigation takes a second row, so the controls never push the header wider than the screen. */}
            <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 py-2 sm:h-16 sm:flex-nowrap sm:py-0">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#344c3d] ring-1 ring-gold/40 dark:bg-[#26342b]">
                  <span className="flex [--primary:43_45%_82%] [--gold:42_55%_66%]">
                    <Logo size={26} />
                  </span>
                </span>
                <span className="hidden font-display text-xl font-bold tracking-tight text-primary min-[480px]:inline">QuranWeb</span>
              </Link>
              <nav className="order-last flex w-full justify-center text-sm sm:order-none sm:w-auto">
                <NavLink href="/">{t("nav.quran")}</NavLink>
                <NavLink href="/#surahs">
                  {t("home.listTitle")} <span className="text-xs tabular-nums text-muted-foreground">114</span>
                </NavLink>
                <NavLink href="/about">{t("footer.about")}</NavLink>
                {/* With sign-in on, "My reading" and "Settings" live in the account menu; without it, they stay here. */}
                {!accounts && (
                  <>
                    <NavLink href="/my-reading">{t("nav.myReading")}</NavLink>
                    <NavLink href="/settings">{t("nav.settings")}</NavLink>
                  </>
                )}
              </nav>
              <div className="flex items-center gap-2">
                <Link
                  href="/search"
                  aria-label={t("search.title")}
                  title={t("search.title")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </Link>
                <LanguageMenu />
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
            {/* The sources and credits of all content are on the About page. */}
            <Link href="/about" className="text-primary hover:underline">
              {t("footer.about")}
            </Link>
            {" · "}
            <Link href="/privacy" className="text-primary hover:underline">
              {t("footer.privacy")}
            </Link>
            {" · "}
            <Link href="/terms" className="text-primary hover:underline">
              {t("footer.terms")}
            </Link>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}

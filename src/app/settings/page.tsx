import type { Metadata } from "next";
import { cookies } from "next/headers";
import AccountSection from "@/components/AccountSection";
import AudioSection from "@/components/AudioSection";
import DisplaySection from "@/components/DisplaySection";
import SettingsPanel from "@/components/SettingsPanel";
import { signInEnabled } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { LAYOUT_COOKIE, parseLayout } from "@/lib/layout";
import { PAGING_COOKIE, parsePaging } from "@/lib/paging";
import { getQuran, languageDefaults } from "@/lib/quran";
import { parseSelectionCookie, SELECTION_COOKIE } from "@/lib/selection";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t("settingsPage.title")} | ${t("meta.title")}` };
}

// Rendered per request (it reads the choice cookies), see the note in app/page.tsx.
export const instant = false;

/**
 * Every setting of the reader in one place: display (theme, text size), reading (layout, what is shown, editions,
 * reciter) and, when signed in, the account. The panel beside a surah keeps the reading settings as a shortcut.
 */
export default async function SettingsPage() {
  const { t, locale } = await getI18n();
  const quran = getQuran();
  const jar = await cookies();
  const saved = parseSelectionCookie(jar.get(SELECTION_COOKIE)?.value);
  const layout = parseLayout(jar.get(LAYOUT_COOKIE)?.value);
  const paging = parsePaging(jar.get(PAGING_COOKIE)?.value);
  let selection;
  try {
    selection = quran.resolveSelection(saved, locale);
  } catch {
    selection = quran.resolveSelection({}, locale);
  }
  const juzs = await quran.getJuzList().catch((error) => {
    console.error("The juz boundaries are not available:", error);
    return [];
  });
  const accounts = signInEnabled();
  const sections = [
    ["#display", t("settingsPage.display")],
    ["#audio", t("settingsPage.audio")],
    ["#reading", t("settings.title")],
    ...(accounts ? [["#account", t("account.section.title")]] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-semibold">{t("settingsPage.title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{t(accounts ? "settingsPage.subtitleAccount" : "settingsPage.subtitle")}</p>
      <nav aria-label={t("settingsPage.sections")} className="mb-6 flex flex-wrap gap-2 text-sm">
        {sections.map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-border bg-card px-3 py-1.5 font-medium hover:bg-muted">
            {label}
          </a>
        ))}
      </nav>
      <div className="flex flex-col gap-6">
        <DisplaySection />
        <AudioSection catalog={quran.getCatalog()} selection={selection} juzs={juzs} />
        <SettingsPanel id="reading" catalog={quran.getCatalog()} selection={selection} layout={layout} paging={paging} showLink={false} showQari={false} languageDefaults={languageDefaults(locale)} />
        {accounts && (
          <div id="account" className="scroll-mt-24">
            <AccountSection />
          </div>
        )}
      </div>
    </div>
  );
}

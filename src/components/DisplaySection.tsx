"use client";

import { useI18n } from "@/lib/i18n/client";
import { ArabicFontChoice, FontSizeControls, ThemeChoice } from "./DisplayControls";
import { LanguageSelect } from "./LanguageMenu";

/** The Display section of the settings page: interface language, theme and text size. */
export default function DisplaySection() {
  const { t } = useI18n();
  return (
    <section id="display" className="scroll-mt-24 rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 font-display font-semibold">{t("settingsPage.display")}</h2>
      <div className="flex flex-col gap-4">
        <LanguageSelect />
        <ThemeChoice />
        <FontSizeControls />
        <ArabicFontChoice />
        <p className="text-xs text-muted-foreground">{t("display.preview")}</p>
      </div>
    </section>
  );
}

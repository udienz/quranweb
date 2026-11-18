"use client";

import { useSyncExternalStore } from "react";
import {
  applyFontSize,
  applyTheme,
  DEFAULT_FONT_SIZE,
  DEFAULT_THEME,
  FONT_SCALES,
  FONT_SIZE_KEY,
  parseFontSize,
  readTheme,
  stepFontScale,
  subscribeDisplay,
  THEMES,
  type FontSize,
  type Theme,
} from "@/lib/display";
import { useI18n } from "@/lib/i18n/client";
import type { StringKey } from "@/lib/i18n/messages";
import { userDataActions } from "@/lib/userdata/store";

const THEME_LABELS: Record<Theme, StringKey> = {
  light: "display.themeLight",
  dark: "display.themeDark",
  auto: "display.themeAuto",
};

// Snapshots are strings so useSyncExternalStore sees a stable value between renders.
function rawFontSize(): string {
  try {
    return localStorage.getItem(FONT_SIZE_KEY) ?? "";
  } catch {
    return "";
  }
}

/** The theme and text size of this browser, updated when they change here or in another tab. */
export function useDisplay(): { theme: Theme; fontSize: FontSize } {
  const theme = useSyncExternalStore(subscribeDisplay, readTheme, () => DEFAULT_THEME);
  const raw = useSyncExternalStore(subscribeDisplay, rawFontSize, () => "");
  let fontSize = DEFAULT_FONT_SIZE;
  try {
    fontSize = parseFontSize(JSON.parse(raw || "null")) ?? DEFAULT_FONT_SIZE;
  } catch {}
  return { theme, fontSize };
}

/** Choose a theme: shown at once, kept in this browser, and recorded so it follows the account. */
export function chooseTheme(theme: Theme): void {
  applyTheme(theme);
  userDataActions.chooseTheme(theme);
}

function chooseFontSize(size: FontSize): void {
  applyFontSize(size);
  userDataActions.chooseFontSize(size);
}

const segment = (active: boolean) =>
  `flex-1 rounded-full px-3 py-1.5 transition ${
    active ? "bg-primary text-white dark:text-[hsl(192_64%_8%)]" : "text-muted-foreground hover:text-foreground"
  }`;

/** Light, dark or auto (follows the device). */
export function ThemeChoice() {
  const { t } = useI18n();
  const { theme } = useDisplay();
  return (
    <div role="group" aria-label={t("display.theme")} className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{t("display.theme")}</span>
      <div className="flex rounded-full border border-border bg-background p-0.5 text-xs font-semibold">
        {THEMES.map((value) => (
          <button key={value} type="button" aria-pressed={theme === value} onClick={() => chooseTheme(value)} className={segment(theme === value)}>
            {t(THEME_LABELS[value])}
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeRow({ kind }: { kind: keyof FontSize }) {
  const { t } = useI18n();
  const { fontSize } = useDisplay();
  const value = fontSize[kind];
  const label = t(kind === "arabic" ? "display.arabicSize" : "display.latinSize");
  const step = (direction: 1 | -1) => chooseFontSize({ ...fontSize, [kind]: stepFontScale(value, direction) });
  const button =
    "flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background font-semibold transition hover:bg-muted disabled:opacity-40 disabled:hover:bg-background";
  return (
    <div role="group" aria-label={label} className="flex items-center justify-between gap-3 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={value === FONT_SCALES[0]}
          aria-label={t("display.smaller", { name: label })}
          className={button}
        >
          <span aria-hidden dir="ltr" className="text-xs">
            {kind === "arabic" ? <span className="font-arabic text-sm">ع</span> : "A"}−
          </span>
        </button>
        <output aria-live="polite" className="w-12 text-center font-mono text-xs text-muted-foreground">
          {Math.round(value * 100)}%
        </output>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={value === FONT_SCALES[FONT_SCALES.length - 1]}
          aria-label={t("display.larger", { name: label })}
          className={button}
        >
          <span aria-hidden dir="ltr" className="text-sm">
            {kind === "arabic" ? <span className="font-arabic text-base">ع</span> : "A"}+
          </span>
        </button>
      </div>
    </div>
  );
}

/** Arabic and Latin text size, each on its own scale. */
export function FontSizeControls() {
  return (
    <div className="flex flex-col gap-3">
      <SizeRow kind="arabic" />
      <SizeRow kind="latin" />
    </div>
  );
}

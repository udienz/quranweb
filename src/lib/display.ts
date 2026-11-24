// Theme and text size: per browser in local storage, applied to <html> before the first paint (the inline script in
// the root layout), and recorded in the user data as choices so they follow a signed-in reader's account. No React and
// no "use client": the constants are shared with server components.

import type { Choices } from "./userdata/schema";

export const THEMES = ["light", "dark", "auto"] as const;
export type Theme = (typeof THEMES)[number];
/** "auto" follows the device (prefers-color-scheme); it is also what a browser that never chose a theme shows. */
export const DEFAULT_THEME: Theme = "auto";
export const isTheme = (value: unknown): value is Theme => typeof value === "string" && (THEMES as readonly string[]).includes(value);

/** Text size steps, as a factor of the normal size. Arabic and Latin text each have their own. */
export const FONT_SCALES = [0.85, 1, 1.15, 1.3, 1.5] as const;
export interface FontSize {
  arabic: number;
  latin: number;
}
export const DEFAULT_FONT_SIZE: FontSize = { arabic: 1, latin: 1 };
export const isFontScale = (value: unknown): value is number => typeof value === "number" && (FONT_SCALES as readonly number[]).includes(value);

/** A valid font size from anything (storage, a backup, the account), or null. */
export function parseFontSize(value: unknown): FontSize | null {
  if (typeof value !== "object" || value === null) return null;
  const { arabic, latin } = value as Record<string, unknown>;
  return isFontScale(arabic) && isFontScale(latin) ? { arabic, latin } : null;
}

/** The next step up (+1) or down (-1), staying within the steps. */
export function stepFontScale(current: number, direction: 1 | -1): number {
  const index = Math.max(0, (FONT_SCALES as readonly number[]).indexOf(current));
  return FONT_SCALES[Math.min(FONT_SCALES.length - 1, Math.max(0, index + direction))];
}

/** The font of the Arabic text (issue #131): Amiri, or the King Fahd Complex's KFGQPC HAFS Uthmanic Script. */
export const ARABIC_FONTS = ["amiri", "kfgqpc"] as const;
export type ArabicFont = (typeof ARABIC_FONTS)[number];
export const DEFAULT_ARABIC_FONT: ArabicFont = "amiri";
export const isArabicFont = (value: unknown): value is ArabicFont =>
  typeof value === "string" && (ARABIC_FONTS as readonly string[]).includes(value);

/** Local storage keys. "theme" predates this module and keeps its name (values "light" and "dark", now also "auto"). */
export const THEME_KEY = "theme";
export const FONT_SIZE_KEY = "quranweb:font-size";
export const ARABIC_FONT_KEY = "quranweb:arabic-font";
/** The attribute on <html> that globals.css reads to switch the Arabic font. */
export const ARABIC_FONT_ATTR = "data-arabic-font";
/** CSS variables on <html> that the reading text multiplies its size by. */
export const ARABIC_SCALE_VAR = "--arabic-scale";
export const LATIN_SCALE_VAR = "--latin-scale";
/** Window event fired when this tab changes the theme or text size, so controls can update. */
export const DISPLAY_EVENT = "quranweb:display";

/**
 * Inline script for <head>: applies the stored theme and text size before the first paint, so the page does not
 * flash. Kept small and self-contained (it runs before any bundle).
 */
export const displayScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||((!t||t==="auto")&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");var f=JSON.parse(localStorage.getItem("${FONT_SIZE_KEY}")||"null");if(f){var s=document.documentElement.style;if(typeof f.arabic==="number")s.setProperty("${ARABIC_SCALE_VAR}",f.arabic);if(typeof f.latin==="number")s.setProperty("${LATIN_SCALE_VAR}",f.latin)}var a=localStorage.getItem("${ARABIC_FONT_KEY}");if(a==="kfgqpc")document.documentElement.setAttribute("${ARABIC_FONT_ATTR}",a)}catch(e){}`;

/** What the account's choices change in this browser: only what differs from the local values. */
export function displayUpdates(
  choices: Choices,
  local: { theme: Theme; fontSize: FontSize; arabicFont?: ArabicFont },
): { theme?: Theme; fontSize?: FontSize; arabicFont?: ArabicFont } {
  const updates: { theme?: Theme; fontSize?: FontSize; arabicFont?: ArabicFont } = {};
  if (choices.arabicFont && local.arabicFont !== undefined && choices.arabicFont.value !== local.arabicFont) updates.arabicFont = choices.arabicFont.value;
  if (choices.theme && choices.theme.value !== local.theme) updates.theme = choices.theme.value;
  const size = choices.fontSize?.value;
  if (size && (size.arabic !== local.fontSize.arabic || size.latin !== local.fontSize.latin)) updates.fontSize = size;
  return updates;
}

// Browser side. Every access to storage is guarded: it can be missing or blocked.

export function readTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return isTheme(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function readFontSize(): FontSize {
  try {
    return parseFontSize(JSON.parse(localStorage.getItem(FONT_SIZE_KEY) ?? "null")) ?? DEFAULT_FONT_SIZE;
  } catch {
    return DEFAULT_FONT_SIZE;
  }
}

export function readArabicFont(): ArabicFont {
  try {
    const value = localStorage.getItem(ARABIC_FONT_KEY);
    return isArabicFont(value) ? value : DEFAULT_ARABIC_FONT;
  } catch {
    return DEFAULT_ARABIC_FONT;
  }
}

/** Show an Arabic font: the attribute globals.css reads (none for the default). */
function showArabicFont(font: ArabicFont): void {
  if (font === DEFAULT_ARABIC_FONT) document.documentElement.removeAttribute(ARABIC_FONT_ATTR);
  else document.documentElement.setAttribute(ARABIC_FONT_ATTR, font);
}

/** Store an Arabic font in this browser and show it. */
export function applyArabicFont(font: ArabicFont): void {
  try {
    localStorage.setItem(ARABIC_FONT_KEY, font);
  } catch {}
  showArabicFont(font);
  window.dispatchEvent(new Event(DISPLAY_EVENT));
}

/** Whether the page should be dark now for a theme ("auto" asks the device). */
export function isDark(theme: Theme): boolean {
  return theme === "dark" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
}

/** Store a theme in this browser and show it. */
export function applyTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  document.documentElement.classList.toggle("dark", isDark(theme));
  window.dispatchEvent(new Event(DISPLAY_EVENT));
}

/** Store a text size in this browser and show it. */
export function applyFontSize(size: FontSize): void {
  try {
    localStorage.setItem(FONT_SIZE_KEY, JSON.stringify(size));
  } catch {}
  const style = document.documentElement.style;
  style.setProperty(ARABIC_SCALE_VAR, String(size.arabic));
  style.setProperty(LATIN_SCALE_VAR, String(size.latin));
  window.dispatchEvent(new Event(DISPLAY_EVENT));
}

/** Subscribe to theme and text size changes from this tab or another one (for useSyncExternalStore). */
export function subscribeDisplay(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_KEY && event.key !== FONT_SIZE_KEY && event.key !== ARABIC_FONT_KEY) return;
    showArabicFont(readArabicFont());
    // Another tab changed it: show it here too.
    document.documentElement.classList.toggle("dark", isDark(readTheme()));
    const size = readFontSize();
    document.documentElement.style.setProperty(ARABIC_SCALE_VAR, String(size.arabic));
    document.documentElement.style.setProperty(LATIN_SCALE_VAR, String(size.latin));
    callback();
  };
  window.addEventListener(DISPLAY_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(DISPLAY_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

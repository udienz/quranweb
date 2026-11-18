import { isLocale, LOCALE_COOKIE } from "../i18n/config";
import { parseSelectionCookie, parseSelectionObject, SELECTION_COOKIE, serializeSelection } from "../selection";
import type { Choices } from "../userdata/schema";

/** One cookie in a `document.cookie` string (raw, not decoded). */
export function readCookie(cookies: string, name: string): string | undefined {
  for (const part of cookies.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

/**
 * The cookies to write so this browser shows the account's choices: only those that differ from what the browser
 * already has. Selections are compared by their parsed fields, so key order or extra fields do not count as a change.
 */
export function cookieUpdates(choices: Choices, cookies: string): [name: string, value: string][] {
  const updates: [string, string][] = [];
  if (choices.selection) {
    const wanted = parseSelectionObject(choices.selection.value);
    const current = parseSelectionCookie(readCookie(cookies, SELECTION_COOKIE));
    if (JSON.stringify(wanted) !== JSON.stringify(current)) updates.push([SELECTION_COOKIE, serializeSelection(wanted)]);
  }
  if (choices.locale && isLocale(choices.locale.value) && readCookie(cookies, LOCALE_COOKIE) !== choices.locale.value) {
    updates.push([LOCALE_COOKIE, choices.locale.value]);
  }
  return updates;
}

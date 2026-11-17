// Message lookup, interpolation and plural selection. Pure functions, usable on
// the server and in the browser.

import type { Locale } from "./config";
import type { Messages, PluralKey, StringKey } from "./messages";

/** Plural forms by CLDR category; `other` is required and is the fallback. */
export interface Plural {
  one?: string;
  other: string;
}

/** A text per language, for data that comes from providers (edition names, credits). */
export type LocalizedText = Record<string, string>;

/** The text for a locale, falling back to English, then to any available language. */
export function localized(text: LocalizedText, locale: Locale | string): string {
  return text[locale] ?? text.en ?? Object.values(text)[0] ?? "";
}

export function format(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

function lookup(messages: Messages, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);
}

export interface Translator {
  locale: Locale;
  /** A plain message, with `{name}` placeholders replaced from `vars`. */
  t(key: StringKey, vars?: Record<string, string | number>): string;
  /** A plural message; `{count}` is filled in automatically. */
  tn(key: PluralKey, count: number, vars?: Record<string, string | number>): string;
  /** Format a date for the locale. */
  date(value: string | number | Date, options?: Intl.DateTimeFormatOptions): string;
}

const INTL_LOCALE: Record<Locale, string> = { en: "en-US", id: "id-ID" };

export function createTranslator(locale: Locale, messages: Messages): Translator {
  const rules = new Intl.PluralRules(INTL_LOCALE[locale]);
  return {
    locale,
    t(key, vars) {
      const message = lookup(messages, key);
      if (typeof message !== "string") throw new Error(`Missing message "${key}" for locale "${locale}"`);
      return format(message, vars);
    },
    tn(key, count, vars) {
      const forms = lookup(messages, key) as Plural | undefined;
      if (!forms || typeof forms.other !== "string") throw new Error(`Missing plural message "${key}" for locale "${locale}"`);
      const template = (rules.select(count) === "one" ? forms.one : undefined) ?? forms.other;
      return format(template, { count, ...vars });
    },
    date: (value, options = { dateStyle: "medium", timeStyle: "short" }) =>
      new Date(value).toLocaleString(INTL_LOCALE[locale], options),
  };
}

import "server-only";

import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, negotiateLocale, type Locale } from "./config";
import { MESSAGES } from "./messages";
import { createTranslator, type Translator } from "./translate";

/** The interface language of the current request (cookie, then Accept-Language). */
export async function getLocale(): Promise<Locale> {
  const [jar, list] = await Promise.all([cookies(), headers()]);
  return negotiateLocale(jar.get(LOCALE_COOKIE)?.value, list.get("accept-language"));
}

export async function getI18n(): Promise<Translator> {
  const locale = await getLocale();
  return createTranslator(locale, MESSAGES[locale]);
}

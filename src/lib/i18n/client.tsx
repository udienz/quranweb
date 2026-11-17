"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import type { Messages } from "./messages";
import { createTranslator, type Translator } from "./translate";

const I18nContext = createContext<Translator | null>(null);

/** Gives client components the translator for the language chosen on the server. */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const translator = useMemo(() => createTranslator(locale, messages), [locale, messages]);
  return <I18nContext.Provider value={translator}>{children}</I18nContext.Provider>;
}

export function useI18n(): Translator {
  const translator = useContext(I18nContext);
  if (!translator) throw new Error("useI18n must be used inside <I18nProvider>");
  return translator;
}

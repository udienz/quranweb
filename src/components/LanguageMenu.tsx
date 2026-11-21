"use client";

import { useRouter } from "next/navigation";
import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { writeCookie } from "@/lib/cookies";
import { isCommunityLocale, LOCALE_COOKIE, LOCALE_NAMES, LOCALES, reportTranslationUrl, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { useDismiss } from "@/lib/useDismiss";
import { userDataActions } from "@/lib/userdata/store";

/**
 * The interface language and how to change it. The choice is the cookie the server reads on every request (so it works
 * without an account) and, recorded as a choice, follows a signed-in reader to their other devices. Until a language is
 * chosen, the server follows the browser's language (see `negotiateLocale`).
 */
export function useLocaleChoice(): { current: Locale; choose: (next: Locale) => void } {
  const { locale } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic<Locale>(locale);

  function choose(next: Locale) {
    if (next === current) return;
    writeCookie(LOCALE_COOKIE, next);
    userDataActions.chooseLocale(next);
    startTransition(() => {
      setCurrent(next);
      router.refresh();
    });
  }
  return { current, choose };
}

/** A list of languages by their own names, in the order of LOCALES. */
const languageOptions = LOCALES.map((code) => ({ code, name: LOCALE_NAMES[code], community: isCommunityLocale(code) }));

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
  </svg>
);

/** The language button in the header and its dropdown, which scales to any number of languages. */
export default function LanguageMenu() {
  const { t } = useI18n();
  const { current, choose } = useLocaleChoice();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, box);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("nav.language")}: ${LOCALE_NAMES[current]}`}
        title={LOCALE_NAMES[current]}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold uppercase text-foreground transition hover:bg-muted"
      >
        <GlobeIcon />
        <span translate="no">{current}</span>
      </button>

      {open && (
        // Seventeen languages are taller than a small phone screen, and the header is sticky, so the page cannot scroll the
        // bottom of the menu into view: the menu scrolls inside itself instead.
        <div role="menu" aria-label={t("nav.language")} className="absolute end-0 top-full z-50 mt-2 max-h-[calc(100dvh-6rem)] w-52 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-2 shadow-lg">
          {languageOptions.map(({ code, name, community }) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={code === current}
              onClick={() => {
                close();
                choose(code);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start text-sm font-medium hover:bg-background"
            >
              {/* The badge goes to a second line when the name and the badge do not fit the menu (Bahasa Melayu with the
                  Russian or French badge); the menu keeps its width so it stays on screen at 320px. */}
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {/* Only the name is in its own language: the badge is interface text (and `uppercase` follows the lang, so
                    a Turkish lang on the whole item would write "COMMUNİTY"). */}
                <span lang={code} translate="no" className="whitespace-nowrap">
                  {name}
                </span>
                {community && (
                  <span
                    title={t("nav.communityTranslation")}
                    className="whitespace-nowrap rounded-full border border-gold/60 px-1.5 text-[10px] font-semibold uppercase leading-4 text-gold"
                  >
                    {t("nav.communityBadge")}
                  </span>
                )}
              </span>
              {code === current && (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </button>
          ))}
          {isCommunityLocale(current) && (
            <a
              href={reportTranslationUrl(current)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="mt-1 block rounded-xl border-t border-border px-3 pb-2 pt-3 text-xs font-medium text-primary hover:underline"
            >
              {t("nav.reportTranslation")}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** The same choice as a plain list, for the settings page. */
export function LanguageSelect() {
  const { t } = useI18n();
  const { current, choose } = useLocaleChoice();
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{t("display.language")}</span>
      <select
        value={current}
        onChange={(e) => choose(e.target.value as Locale)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {languageOptions.map(({ code, name, community }) => (
          <option key={code} value={code} lang={code} translate="no">
            {community ? `${name} (${t("nav.communityBadge")})` : name}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">{t("display.languageHint")}</span>
    </label>
  );
}

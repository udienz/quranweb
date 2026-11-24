"use client";

import { useRouter } from "next/navigation";
import { useCallback, useId, useOptimistic, useRef, useState, useTransition } from "react";
import { writeCookie } from "@/lib/cookies";
import { isCommunityLocale, LOCALE_COOKIE, LOCALE_NAMES, LOCALES_BY_NAME, reportTranslationUrl, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { languageIn } from "@/lib/quran/edition-names";
import { matchesQuery } from "@/lib/search-text";
import { useDismiss } from "@/lib/useDismiss";
import LanguageFlag from "./LanguageFlag";
import SearchableSelect, { SEARCH_THRESHOLD } from "./SearchableSelect";
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

/** A list of languages by their own names, in alphabetical order of those names (LOCALES_BY_NAME). */
const languageOptions = LOCALES_BY_NAME.map((code) => ({ code, name: LOCALE_NAMES[code], community: isCommunityLocale(code) }));

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
  </svg>
);

/** The language button in the header and its dropdown, which scales to any number of languages. */
export default function LanguageMenu() {
  const { t, locale } = useI18n();
  const { current, choose } = useLocaleChoice();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);
  useDismiss(open, close, box);
  const noteId = useId();
  // More than 10 languages: a search box above the list (issue #128), by the language's own name, its name in the interface
  // language, or its code.
  const searchable = languageOptions.length > SEARCH_THRESHOLD;
  const shown = languageOptions.filter(({ code, name }) => matchesQuery(`${name} ${languageIn(code, locale)} ${code}`, query));

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("nav.language")}: ${LOCALE_NAMES[current]}`}
        title={LOCALE_NAMES[current]}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold uppercase text-foreground transition hover:bg-muted"
      >
        <GlobeIcon />
        <span translate="no">{current}</span>
      </button>

      {open && (
        // Twenty-five languages are taller than a small phone screen, and the header is sticky, so the page cannot scroll the
        // bottom of the menu into view: the menu scrolls inside itself instead.
        <div role="menu" aria-label={t("nav.language")} aria-describedby={noteId} className="absolute end-0 top-full z-50 mt-2 max-h-[calc(100dvh-6rem)] w-60 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-2 shadow-lg">
          {searchable && (
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
                if (e.key === "Enter" && shown[0]) {
                  e.preventDefault();
                  close();
                  choose(shown[0].code);
                }
              }}
              placeholder={t("common.search")}
              aria-label={t("common.search")}
              className="mb-2 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
          )}
          {shown.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">{t("common.noMatches")}</p>}
          {shown.map(({ code, name, community }) => (
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
              <span className="flex items-center gap-2.5">
                <LanguageFlag locale={code} />
                {/* Only the name is in its own language; the asterisk marks a community translation (the note under the
                    list explains it), and screen readers hear the word instead of "star". */}
                <span className="whitespace-nowrap">
                  <span lang={code} translate="no">
                    {name}
                  </span>
                  {community && (
                    <>
                      <span aria-hidden="true" title={t("nav.communityTranslation")} className="ms-0.5 font-semibold text-primary">
                        *
                      </span>
                      <span className="sr-only"> ({t("nav.communityBadge")})</span>
                    </>
                  )}
                </span>
              </span>
              {code === current && (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </button>
          ))}
          <p id={noteId} className="mt-1 border-t border-border px-3 pb-1 pt-3 text-xs leading-5 text-muted-foreground">
            <span aria-hidden="true" className="font-semibold text-primary">* </span>
            {t("nav.communityTranslation")}
          </p>
          {isCommunityLocale(current) && (
            <a
              href={reportTranslationUrl(current)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="block rounded-xl px-3 pb-2 pt-1 text-xs font-medium text-primary hover:underline"
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
  const { t, locale } = useI18n();
  const { current, choose } = useLocaleChoice();
  return (
    <div className="flex flex-col gap-1 text-sm">
      <SearchableSelect
        label={t("display.language")}
        value={current}
        onChange={(v) => choose(v as Locale)}
        options={languageOptions.map(({ code, name, community }) => ({
          value: code,
          label: community ? `${name} *` : name,
          lang: code,
          keywords: `${languageIn(code, locale)} ${code}`,
        }))}
      />
      <span className="text-xs text-muted-foreground">{t("display.languageHint")}</span>
      <span className="text-xs text-muted-foreground">* {t("nav.communityTranslation")}</span>
    </div>
  );
}

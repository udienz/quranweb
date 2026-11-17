"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { writeCookie } from "@/lib/cookies";
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

/** Switches the interface language. The choice is a cookie that the server reads on every request. */
export default function LanguageSwitch() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic<Locale>(locale);

  function choose(next: Locale) {
    if (next === current) return;
    writeCookie(LOCALE_COOKIE, next);
    startTransition(() => {
      setCurrent(next);
      router.refresh();
    });
  }

  return (
    <div role="group" aria-label={t("nav.language")} className="flex rounded-full border border-border bg-card p-0.5 text-xs font-semibold">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          title={LOCALE_NAMES[code]}
          aria-pressed={code === current}
          onClick={() => choose(code)}
          className={`rounded-full px-2.5 py-1.5 uppercase transition ${
            code === current ? "bg-primary text-white dark:text-[hsl(192_64%_8%)]" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

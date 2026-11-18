"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isDark, readTheme } from "@/lib/display";
import { useI18n } from "@/lib/i18n/client";
import { chooseTheme } from "./DisplayControls";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

/** Quick switch in the header between light and dark. "Auto" is chosen on the settings page. */
export default function ThemeToggle() {
  const { t } = useI18n();
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  // With "auto", follow the device when it switches between light and dark while the page is open.
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readTheme() === "auto") document.documentElement.classList.toggle("dark", isDark("auto"));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <button
      type="button"
      onClick={() => chooseTheme(dark ? "light" : "dark")}
      aria-label={dark ? t("nav.switchToLight") : t("nav.switchToDark")}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted"
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

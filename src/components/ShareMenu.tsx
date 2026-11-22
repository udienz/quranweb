"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";
import { shareReference, shareText, shareUrl, whatsappHref } from "@/lib/share";
import { useDismiss } from "@/lib/useDismiss";

const noSubscribe = () => () => {};

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/**
 * Share one verse: copy its text with the citation and link, copy only the link, the device's own share sheet (where the
 * browser has one, mostly on phones), or WhatsApp. The link is the verse's own page (`/surah/2/255`), which has a preview.
 * The text is what the reader sees, as published. `up` opens the menu above its button (for the bar at the bottom of the
 * screen in the mushaf layout).
 */
export default function ShareMenu({
  surah,
  surahName,
  verse,
  arabic,
  translations,
  up = false,
}: {
  surah: number;
  surahName: string;
  verse: number;
  arabic: string;
  translations: string[];
  up?: boolean;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, box);
  // The share sheet exists only in some browsers; the server renders without it.
  const canShare = useSyncExternalStore(
    noSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );

  const reference = shareReference(locale, surahName, surah, verse);
  const url = () => shareUrl(location.origin, surah, verse);
  const text = () => shareText({ arabic, translations, reference, url: url() });

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
    close();
  }

  async function nativeShare() {
    close();
    try {
      await navigator.share({ title: reference, text: text() });
    } catch {
      // The reader closed the share sheet: nothing to do.
    }
  }

  const item = "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm font-medium hover:bg-background";

  return (
    <div ref={box} className="relative flex items-center">
      {copied && <span role="status" className="me-1 text-xs text-primary">{t("verse.copied")}</span>}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("verse.share")}
        title={t("verse.share")}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted after:absolute after:-inset-1 after:rounded-full"
      >
        <svg {...iconProps}>
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t("verse.share")}
          className={`absolute end-0 z-40 w-56 rounded-2xl border border-border bg-card p-1.5 shadow-lg ${up ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          <button type="button" role="menuitem" onClick={() => copy(text())} className={item}>
            {t("verse.copy")}
          </button>
          <button type="button" role="menuitem" onClick={() => copy(url())} className={item}>
            {t("verse.copyLink")}
          </button>
          {canShare && (
            <button type="button" role="menuitem" onClick={nativeShare} className={item}>
              {t("verse.shareDevice")}
            </button>
          )}
          <a
            role="menuitem"
            href={whatsappHref(text())}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className={item}
          >
            <span translate="no">WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
}

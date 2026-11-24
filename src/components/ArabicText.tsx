"use client";

import { Fragment } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { VerseView } from "@/lib/quran";
import { usePrefs } from "./PrefsProvider";

/**
 * The Arabic text of a verse: the QPC Hafs text with its tajweed colours while they are on and the page has it (issue #130),
 * otherwise the chosen Arabic text. Each rule is a class (`tj-ghunnah`, ...) whose colour globals.css sets per theme.
 */
export default function ArabicText({ verse }: { verse: Pick<VerseView, "arabic" | "tajweed"> }) {
  const { prefs } = usePrefs();
  if (!prefs.tajweed || !verse.tajweed) return <>{verse.arabic}</>;
  return (
    <>
      {verse.tajweed.map(([text, rule], i) =>
        rule ? (
          <span key={i} className={`tj-${rule}`}>
            {text}
          </span>
        ) : (
          <Fragment key={i}>{text}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * ع after the last verse of a ruku, while the marks are on (issue #132). There is no ۩ mark: every Arabic text we show already
 * has it in its verses of prostration.
 */
export function RukuMark({ verse }: { verse: Pick<VerseView, "rukuEnd"> }) {
  const { t } = useI18n();
  const { prefs } = usePrefs();
  if (!prefs.marks || !verse.rukuEnd) return null;
  return (
    <span role="img" aria-label={t("marks.ruku")} title={t("marks.ruku")} className="mx-1 align-super text-[0.55em] text-gold">
      ع
    </span>
  );
}

/** The colours of the tajweed rules (globals.css) and what each one marks, in the order a reader usually learns them. */
const LEGEND = [
  ["silent", "--tj-silent"],
  ["maddNatural", "--tj-madd-normal"],
  ["maddPermissible", "--tj-madd-permissible"],
  ["maddObligatory", "--tj-madd-obligatory"],
  ["maddNecessary", "--tj-madd-necessary"],
  ["ghunnah", "--tj-ghunnah"],
  ["ikhfa", "--tj-ikhfa"],
  ["ikhfaShafawi", "--tj-ikhfa-shafawi"],
  ["idghamGhunnah", "--tj-idgham-ghunnah"],
  ["idghamNoGhunnah", "--tj-idgham-no-ghunnah"],
  ["idghamShafawi", "--tj-idgham-shafawi"],
  ["iqlab", "--tj-iqlab"],
  ["qalqalah", "--tj-qalqalah"],
] as const;

/** What the tajweed colours mean (issue #134): folded under the setting, each colour with its rule. */
export function TajweedLegend() {
  const { t } = useI18n();
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-xs font-medium text-primary">{t("tajweed.legend")}</summary>
      <ul className="mt-2 flex flex-col gap-1.5">
        {LEGEND.map(([key, colour]) => (
          <li key={key} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ background: `var(${colour})` }} />
            <span>{t(`tajweed.${key}`)}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

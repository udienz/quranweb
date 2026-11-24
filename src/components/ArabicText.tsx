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

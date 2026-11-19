"use client";

import { useI18n } from "@/lib/i18n/client";

/**
 * The footnotes an edition publishes for a verse (QuranEnc's translations have them, marked "[252]" in the text), folded
 * under the translation and shown exactly as published.
 */
export default function Footnotes({ notes, lang }: { notes: string; lang?: string }) {
  const { t } = useI18n();
  return (
    <details className="mt-1 block text-muted-foreground">
      <summary className="cursor-pointer select-none text-xs font-medium hover:text-foreground">{t("verse.footnotes")}</summary>
      <p lang={lang} translate="no" className="mt-1 whitespace-pre-line text-[length:calc(0.875rem*var(--latin-scale,1))] leading-relaxed">
        {notes}
      </p>
    </details>
  );
}

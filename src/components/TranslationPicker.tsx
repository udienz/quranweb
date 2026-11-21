"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { languageNamer } from "@/lib/i18n/languages";
import type { Edition } from "@/lib/quran";
import { groupTranslations, initialTranslationLanguage } from "@/lib/quran/translation-groups";

const selectClass = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

/**
 * Choose the translations to read, compactly: the ones chosen are shown as small removable labels, a list of languages (with
 * how many translations each has) picks which language to look at, and only that language's translations are listed. It stays
 * as short with fifty translations as with five.
 */
export default function TranslationPicker({
  editions,
  selected,
  onChange,
  nameOf,
}: {
  /** Every translation of the catalog. */
  editions: Edition[];
  /** The ids chosen now. */
  selected: string[];
  onChange: (ids: string[]) => void;
  nameOf: (edition: Edition) => string;
}) {
  const { t, locale } = useI18n();
  const groups = useMemo(() => groupTranslations(editions, locale, languageNamer(t, locale)), [editions, locale, t]);
  const [chosen, setChosen] = useState<string | undefined>(() => initialTranslationLanguage(groups, selected, locale));
  const language = groups.some((g) => g.language === chosen) ? chosen : groups[0]?.language;
  const group = groups.find((g) => g.language === language);
  const chips = selected.map((id) => editions.find((e) => e.id === id)).filter((e): e is Edition => !!e);
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{t("settings.translation")}</legend>

      <ul className="mb-2 flex flex-wrap gap-1.5" aria-label={t("settings.translation")}>
        {chips.length === 0 && <li className="text-xs text-muted-foreground">{t("settings.noTranslationChosen")}</li>}
        {chips.map((e) => (
          <li key={e.id} className="flex items-center gap-1 rounded-full border border-border bg-background py-0.5 ps-2.5 pe-1 text-xs">
            <span>{nameOf(e)}</span>
            <button
              type="button"
              onClick={() => toggle(e.id)}
              aria-label={t("settings.removeTranslation", { name: nameOf(e) })}
              className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span aria-hidden>×</span>
            </button>
          </li>
        ))}
      </ul>

      {groups.length > 0 && (
        <>
          <select aria-label={t("settings.translationLanguage")} className={selectClass} value={language} onChange={(e) => setChosen(e.target.value)}>
            {groups.map((g) => (
              <option key={g.language} value={g.language}>
                {g.label} ({g.editions.length}){g.editions.some((e) => selected.includes(e.id)) ? " ✓" : ""}
              </option>
            ))}
          </select>
          <ul className="mt-1">
            {group?.editions.map((e) => (
              <li key={e.id}>
                <label className="flex items-start gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[hsl(var(--primary))]"
                    checked={selected.includes(e.id)}
                    onChange={() => toggle(e.id)}
                  />
                  <span>{nameOf(e)}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </fieldset>
  );
}

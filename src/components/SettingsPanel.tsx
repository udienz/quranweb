"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { writeCookie } from "@/lib/cookies";
import { useI18n } from "@/lib/i18n/client";
import type { StringKey } from "@/lib/i18n/messages";
import { localized } from "@/lib/i18n/translate";
import type { Catalog, Edition, Selection } from "@/lib/quran";
import { SELECTION_COOKIE, serializeSelection } from "@/lib/selection";
import { userDataActions } from "@/lib/userdata/store";
import { usePrefs, type Prefs } from "./PrefsProvider";

const DISPLAY_TOGGLES: { key: keyof Prefs; label: StringKey }[] = [
  { key: "arabic", label: "settings.show.arabic" },
  { key: "transliteration", label: "settings.show.transliteration" },
  { key: "translation", label: "settings.show.translation" },
];

const LANGUAGE_LABELS: Record<string, StringKey> = {
  ar: "settings.languages.ar",
  id: "settings.languages.id",
  en: "settings.languages.en",
};

const selectClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

/** Display toggles (kept in the browser) and the edition and reciter choice (kept in a cookie the server reads). */
export default function SettingsPanel({
  catalog,
  selection: saved,
  hideTitle = false,
}: {
  catalog: Catalog;
  selection: Selection;
  /** Hide the title when the panel already sits under another heading (e.g. a <details>). */
  hideTitle?: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { prefs, toggle } = usePrefs();
  const [pending, startTransition] = useTransition();
  // Show the new choice at once; the server catches up when the refresh finishes.
  const [selection, setOptimistic] = useOptimistic(saved);

  const ofKind = (kind: Edition["kind"]) => catalog.editions.filter((e) => e.kind === kind);
  const nameOf = (e: Edition) => localized(e.name, locale);
  const languageLabel = (code: string) => (LANGUAGE_LABELS[code] ? t(LANGUAGE_LABELS[code]) : code.toUpperCase());

  function save(next: Selection) {
    writeCookie(SELECTION_COOKIE, serializeSelection(next));
    userDataActions.chooseSelection(next);
    startTransition(() => {
      setOptimistic(next);
      router.refresh();
    });
  }

  const translationGroups = new Map<string, Edition[]>();
  for (const e of ofKind("translation")) translationGroups.set(e.language, [...(translationGroups.get(e.language) ?? []), e]);

  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-busy={pending}>
      {!hideTitle && <h2 className="mb-3 font-display font-semibold">{t("settings.title")}</h2>}

      <ul className="mb-4 flex flex-col gap-3 border-b border-border pb-4">
        {DISPLAY_TOGGLES.map(({ key, label }) => (
          <li key={key} className="flex items-center justify-between text-sm">
            <span id={`pref-${key}`}>{t(label)}</span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              aria-labelledby={`pref-${key}`}
              onClick={() => toggle(key)}
              className={`relative h-6 w-11 rounded-full transition ${prefs[key] ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  prefs[key] ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4">
        <Field label={t("settings.arabic")}>
          <select
            className={selectClass}
            value={selection.arabic}
            onChange={(e) => save({ ...selection, arabic: e.target.value })}
          >
            {ofKind("arabic").map((e) => (
              <option key={e.id} value={e.id}>
                {nameOf(e)}
              </option>
            ))}
          </select>
        </Field>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t("settings.translation")}</legend>
          {[...translationGroups].map(([language, editions]) => (
            <div key={language} className="mb-2 last:mb-0">
              <p className="mb-1 text-xs text-muted-foreground">{languageLabel(language)}</p>
              {editions.map((e) => {
                const checked = selection.translations.includes(e.id);
                return (
                  <label key={e.id} className="flex items-start gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 accent-[hsl(var(--primary))]"
                      checked={checked}
                      onChange={() =>
                        save({
                          ...selection,
                          translations: checked
                            ? selection.translations.filter((id) => id !== e.id)
                            : [...selection.translations, e.id],
                        })
                      }
                    />
                    <span>{nameOf(e)}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </fieldset>

        <Field label={t("settings.tafsir")}>
          <select
            className={selectClass}
            value={selection.tafsir ?? ""}
            onChange={(e) => save({ ...selection, tafsir: e.target.value || null })}
          >
            <option value="">{t("settings.noTafsir")}</option>
            {ofKind("tafsir").map((e) => (
              <option key={e.id} value={e.id}>
                {nameOf(e)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("settings.qari")}>
          <select
            className={selectClass}
            value={selection.qari}
            onChange={(e) => save({ ...selection, qari: e.target.value })}
          >
            {catalog.qaris.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("settings.savedInBrowser")}</p>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { writeCookie } from "@/lib/cookies";
import { useSelectionChoice } from "@/lib/useSelectionChoice";
import { useI18n } from "@/lib/i18n/client";
import type { StringKey } from "@/lib/i18n/messages";
import { localized } from "@/lib/i18n/translate";
import type { Catalog, Edition, Selection } from "@/lib/quran";
import { LAYOUT_COOKIE, type Layout } from "@/lib/layout";
import { userDataActions } from "@/lib/userdata/store";
import { FontSizeControls } from "./DisplayControls";
import { usePrefs, type Prefs } from "./PrefsProvider";
import ReciterPicker from "./ReciterPicker";
import TranslationPicker from "./TranslationPicker";

const DISPLAY_TOGGLES: { key: keyof Prefs; label: StringKey }[] = [
  { key: "arabic", label: "settings.show.arabic" },
  { key: "transliteration", label: "settings.show.transliteration" },
  { key: "translation", label: "settings.show.translation" },
];

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
  layout: savedLayout,
  hideTitle = false,
  id,
  showLink = true,
  showQari = true,
}: {
  catalog: Catalog;
  selection: Selection;
  /** Mushaf or verse by verse (cookie qw-layout, read by the server). */
  layout: Layout;
  /** Hide the title when the panel already sits under another heading (e.g. a <details>). */
  hideTitle?: boolean;
  /** Anchor for links to this panel (the settings page). */
  id?: string;
  /** Text size controls and the link to the settings page; off on the settings page, which has them elsewhere. */
  showLink?: boolean;
  /** The reciter list; the settings page leaves it out because its Audio section has it. */
  showQari?: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { prefs, toggle } = usePrefs();
  const [layoutPending, startTransition] = useTransition();
  // Show the new choice at once; the server catches up when the refresh finishes.
  const { selection, save, pending: selectionPending } = useSelectionChoice(saved);
  const pending = layoutPending || selectionPending;
  const [layout, setOptimisticLayout] = useOptimistic(savedLayout);

  const ofKind = (kind: Edition["kind"]) => catalog.editions.filter((e) => e.kind === kind);
  const nameOf = (e: Edition) => localized(e.name, locale);

  function saveLayout(next: Layout) {
    if (next === layout) return;
    writeCookie(LAYOUT_COOKIE, next);
    userDataActions.chooseLayout(next);
    startTransition(() => {
      setOptimisticLayout(next);
      router.refresh();
    });
  }

  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-border bg-card p-4" aria-busy={pending}>
      {!hideTitle && <h2 className="mb-3 font-display font-semibold">{t("settings.title")}</h2>}

      <div role="group" aria-label={t("settings.layout")} className="mb-4 flex flex-col gap-1 border-b border-border pb-4 text-sm">
        <span className="font-medium">{t("settings.layout")}</span>
        <div className="flex rounded-full border border-border bg-background p-0.5 text-xs font-semibold">
          {(["mushaf", "cards"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={layout === value}
              onClick={() => saveLayout(value)}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${
                layout === value ? "bg-primary text-white dark:text-[hsl(192_64%_8%)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {value === "mushaf" ? t("settings.layoutMushaf") : t("settings.layoutCards")}
            </button>
          ))}
        </div>
      </div>

      {showLink && (
        <div className="mb-4 border-b border-border pb-4">
          <FontSizeControls />
        </div>
      )}

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

        <TranslationPicker
          editions={ofKind("translation")}
          selected={selection.translations}
          onChange={(translations) => save({ ...selection, translations })}
          nameOf={nameOf}
        />

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

        {showQari && (
          <ReciterPicker qaris={catalog.qaris} value={selection.qari} onChange={(qari) => save({ ...selection, qari })} />
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("settings.savedInBrowser")}</p>
      {showLink && (
        <Link href="/settings" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          {t("settings.allSettings")}
        </Link>
      )}
    </section>
  );
}

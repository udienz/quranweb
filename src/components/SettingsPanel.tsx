"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { writeCookie } from "@/lib/cookies";
import { useSelectionChoice } from "@/lib/useSelectionChoice";
import { useI18n } from "@/lib/i18n/client";
import { LOCALE_NAMES } from "@/lib/i18n/config";
import { languageNamer } from "@/lib/i18n/languages";
import type { StringKey } from "@/lib/i18n/messages";
import { localized } from "@/lib/i18n/translate";
import type { Catalog, Edition, Selection } from "@/lib/quran";
import { LAYOUT_COOKIE, type Layout } from "@/lib/layout";
import { PAGING_COOKIE, type Paging } from "@/lib/paging";
import { groupTranslations } from "@/lib/quran/translation-groups";
import { userDataActions } from "@/lib/userdata/store";
import { ArabicFontChoice, FontSizeControls } from "./DisplayControls";
import { usePrefs, type Prefs } from "./PrefsProvider";
import { TajweedLegend } from "./ArabicText";
import ReciterPicker from "./ReciterPicker";
import SearchableSelect, { type ChoiceOption } from "./SearchableSelect";
import TranslationPicker from "./TranslationPicker";

const DISPLAY_TOGGLES: { key: keyof Prefs; label: StringKey }[] = [
  { key: "arabic", label: "settings.show.arabic" },
  { key: "transliteration", label: "settings.show.transliteration" },
  { key: "translation", label: "settings.show.translation" },
  { key: "tajweed", label: "settings.show.tajweed" },
  { key: "marks", label: "settings.show.marks" },
];

/** Display toggles (kept in the browser) and the edition and reciter choice (kept in a cookie the server reads). */
export default function SettingsPanel({
  catalog,
  selection: saved,
  layout: savedLayout,
  paging: savedPaging,
  hideTitle = false,
  id,
  showLink = true,
  showQari = true,
  languageDefaults,
  versesHref,
}: {
  catalog: Catalog;
  selection: Selection;
  /** Mushaf or verse by verse (cookie qw-layout, read by the server). */
  layout: Layout;
  /** 10-verse pages or the pages of the mushaf (cookie qw-paging, read by the server). */
  paging: Paging;
  /** Hide the title when the panel already sits under another heading (e.g. a <details>). */
  hideTitle?: boolean;
  /** Anchor for links to this panel (the settings page). */
  id?: string;
  /** Text size controls and the link to the settings page; off on the settings page, which has them elsewhere. */
  showLink?: boolean;
  /** The reciter list; the settings page leaves it out because its Audio section has it. */
  showQari?: boolean;
  /**
   * The translations and tafsir of the interface language (its defaults). Changing the language never changes the reader's
   * choice (we decided, issue #127); a button offers these when they differ.
   */
  languageDefaults?: { translations: string[]; tafsir: string | null };
  /**
   * Where to go when the reader picks pages of 10 verses on a page of the mushaf, which does not follow that setting: the
   * surah page that has the mushaf page's first verse. Elsewhere the page just refreshes.
   */
  versesHref?: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { prefs, toggle } = usePrefs();
  const [layoutPending, startTransition] = useTransition();
  // Show the new choice at once; the server catches up when the refresh finishes.
  const { selection, save, pending: selectionPending } = useSelectionChoice(saved);
  const pending = layoutPending || selectionPending;
  const [layout, setOptimisticLayout] = useOptimistic(savedLayout);
  const [paging, setOptimisticPaging] = useOptimistic(savedPaging);

  const ofKind = (kind: Edition["kind"]) => catalog.editions.filter((e) => e.kind === kind);
  const nameOf = (e: Edition) => localized(e.name, locale);
  const namer = languageNamer(t, locale);

  // The tafsir by language: the interface language first (or, when it has none, the language of its default tafsir), then
  // the others by name.
  const tafsirs = ofKind("tafsir");
  const defaultTafsirLanguage = tafsirs.find((e) => e.id === languageDefaults?.tafsir)?.language;
  const firstLanguage = tafsirs.some((e) => e.language === locale) ? locale : (defaultTafsirLanguage ?? locale);
  const tafsirOptions: ChoiceOption[] = [
    { value: "", label: t("settings.noTafsir") },
    ...groupTranslations(tafsirs, firstLanguage, namer).flatMap((g) =>
      g.editions.map((e) => ({ value: e.id, label: nameOf(e), group: g.label, keywords: e.language })),
    ),
  ];
  const differsFromLanguage =
    !!languageDefaults &&
    (languageDefaults.tafsir !== selection.tafsir ||
      languageDefaults.translations.length !== selection.translations.length ||
      languageDefaults.translations.some((id, i) => selection.translations[i] !== id));

  function saveLayout(next: Layout) {
    if (next === layout) return;
    writeCookie(LAYOUT_COOKIE, next);
    userDataActions.chooseLayout(next);
    startTransition(() => {
      setOptimisticLayout(next);
      router.refresh();
    });
  }

  function savePaging(next: Paging) {
    if (next === paging) return;
    writeCookie(PAGING_COOKIE, next);
    userDataActions.choosePaging(next);
    startTransition(() => {
      setOptimisticPaging(next);
      if (next === "verses" && versesHref) router.push(versesHref);
      else router.refresh();
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

      <div role="group" aria-label={t("settings.paging")} className="mb-4 flex flex-col gap-1 border-b border-border pb-4 text-sm">
        <span className="font-medium">{t("settings.paging")}</span>
        <div className="flex rounded-full border border-border bg-background p-0.5 text-xs font-semibold">
          {(["verses", "mushaf"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={paging === value}
              onClick={() => savePaging(value)}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${
                paging === value ? "bg-primary text-white dark:text-[hsl(192_64%_8%)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {value === "verses" ? t("settings.pagingVerses") : t("settings.pagingMushaf")}
            </button>
          ))}
        </div>
      </div>

      {showLink && (
        <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4">
          <FontSizeControls />
          <ArabicFontChoice />
        </div>
      )}

      <ul className="mb-4 flex flex-col gap-3 border-b border-border pb-4">
        {DISPLAY_TOGGLES.map(({ key, label }) => (
          <li key={key} className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
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
                    prefs[key] ? "start-[22px]" : "start-0.5"
                  }`}
                />
              </button>
            </div>
            {key === "tajweed" && <TajweedLegend />}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4">
        <SearchableSelect
          label={t("settings.arabic")}
          options={ofKind("arabic").map((e) => ({ value: e.id, label: nameOf(e) }))}
          value={selection.arabic}
          onChange={(arabic) => save({ ...selection, arabic })}
        />

        {differsFromLanguage && languageDefaults && (
          <button
            type="button"
            onClick={() => save({ ...selection, translations: languageDefaults.translations, tafsir: languageDefaults.tafsir })}
            className="self-start text-start text-sm font-medium text-primary hover:underline"
          >
            {t("settings.useLanguageDefaults", { language: LOCALE_NAMES[locale] })}
          </button>
        )}

        <TranslationPicker
          editions={ofKind("translation")}
          selected={selection.translations}
          onChange={(translations) => save({ ...selection, translations })}
          nameOf={nameOf}
        />

        <SearchableSelect
          label={t("settings.tafsir")}
          options={tafsirOptions}
          value={selection.tafsir ?? ""}
          onChange={(tafsir) => save({ ...selection, tafsir: tafsir || null })}
        />

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

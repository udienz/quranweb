"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import type { Catalog, Edition, Selection } from "@/lib/quran";
import { SELECTION_COOKIE, serializeSelection } from "@/lib/selection";
import { usePrefs, type Prefs } from "./PrefsProvider";

const PREF_LABELS: { key: keyof Prefs; label: string }[] = [
  { key: "arab", label: "Teks Arab" },
  { key: "latin", label: "Transliterasi" },
  { key: "terjemahan", label: "Terjemahan" },
];

const LANGUAGE: Record<string, string> = { ar: "Arab", id: "Indonesia", en: "Inggris" };
const languageLabel = (code: string) => LANGUAGE[code] ?? code.toUpperCase();

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

/** Tampilan (disimpan di browser) dan pilihan edisi dan qari (disimpan di cookie, dibaca server). */
export default function SettingsPanel({
  catalog,
  selection: saved,
  hideTitle = false,
}: {
  catalog: Catalog;
  selection: Selection;
  /** Sembunyikan judul bila panel sudah berada di bawah judul lain (mis. <details>). */
  hideTitle?: boolean;
}) {
  const router = useRouter();
  const { prefs, toggle } = usePrefs();
  const [pending, startTransition] = useTransition();
  // Tampilkan pilihan baru seketika; server menyusul setelah refresh selesai.
  const [selection, setOptimistic] = useOptimistic(saved);

  const ofKind = (kind: Edition["kind"]) => catalog.editions.filter((e) => e.kind === kind);

  function save(next: Selection) {
    document.cookie = `${SELECTION_COOKIE}=${serializeSelection(next)}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      setOptimistic(next);
      router.refresh();
    });
  }

  const translationGroups = new Map<string, Edition[]>();
  for (const e of ofKind("translation")) translationGroups.set(e.language, [...(translationGroups.get(e.language) ?? []), e]);

  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-busy={pending}>
      {!hideTitle && <h2 className="mb-3 font-display font-semibold">Pengaturan bacaan</h2>}

      <ul className="mb-4 flex flex-col gap-3 border-b border-border pb-4">
        {PREF_LABELS.map(({ key, label }) => (
          <li key={key} className="flex items-center justify-between text-sm">
            <span id={`pref-${key}`}>{label}</span>
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
        <Field label="Teks Arab">
          <select
            className={selectClass}
            value={selection.arabic}
            onChange={(e) => save({ ...selection, arabic: e.target.value })}
          >
            {ofKind("arabic").map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Terjemahan</legend>
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
                            ? selection.translations.filter((t) => t !== e.id)
                            : [...selection.translations, e.id],
                        })
                      }
                    />
                    <span>{e.name}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </fieldset>

        <Field label="Tafsir">
          <select
            className={selectClass}
            value={selection.tafsir ?? ""}
            onChange={(e) => save({ ...selection, tafsir: e.target.value || null })}
          >
            <option value="">Tanpa tafsir</option>
            {ofKind("tafsir").map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Qari">
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
      <p className="mt-3 text-xs text-muted-foreground">Pilihan disimpan di browser ini.</p>
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { beginJuz } from "@/lib/audio";
import { useI18n } from "@/lib/i18n/client";
import type { Catalog, JuzRef, Selection } from "@/lib/quran";
import { useSelectionChoice } from "@/lib/useSelectionChoice";
import PlaybackModeSelect from "./PlaybackModeSelect";
import ReciterPicker from "./ReciterPicker";

const selectClass = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

/**
 * The Audio section of the settings page: the reciter, what happens at the end of a surah or a juz, and starting a whole juz.
 * The reciter is also in the quick settings beside a surah; here it is not repeated under the reading settings.
 */
export default function AudioSection({ catalog, selection: saved, juzs }: { catalog: Catalog; selection: Selection; juzs: JuzRef[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const { selection, save, pending } = useSelectionChoice(saved);

  return (
    <section id="audio" className="scroll-mt-24 rounded-2xl border border-border bg-card p-4" aria-busy={pending}>
      <h2 className="mb-3 font-display font-semibold">{t("settingsPage.audio")}</h2>
      <div className="flex flex-col gap-4">
        <ReciterPicker qaris={catalog.qaris} value={selection.qari} onChange={(qari) => save({ ...selection, qari })} />

        <PlaybackModeSelect />

        {juzs.length > 0 && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("reader.playJuz")}</span>
            <select
              defaultValue=""
              className={selectClass}
              onChange={(e) => {
                const juz = juzs.find((j) => j.juz === Number(e.target.value));
                e.target.value = ""; // back to the prompt, so the same juz can be chosen again
                if (juz) router.push(beginJuz(juz.juz, juz.start));
              }}
            >
              <option value="" disabled>
                {t("reader.juzPlaceholder")}
              </option>
              {juzs.map((j) => (
                <option key={j.juz} value={j.juz}>
                  {t("reader.juzOption", { juz: j.juz, surah: j.start.surah, verse: j.start.verse })}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="text-xs text-muted-foreground">{t("audio.hint")}</p>
      </div>
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { beginJuz } from "@/lib/audio";
import { useI18n } from "@/lib/i18n/client";
import type { Catalog, JuzRef, Selection } from "@/lib/quran";
import { useSelectionChoice } from "@/lib/useSelectionChoice";
import AudioQualitySelect from "./AudioQualitySelect";
import PlaybackModeSelect from "./PlaybackModeSelect";
import ReciterPicker from "./ReciterPicker";
import SearchableSelect from "./SearchableSelect";


/**
 * The Audio section of the settings page: the reciter, the audio quality (data saver), what happens at the end of a surah or a juz, and starting a whole juz.
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

        <AudioQualitySelect dataSaver={catalog.qaris.find((q) => q.id === selection.qari)?.dataSaver === true} />

        <PlaybackModeSelect />

        {/* A reciter with whole surahs only has no verse files, so no juz can be played verse by verse (issue #111). */}
        {juzs.length > 0 && catalog.qaris.find((q) => q.id === selection.qari)?.wholeSurahOnly !== true && (
          // The value stays empty: choosing starts the juz, and the same juz can be chosen again.
          <SearchableSelect
            label={t("reader.playJuz")}
            placeholder={t("reader.juzPlaceholder")}
            value=""
            onChange={(v) => {
              const juz = juzs.find((j) => j.juz === Number(v));
              if (juz) router.push(beginJuz(juz.juz, juz.start));
            }}
            options={juzs.map((j) => ({ value: String(j.juz), label: t("reader.juzOption", { juz: j.juz, surah: j.start.surah, verse: j.start.verse }) }))}
          />
        )}
        <p className="text-xs text-muted-foreground">{t("audio.hint")}</p>
        <p className="text-xs text-muted-foreground">{t("audio.keys")}</p>
      </div>
    </section>
  );
}

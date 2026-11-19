"use client";

import { useSyncExternalStore } from "react";
import { applyAudioQuality, AUDIO_QUALITIES, DEFAULT_AUDIO_QUALITY, readAudioQuality, subscribeAudioQuality, type AudioQuality } from "@/lib/audio-quality";
import { useI18n } from "@/lib/i18n/client";

/**
 * Standard audio or data saver (the smallest file of the reciter). Kept in this browser only. `dataSaver` says whether the
 * chosen reciter has a smaller recording, so the hint can say whether the choice changes anything for them.
 */
export default function AudioQualitySelect({ dataSaver }: { dataSaver: boolean }) {
  const { t } = useI18n();
  const quality = useSyncExternalStore(subscribeAudioQuality, readAudioQuality, () => DEFAULT_AUDIO_QUALITY);
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{t("audio.quality")}</span>
      <select
        value={quality}
        onChange={(e) => applyAudioQuality(e.target.value as AudioQuality)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {AUDIO_QUALITIES.map((value) => (
          <option key={value} value={value}>
            {t(`audio.qualities.${value}`)}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">
        {t(dataSaver ? "audio.qualityHelpSaver" : "audio.qualityHelpNone")} {t("audio.qualityDevice")}
      </span>
    </label>
  );
}

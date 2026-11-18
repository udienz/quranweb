"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";
import { applyPlaybackMode, DEFAULT_PLAYBACK_MODE, PLAYBACK_MODES, readPlaybackMode, subscribePlayback, type PlaybackMode } from "@/lib/playback";
import { userDataActions } from "@/lib/userdata/store";

/**
 * What the audio does at the end of a surah or a juz: stop, repeat, or go on. Kept in this browser and recorded so it follows
 * the account. Used in the surah header (`onDark`) and in the Audio section of the settings page.
 */
export default function PlaybackModeSelect({ onDark = false }: { onDark?: boolean }) {
  const { t } = useI18n();
  const mode = useSyncExternalStore(subscribePlayback, readPlaybackMode, () => DEFAULT_PLAYBACK_MODE);
  const select = (
    <select
      value={mode}
      onChange={(e) => {
        const next = e.target.value as PlaybackMode;
        applyPlaybackMode(next);
        userDataActions.choosePlaybackMode(next);
      }}
      title={t("reader.whenEnds")}
      className={
        onDark
          ? "rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-gold outline-none [&>option]:bg-[hsl(192_64%_9%)] [&>option]:text-white"
          : "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      }
    >
      {PLAYBACK_MODES.map((value) => (
        <option key={value} value={value}>
          {t(`reader.mode.${value}`)}
        </option>
      ))}
    </select>
  );
  return onDark ? (
    <label className="flex items-center gap-2 text-sm text-white/85">
      <span className="sr-only">{t("reader.whenEnds")}</span>
      {select}
    </label>
  ) : (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{t("reader.whenEnds")}</span>
      {select}
    </label>
  );
}

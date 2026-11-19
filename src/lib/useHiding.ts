"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_HIDE_MODE, getShown, isShown, readHideMode, subscribeHiding, toggleShown } from "./memorize";

const EMPTY: ReadonlySet<string> = new Set();

/**
 * Whether a verse's Arabic or translation is hidden for memorizing, and the props that make a hidden block blurred and
 * tappable (tap or Enter shows it; again hides it).
 */
export function useHiding(surah: number) {
  const mode = useSyncExternalStore(subscribeHiding, readHideMode, () => DEFAULT_HIDE_MODE);
  const shown = useSyncExternalStore(subscribeHiding, getShown, () => EMPTY);
  const hidden = (part: "arabic" | "translation", verse: number) => mode === part && !isShown(shown, surah, verse);
  /** Extra props for a block that may be hidden: blurred while hidden, and a tap toggles it. */
  const props = (part: "arabic" | "translation", verse: number, label: string) =>
    mode === part
      ? {
          role: "button" as const,
          tabIndex: 0,
          "aria-label": hidden(part, verse) ? label : undefined,
          "aria-pressed": !hidden(part, verse),
          onClick: () => toggleShown(surah, verse),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleShown(surah, verse);
            }
          },
          "data-hidden": hidden(part, verse) ? "" : undefined,
        }
      : {};
  return { mode, hidden, props };
}

"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { writeCookie } from "./cookies";
import type { Selection } from "./quran";
import { SELECTION_COOKIE, serializeSelection } from "./selection";
import { userDataActions } from "./userdata/store";

/**
 * The reader's choice of editions and reciter, and how to change it: the cookie the server reads, the choice recorded so it
 * follows the account, and the page refreshed. The new choice shows at once; the server catches up when the refresh ends.
 * Shared by the reading settings and the Audio section of the settings page.
 */
export function useSelectionChoice(saved: Selection): { selection: Selection; save: (next: Selection) => void; pending: boolean } {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selection, setOptimistic] = useOptimistic(saved);

  function save(next: Selection) {
    writeCookie(SELECTION_COOKIE, serializeSelection(next));
    userDataActions.chooseSelection(next);
    startTransition(() => {
      setOptimistic(next);
      router.refresh();
    });
  }
  return { selection, save, pending };
}

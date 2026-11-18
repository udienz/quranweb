"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { writeCookie } from "../cookies";
import { applyFontSize, applyTheme, displayUpdates, readFontSize, readTheme } from "../display";
import { userDataSync } from "../userdata/store";
import { parseUserData, type UserData } from "../userdata/schema";
import { cookieUpdates } from "./choices";
import { runSync } from "./engine";

export type SyncStatus = "idle" | "syncing" | "error";

const PAUSE_MS = 2000;

async function exchange(data: UserData): Promise<UserData> {
  const response = await fetch("/api/me/state", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!response.ok) throw new Error(`sync failed: ${response.status}`);
  const body = (await response.json()) as { data: unknown };
  return parseUserData(body.data);
}

/**
 * Keeps this browser's reading data and the signed-in account's data in step: once when the
 * reader is known, about 2 s after a local change, when the tab is hidden or shown again and when the
 * connection comes back. A failure never touches the local data; the next trigger tries again.
 */
export function useAccountSync(userId: string | null): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    const id = userId;
    let stopped = false;
    let running = false;
    let again = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let syncedRaw = "";

    async function sync() {
      if (stopped) return;
      if (running) {
        again = true;
        return;
      }
      running = true;
      setStatus("syncing");
      try {
        const merged = await runSync({ userId: id, ...userDataSync, exchange });
        syncedRaw = userDataSync.raw();
        // Choices made on another device: write them to this browser's cookies and render again.
        const updates = cookieUpdates(merged.choices, document.cookie);
        if (updates.length > 0 && !stopped) {
          for (const [name, value] of updates) writeCookie(name, value);
          router.refresh();
        }
        // Theme and text size live in local storage: apply them here, no page refresh needed.
        const display = displayUpdates(merged.choices, { theme: readTheme(), fontSize: readFontSize() });
        if (display.theme && !stopped) applyTheme(display.theme);
        if (display.fontSize && !stopped) applyFontSize(display.fontSize);
        if (!stopped) setStatus("idle");
      } catch {
        if (!stopped) setStatus("error");
      } finally {
        running = false;
        if (again) {
          again = false;
          schedule(0);
        }
      }
    }

    function schedule(delay: number) {
      clearTimeout(timer);
      timer = setTimeout(sync, delay);
    }

    const unsubscribe = userDataSync.subscribe(() => {
      if (userDataSync.raw() !== syncedRaw) schedule(PAUSE_MS);
    });
    const onVisibility = () => schedule(0);
    const onOnline = () => schedule(0);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    schedule(0);

    return () => {
      stopped = true;
      clearTimeout(timer);
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [userId, router]);

  return status;
}

"use client";

// User data storage in localStorage, read through useSyncExternalStore: every component
// sees the same data, other tabs are updated through the `storage` event, and no state
// is set inside an effect. When localStorage cannot be used (private mode, blocked),
// the data keeps working in memory while the page is open.

import { useMemo, useSyncExternalStore } from "react";
import type { Locale } from "../i18n/config";
import type { ArabicFont, FontSize, Theme } from "../display";
import type { Layout } from "../layout";
import type { Paging } from "../paging";
import type { PlaybackMode } from "../playback";
import type { Selection } from "../quran/types";
import {
  emptyUserData,
  importUserData,
  mergeUserData,
  parseUserData,
  setBookmarkNote,
  setLastRead,
  toggleBookmark,
  toggleReadUpTo,
  removeBookmark,
  clearProgress,
  pruneTombstones,
  setLocaleChoice,
  setLayoutChoice,
  setPagingChoice,
  setThemeChoice,
  setFontSizeChoice,
  setArabicFontChoice,
  setPlaybackModeChoice,
  setSelectionChoice,
  createCollection,
  renameCollection,
  removeCollection,
  setBookmarkCollection,
  setDailyGoal,
  setDailyGoalInPages,
  recordVersesRead,
  progressOf,
  localDay,
  type UserData,
} from "./schema";

export const STORAGE_KEY = "quranweb:user";

const listeners = new Set<() => void>();
let memoryRaw = "";

function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function writeRaw(raw: string): void {
  memoryRaw = raw;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* keep it in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function parseOrEmpty(raw: string): UserData {
  if (!raw) return emptyUserData();
  try {
    return parseUserData(JSON.parse(raw));
  } catch {
    return emptyUserData(); // corrupt data must not break the page
  }
}

const now = () => new Date().toISOString();

const DEVICE_KEY = "quranweb:device";
let memoryDevice = "";

/** A random id for this browser, so its daily reading counts can be added to other devices' counts. */
function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    memoryDevice ||= crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    return memoryDevice;
  }
}

function update(fn: (data: UserData) => UserData): void {
  // Tombstones that every device has had time to see are dropped on each write.
  const next = pruneTombstones(fn(parseOrEmpty(readRaw())), now());
  writeRaw(JSON.stringify(next));
}

/** The actions are stable and always work on the latest data. */
export const userDataActions = {
  setLastRead: (surah: number, verse: number) => update((d) => setLastRead(d, surah, verse, now())),
  /** Marking verses as read also counts the newly read ones towards today's goal (unmarking never subtracts). */
  toggleReadUpTo: (surah: number, verse: number) =>
    update((d) => {
      const before = progressOf(d, surah);
      const next = toggleReadUpTo(d, surah, verse, now());
      const gained = progressOf(next, surah) - before;
      return gained > 0 ? recordVersesRead(next, deviceId(), localDay(new Date()), gained) : next;
    }),
  setDailyGoal: (versesPerDay: number) => update((d) => setDailyGoal(d, versesPerDay, now())),
  setDailyGoalInPages: (pages: number) => update((d) => setDailyGoalInPages(d, pages, now())),
  clearProgress: (surah: number) => update((d) => clearProgress(d, surah, now())),
  toggleBookmark: (surah: number, verse: number) => update((d) => toggleBookmark(d, surah, verse, now())),
  removeBookmark: (surah: number, verse: number) => update((d) => removeBookmark(d, surah, verse, now())),
  setBookmarkNote: (surah: number, verse: number, note: string) => update((d) => setBookmarkNote(d, surah, verse, note, now())),
  /** Merge a backup into the current data. Throws a UserDataError if the file is not valid. */
  importMerge: (text: string) => update((d) => mergeUserData(d, importUserData(text))),
  /** Create a collection and return its id. Throws when the name is empty or there are too many collections. */
  createCollection: (name: string): string => {
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    update((d) => createCollection(d, id, name, now()));
    return id;
  },
  renameCollection: (id: string, name: string) => update((d) => renameCollection(d, id, name, now())),
  removeCollection: (id: string) => update((d) => removeCollection(d, id, now())),
  setBookmarkCollection: (surah: number, verse: number, collectionId: string | null) =>
    update((d) => setBookmarkCollection(d, surah, verse, collectionId, now())),
  /** Record an explicit choice so it follows the account (the cookie is written by the caller). */
  chooseSelection: (selection: Partial<Selection>) => update((d) => setSelectionChoice(d, selection, now())),
  chooseLocale: (locale: Locale) => update((d) => setLocaleChoice(d, locale, now())),
  chooseLayout: (layout: Layout) => update((d) => setLayoutChoice(d, layout, now())),
  choosePaging: (paging: Paging) => update((d) => setPagingChoice(d, paging, now())),
  chooseTheme: (theme: Theme) => update((d) => setThemeChoice(d, theme, now())),
  chooseFontSize: (size: FontSize) => update((d) => setFontSizeChoice(d, size, now())),
  chooseArabicFont: (font: ArabicFont) => update((d) => setArabicFontChoice(d, font, now())),
  choosePlaybackMode: (mode: PlaybackMode) => update((d) => setPlaybackModeChoice(d, mode, now())),
  /** The current data, for export. */
  current: (): UserData => parseOrEmpty(readRaw()),
};

const OWNER_KEY = "quranweb:sync-owner";
let memoryOwner: string | null = null;

/** What the sync engine needs: this browser's copy, and which account it was last synchronised with. */
export const userDataSync = {
  load: (): UserData => parseOrEmpty(readRaw()),
  /** Replace the stored copy (no-op when equal) and tell every component and tab. */
  save: (data: UserData): void => {
    const raw = JSON.stringify(data);
    if (raw !== readRaw()) writeRaw(raw);
  },
  raw: readRaw,
  subscribe,
  getOwner: (): string | null => {
    try {
      return localStorage.getItem(OWNER_KEY) ?? memoryOwner;
    } catch {
      return memoryOwner;
    }
  },
  /** Forget which account this browser's data belongs to (after the account was deleted), so it counts as data from before any sign-in. */
  clearOwner: (): void => {
    memoryOwner = null;
    try {
      localStorage.removeItem(OWNER_KEY);
    } catch {
      /* memory only */
    }
  },
  setOwner: (userId: string): void => {
    memoryOwner = userId;
    try {
      localStorage.setItem(OWNER_KEY, userId);
    } catch {
      /* keep it in memory */
    }
  },
};

/** The current user data; empty on the server and before hydration is done. */
export function useUserData(): UserData {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  return useMemo(() => parseOrEmpty(raw), [raw]);
}

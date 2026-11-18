"use client";

// User data storage in localStorage, read through useSyncExternalStore: every component
// sees the same data, other tabs are updated through the `storage` event, and no state
// is set inside an effect. When localStorage cannot be used (private mode, blocked),
// the data keeps working in memory while the page is open.

import { useMemo, useSyncExternalStore } from "react";
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

function update(fn: (data: UserData) => UserData): void {
  // Tombstones that every device has had time to see are dropped on each write.
  const next = pruneTombstones(fn(parseOrEmpty(readRaw())), now());
  writeRaw(JSON.stringify(next));
}

/** The actions are stable and always work on the latest data. */
export const userDataActions = {
  setLastRead: (surah: number, verse: number) => update((d) => setLastRead(d, surah, verse, now())),
  toggleReadUpTo: (surah: number, verse: number) => update((d) => toggleReadUpTo(d, surah, verse, now())),
  clearProgress: (surah: number) => update((d) => clearProgress(d, surah, now())),
  toggleBookmark: (surah: number, verse: number) => update((d) => toggleBookmark(d, surah, verse, now())),
  removeBookmark: (surah: number, verse: number) => update((d) => removeBookmark(d, surah, verse, now())),
  setBookmarkNote: (surah: number, verse: number, note: string) => update((d) => setBookmarkNote(d, surah, verse, note, now())),
  /** Merge a backup into the current data. Throws a UserDataError if the file is not valid. */
  importMerge: (text: string) => update((d) => mergeUserData(d, importUserData(text))),
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

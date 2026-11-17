"use client";

// Penyimpanan data pengguna di localStorage, dibaca lewat useSyncExternalStore:
// semua komponen melihat data yang sama, tab lain ikut diperbarui lewat event
// `storage`, dan tidak ada state yang disetel di dalam effect. Kalau localStorage
// tidak bisa dipakai (mode privat, diblokir), data tetap berjalan di memori selama
// halaman terbuka.

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
    /* tetap di memori */
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
    return emptyUserData(); // data rusak tidak boleh membuat halaman gagal
  }
}

function update(fn: (data: UserData) => UserData): void {
  const next = fn(parseOrEmpty(readRaw()));
  writeRaw(JSON.stringify(next));
}

const now = () => new Date().toISOString();

/** Aksi bersifat stabil dan selalu bekerja di atas data terbaru. */
export const userDataActions = {
  setLastRead: (surah: number, ayat: number) => update((d) => setLastRead(d, surah, ayat, now())),
  toggleReadUpTo: (surah: number, ayat: number) => update((d) => toggleReadUpTo(d, surah, ayat, now())),
  clearProgress: (surah: number) => update((d) => clearProgress(d, surah)),
  toggleBookmark: (surah: number, ayat: number) => update((d) => toggleBookmark(d, surah, ayat, now())),
  removeBookmark: (surah: number, ayat: number) => update((d) => removeBookmark(d, surah, ayat)),
  setBookmarkNote: (surah: number, ayat: number, note: string) => update((d) => setBookmarkNote(d, surah, ayat, note)),
  /** Gabungkan cadangan ke data sekarang. Melempar galat bila berkasnya tidak valid. */
  importMerge: (text: string) => update((d) => mergeUserData(d, importUserData(text))),
  /** Data mentah saat ini, untuk ekspor. */
  current: (): UserData => parseOrEmpty(readRaw()),
};

/** Data pengguna saat ini; kosong di server dan sebelum hidrasi selesai. */
export function useUserData(): UserData {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  return useMemo(() => parseOrEmpty(raw), [raw]);
}

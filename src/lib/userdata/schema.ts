// User data kept in the browser (localStorage): last read position, per-surah progress
// and bookmarks. Everything here is a pure function so it is easy to test; the storage
// itself is in store.ts.
//
// Version 2 is built to be synchronised between devices (roadmap phase 3). Every item
// carries the time of its last change, and a removed item stays as a "tombstone"
// (`deletedAt`) for 90 days so that every device learns of the removal. The merge rule is
// per item, newest change wins, and it is commutative, associative and idempotent: merging
// any copies in any order gives the same result.

import { isLocale, type Locale } from "../i18n/config";
import type { Selection } from "../quran/types";
import { parseSelectionObject } from "../selection";
import { isLayout, type Layout } from "../layout";

export const USER_DATA_VERSION = 2;

const MAX_SURAH = 114;
const MAX_VERSE = 286; // the longest surah, Al-Baqarah
const MAX_NOTE = 500;
const MAX_LIVE_BOOKMARKS = 5000;
const MAX_ENTRIES = 10_000; // live items and tombstones together
const TOMBSTONE_DAYS = 90;
const MAX_COLLECTIONS = 50;
const MAX_COLLECTION_NAME = 40;
const COLLECTION_ID = /^[a-z0-9]{8,32}$/;
export const TOTAL_VERSES = 6236;
export const MAX_DAILY_GOAL = 1000;
const ACTIVITY_DAYS = 120; // days of daily counts kept (enough for streaks and a monthly view)
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DEVICE_ID = /^[a-z0-9]{8,32}$/;

export interface Bookmark {
  surah: number;
  verse: number;
  note: string;
  createdAt: string;
  /** When this bookmark last changed (created, noted, removed or added again). */
  updatedAt: string;
  /** Set when the bookmark was removed; the entry stays as a tombstone. */
  deletedAt?: string;
  /** The collection it belongs to (at most one). Missing, or a removed collection, means "no collection". */
  collectionId?: string;
}

/** A named group of bookmarks (for example "Prayers" or "To memorise"). */
export interface Collection {
  id: string;
  name: string;
  createdAt: string;
  /** When it was created, renamed or removed. */
  updatedAt: string;
  /** Set when the collection was removed; its bookmarks stay and lose the collection. */
  deletedAt?: string;
}

export interface ProgressEntry {
  /** Verses 1 to readUpTo are marked as read. */
  readUpTo: number;
  /** When this entry last changed. */
  at: string;
  /** Set when the progress was cleared; the entry stays as a tombstone. */
  deletedAt?: string;
}

/**
 * The reader's choices that follow the account: editions and reciter (the `qw-sel` cookie) and the interface
 * language (`qw-lang`). Each has the time it was last chosen, so the newest choice wins on every device. Only an
 * explicit choice is recorded; a cookie that was never changed here has no time and is not synced.
 */
export interface Choices {
  selection?: { value: Partial<Selection>; at: string };
  locale?: { value: Locale; at: string };
  /** Mushaf or verse-by-verse cards (the `qw-layout` cookie). */
  layout?: { value: Layout; at: string };
}

/** The daily reading goal in verses (0 = off), with the time it was set; the newest setting wins. */
export interface Goal {
  versesPerDay: number;
  at: string;
}

/**
 * Verses marked as read per local day and per device: `{ "2026-11-18": { "<device id>": 12 } }`. Each device only
 * ever raises its own count, so copies merge by taking the larger count per device and day, and a day's total is the
 * sum over devices: reading on two devices adds up, and syncing twice never counts twice.
 */
export type Activity = Record<string, Record<string, number>>;

export interface UserData {
  version: typeof USER_DATA_VERSION;
  /** `at` is when the reading position last changed. */
  lastRead: { surah: number; verse: number; at: string } | null;
  /** By surah number. Includes tombstones; use liveProgress() to show it. */
  progress: Record<string, ProgressEntry>;
  /** Includes tombstones; use liveBookmarks() to show them. */
  bookmarks: Bookmark[];
  /** Choices that follow the account (added in 2026-11; older copies have none). */
  choices: Choices;
  /** Bookmark collections, including tombstones; use liveCollections() to show them. */
  collections: Collection[];
  goal: Goal | null;
  activity: Activity;
}

/** Why user data was rejected; the UI turns the code into a message in the reader's language. */
export type UserDataErrorCode = "not-json" | "not-backup" | "unsupported-version" | "invalid";

export class UserDataError extends Error {
  constructor(
    public readonly code: UserDataErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "UserDataError";
  }
}

export function emptyUserData(): UserData {
  return { version: USER_DATA_VERSION, lastRead: null, progress: {}, bookmarks: [], choices: {}, collections: [], goal: null, activity: {} };
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

const isDate = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));

const invalid = (message: string) => new UserDataError("invalid", message);

function assertPosition(surah: number, verse: number): void {
  if (!isInt(surah, 1, MAX_SURAH) || !isInt(verse, 1, MAX_VERSE)) {
    throw new Error(`Invalid position: ${surah}:${verse}`);
  }
}

/** Bookmarks in a fixed order, so equal data is always equal as a value. */
const sortBookmarks = (list: Bookmark[]): Bookmark[] =>
  [...list].sort((a, b) => a.surah - b.surah || a.verse - b.verse);

// ------------------------------------------------------------------ reading

export const liveBookmarks = (data: UserData): Bookmark[] => data.bookmarks.filter((b) => !b.deletedAt);

export const findBookmark = (data: UserData, surah: number, verse: number): Bookmark | undefined =>
  data.bookmarks.find((b) => b.surah === surah && b.verse === verse && !b.deletedAt);

/** Days and devices in a fixed order, so equal data is always equal as a value. */
const sortActivity = (activity: Activity): Activity =>
  Object.fromEntries(
    Object.keys(activity)
      .sort()
      .map((day) => [day, Object.fromEntries(Object.keys(activity[day]).sort().map((dev) => [dev, activity[day][dev]]))]),
  );

const sortCollections = (list: Collection[]): Collection[] => [...list].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/** Collections that are not removed, in the order they were created. */
export const liveCollections = (data: UserData): Collection[] =>
  data.collections.filter((c) => !c.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));

/** The live collection of a bookmark, or null (none, or its collection was removed). */
export function collectionOf(data: UserData, bookmark: Bookmark): string | null {
  if (!bookmark.collectionId) return null;
  return data.collections.some((c) => c.id === bookmark.collectionId && !c.deletedAt) ? bookmark.collectionId : null;
}

const cleanName = (name: string) => name.replace(/\s+/g, " ").trim().slice(0, MAX_COLLECTION_NAME);

/** Verses marked as read on a day (all devices together). */
export const versesReadOn = (data: UserData, day: string): number =>
  Object.values(data.activity[day] ?? {}).reduce((sum, n) => sum + n, 0);

/** The local calendar day of a date, as YYYY-MM-DD. */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const previousDay = (day: string): string => {
  const [y, m, d] = day.split("-").map(Number);
  return localDay(new Date(y, m - 1, d - 1));
};

/**
 * Days in a row on which the goal was reached, ending today, or yesterday when today is not reached yet (the streak
 * is still alive until the day is over).
 */
export function goalStreak(data: UserData, today: string): number {
  const goal = data.goal?.versesPerDay ?? 0;
  if (goal <= 0) return 0;
  let day = versesReadOn(data, today) >= goal ? today : previousDay(today);
  let streak = 0;
  while (versesReadOn(data, day) >= goal && streak < ACTIVITY_DAYS) {
    streak += 1;
    day = previousDay(day);
  }
  return streak;
}

/** Verses marked as read across the whole Quran, towards a khatam. */
export const versesReadInTotal = (data: UserData): number =>
  Math.min(TOTAL_VERSES, liveProgress(data).reduce((sum, p) => sum + p.readUpTo, 0));

/** The progress that is not cleared, by surah number. */
export function liveProgress(data: UserData): { surah: number; readUpTo: number; at: string }[] {
  return Object.entries(data.progress)
    .filter(([, p]) => !p.deletedAt)
    .map(([key, p]) => ({ surah: Number(key), readUpTo: p.readUpTo, at: p.at }))
    .sort((a, b) => a.surah - b.surah);
}

/** The last verse marked as read in a surah, or 0. */
export const progressOf = (data: UserData, surah: number): number => {
  const entry = data.progress[surah];
  return entry && !entry.deletedAt ? entry.readUpTo : 0;
};

// ------------------------------------------------------------------ changes

export function setLastRead(data: UserData, surah: number, verse: number, at: string): UserData {
  assertPosition(surah, verse);
  if (data.lastRead?.surah === surah && data.lastRead.verse === verse) return data;
  return { ...data, lastRead: { surah, verse, at } };
}

/** Mark verses 1 to `verse` as read. Marking the same verse again undoes it. */
export function toggleReadUpTo(data: UserData, surah: number, verse: number, at: string): UserData {
  assertPosition(surah, verse);
  if (progressOf(data, surah) === verse) return clearProgress(data, surah, at);
  return { ...data, progress: { ...data.progress, [surah]: { readUpTo: verse, at } } };
}

export function clearProgress(data: UserData, surah: number, at: string): UserData {
  const entry = data.progress[surah];
  if (!entry || entry.deletedAt) return data;
  return { ...data, progress: { ...data.progress, [surah]: { ...entry, at, deletedAt: at } } };
}

/** Add a bookmark, or remove it when it already exists. */
export function toggleBookmark(data: UserData, surah: number, verse: number, at: string): UserData {
  assertPosition(surah, verse);
  if (findBookmark(data, surah, verse)) return removeBookmark(data, surah, verse, at);
  if (liveBookmarks(data).length >= MAX_LIVE_BOOKMARKS) throw new Error(`At most ${MAX_LIVE_BOOKMARKS} bookmarks are allowed`);
  // A bookmark that was removed and is added again starts fresh (and beats the tombstone).
  const rest = data.bookmarks.filter((b) => !(b.surah === surah && b.verse === verse));
  return { ...data, bookmarks: sortBookmarks([...rest, { surah, verse, note: "", createdAt: at, updatedAt: at }]) };
}

export function removeBookmark(data: UserData, surah: number, verse: number, at: string): UserData {
  if (!findBookmark(data, surah, verse)) return data;
  return {
    ...data,
    bookmarks: data.bookmarks.map((b) => (b.surah === surah && b.verse === verse ? { ...b, updatedAt: at, deletedAt: at } : b)),
  };
}

export function setBookmarkNote(data: UserData, surah: number, verse: number, note: string, at: string): UserData {
  const current = findBookmark(data, surah, verse);
  const clean = note.trim().slice(0, MAX_NOTE);
  if (!current || current.note === clean) return data;
  return {
    ...data,
    bookmarks: data.bookmarks.map((b) => (b === current ? { ...b, note: clean, updatedAt: at } : b)),
  };
}

/** Put a bookmark in a collection, or take it out (null). */
export function setBookmarkCollection(data: UserData, surah: number, verse: number, collectionId: string | null, at: string): UserData {
  const current = findBookmark(data, surah, verse);
  if (!current) return data;
  if (collectionId !== null && !liveCollections(data).some((c) => c.id === collectionId)) throw new Error("Unknown collection");
  if ((collectionOf(data, current) ?? null) === collectionId) return data;
  return {
    ...data,
    bookmarks: data.bookmarks.map((b) => {
      if (b !== current) return b;
      const { collectionId: _old, ...rest } = b;
      void _old;
      return collectionId === null ? { ...rest, updatedAt: at } : { ...rest, collectionId, updatedAt: at };
    }),
  };
}

export function createCollection(data: UserData, id: string, name: string, at: string): UserData {
  const clean = cleanName(name);
  if (!COLLECTION_ID.test(id)) throw new Error("Invalid collection id");
  if (!clean) throw new Error("A collection needs a name");
  if (data.collections.some((c) => c.id === id)) throw new Error("Collection id already used");
  if (liveCollections(data).length >= MAX_COLLECTIONS) throw new Error(`At most ${MAX_COLLECTIONS} collections are allowed`);
  return { ...data, collections: sortCollections([...data.collections, { id, name: clean, createdAt: at, updatedAt: at }]) };
}

export function renameCollection(data: UserData, id: string, name: string, at: string): UserData {
  const clean = cleanName(name);
  const current = data.collections.find((c) => c.id === id && !c.deletedAt);
  if (!current || !clean || current.name === clean) return data;
  return { ...data, collections: data.collections.map((c) => (c === current ? { ...c, name: clean, updatedAt: at } : c)) };
}

/** Remove a collection. Its bookmarks stay; they show as having no collection. */
export function removeCollection(data: UserData, id: string, at: string): UserData {
  const current = data.collections.find((c) => c.id === id && !c.deletedAt);
  if (!current) return data;
  return { ...data, collections: data.collections.map((c) => (c === current ? { ...c, updatedAt: at, deletedAt: at } : c)) };
}

/** Set the daily goal in verses (0 turns it off). */
export function setDailyGoal(data: UserData, versesPerDay: number, at: string): UserData {
  if (!isInt(versesPerDay, 0, MAX_DAILY_GOAL)) throw new Error(`The goal must be 0 to ${MAX_DAILY_GOAL} verses`);
  return { ...data, goal: { versesPerDay, at } };
}

/** Count verses this device marked as read on a day (only ever adds). */
export function recordVersesRead(data: UserData, deviceId: string, day: string, verses: number): UserData {
  if (!DEVICE_ID.test(deviceId) || !DAY.test(day) || !isInt(verses, 0, TOTAL_VERSES) || verses === 0) return data;
  const forDay = data.activity[day] ?? {};
  const count = Math.min(TOTAL_VERSES, (forDay[deviceId] ?? 0) + verses);
  return { ...data, activity: { ...data.activity, [day]: { ...forDay, [deviceId]: count } } };
}

/** Record an explicit choice of editions and reciter. */
export function setSelectionChoice(data: UserData, value: Partial<Selection>, at: string): UserData {
  return { ...data, choices: { ...data.choices, selection: { value: parseSelectionObject(value), at } } };
}

/** Record an explicit choice of layout. */
export function setLayoutChoice(data: UserData, value: Layout, at: string): UserData {
  if (!isLayout(value)) throw new Error(`Invalid layout: ${String(value)}`);
  return { ...data, choices: { ...data.choices, layout: { value, at } } };
}

/** Record an explicit choice of interface language. */
export function setLocaleChoice(data: UserData, value: Locale, at: string): UserData {
  if (!isLocale(value)) throw new Error(`Invalid locale: ${String(value)}`);
  return { ...data, choices: { ...data.choices, locale: { value, at } } };
}

/** Drop the tombstones older than 90 days; they have been around long enough for every device to see them. */
export function pruneTombstones(data: UserData, now: string): UserData {
  const limit = Date.parse(now) - TOMBSTONE_DAYS * 24 * 60 * 60 * 1000;
  const old = (deletedAt?: string) => deletedAt !== undefined && Date.parse(deletedAt) < limit;
  const bookmarks = data.bookmarks.filter((b) => !old(b.deletedAt));
  const keys = Object.keys(data.progress).filter((k) => !old(data.progress[k].deletedAt));
  const collections = data.collections.filter((c) => !old(c.deletedAt));
  const firstDay = localDay(new Date(Date.parse(now) - ACTIVITY_DAYS * 24 * 60 * 60 * 1000));
  const days = Object.keys(data.activity).filter((d) => d >= firstDay);
  if (
    bookmarks.length === data.bookmarks.length &&
    keys.length === Object.keys(data.progress).length &&
    collections.length === data.collections.length &&
    days.length === Object.keys(data.activity).length
  ) {
    return data;
  }
  return {
    ...data,
    bookmarks,
    collections,
    progress: Object.fromEntries(keys.map((k) => [k, data.progress[k]])),
    activity: Object.fromEntries(days.map((d) => [d, data.activity[d]])),
  };
}

// ------------------------------------------------------------------ merging

/**
 * Of two versions of the same item, the one that changed later. At the same instant a
 * removal wins, and after that the order of the serialised values decides, so the choice
 * never depends on which copy came first.
 */
function newer<T extends object>(a: T, b: T, time: (x: T) => string): T {
  const ta = Date.parse(time(a));
  const tb = Date.parse(time(b));
  if (ta !== tb) return ta > tb ? a : b;
  const removed = (x: T) => "deletedAt" in x && !!(x as { deletedAt?: string }).deletedAt;
  if (removed(a) !== removed(b)) return removed(a) ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

/** Merge two copies of the user data; the result does not depend on their order. */
export function mergeUserData(a: UserData, b: UserData): UserData {
  const lastRead =
    a.lastRead && b.lastRead ? newer(a.lastRead, b.lastRead, (x) => x.at) : (a.lastRead ?? b.lastRead);

  const progress: UserData["progress"] = { ...a.progress };
  for (const [key, entry] of Object.entries(b.progress)) {
    progress[key] = key in progress ? newer(progress[key], entry, (x) => x.at) : entry;
  }

  const byKey = new Map<string, Bookmark>();
  for (const bookmark of [...a.bookmarks, ...b.bookmarks]) {
    const key = `${bookmark.surah}:${bookmark.verse}`;
    const known = byKey.get(key);
    byKey.set(key, known ? newer(known, bookmark, (x) => x.updatedAt) : bookmark);
  }
  const choices: Choices = {};
  for (const key of ["selection", "locale", "layout"] as const) {
    const x = a.choices?.[key];
    const y = b.choices?.[key];
    const pick = x && y ? newer(x, y, (c) => c.at) : (x ?? y);
    if (pick) (choices as Record<string, unknown>)[key] = pick;
  }
  const byId = new Map<string, Collection>();
  for (const collection of [...(a.collections ?? []), ...(b.collections ?? [])]) {
    const known = byId.get(collection.id);
    byId.set(collection.id, known ? newer(known, collection, (x) => x.updatedAt) : collection);
  }
  const goal = a.goal && b.goal ? newer(a.goal, b.goal, (g) => g.at) : (a.goal ?? b.goal ?? null);
  const activity: Activity = {};
  for (const source of [a.activity ?? {}, b.activity ?? {}]) {
    for (const [day, devices] of Object.entries(source)) {
      const target = (activity[day] ??= {});
      for (const [device, count] of Object.entries(devices)) target[device] = Math.max(target[device] ?? 0, count);
    }
  }
  return {
    version: USER_DATA_VERSION,
    lastRead,
    progress,
    bookmarks: sortBookmarks([...byKey.values()]),
    choices,
    collections: sortCollections([...byId.values()]),
    goal,
    activity: sortActivity(activity),
  };
}

// ------------------------------------------------------------------ parsing

function parseDeletedAt(item: Record<string, unknown>, what: string): string | undefined {
  if (item.deletedAt === undefined) return undefined;
  if (!isDate(item.deletedAt)) throw invalid(`${what} has an invalid removal date`);
  return item.deletedAt;
}

/**
 * Check and clean raw data (from localStorage or an import file) of version 1 or 2 and
 * return it as version 2. Throws a UserDataError if it is broken.
 */
export function parseUserData(raw: unknown): UserData {
  if (typeof raw !== "object" || raw === null) throw invalid("User data is not an object");
  const r = raw as Record<string, unknown>;
  const version = r.version;
  if (version !== 1 && version !== USER_DATA_VERSION) {
    throw new UserDataError("unsupported-version", `Unsupported data version: ${String(version)}`);
  }

  let lastRead: UserData["lastRead"] = null;
  if (r.lastRead != null) {
    const l = r.lastRead as Record<string, unknown>;
    if (!isInt(l.surah, 1, MAX_SURAH) || !isInt(l.verse, 1, MAX_VERSE) || !isDate(l.at)) {
      throw invalid("Invalid last read position");
    }
    lastRead = { surah: l.surah, verse: l.verse, at: l.at };
  }

  const progress: UserData["progress"] = {};
  for (const [key, value] of Object.entries((r.progress ?? {}) as Record<string, unknown>)) {
    const v = value as Record<string, unknown>;
    if (!isInt(Number(key), 1, MAX_SURAH) || !isInt(v?.readUpTo, 1, MAX_VERSE) || !isDate(v.at)) {
      throw invalid(`Invalid progress for surah ${key}`);
    }
    const entry: ProgressEntry = { readUpTo: v.readUpTo, at: v.at };
    const deletedAt = version === 1 ? undefined : parseDeletedAt(v, `Progress for surah ${key}`);
    if (deletedAt) entry.deletedAt = deletedAt;
    progress[String(Number(key))] = entry;
  }

  if (!Array.isArray(r.bookmarks ?? [])) throw invalid("Bookmarks are not a list");
  const byKey = new Map<string, Bookmark>();
  for (const item of (r.bookmarks ?? []) as unknown[]) {
    const b = item as Record<string, unknown>;
    if (!isInt(b?.surah, 1, MAX_SURAH) || !isInt(b.verse, 1, MAX_VERSE) || !isDate(b.createdAt)) {
      throw invalid("A bookmark is invalid");
    }
    // Version 1 had no change time: the bookmark was last changed when it was created.
    if (version === USER_DATA_VERSION && !isDate(b.updatedAt)) throw invalid("A bookmark has no valid change date");
    const bookmark: Bookmark = {
      surah: b.surah,
      verse: b.verse,
      note: typeof b.note === "string" ? b.note.trim().slice(0, MAX_NOTE) : "",
      createdAt: b.createdAt,
      updatedAt: version === USER_DATA_VERSION ? (b.updatedAt as string) : b.createdAt,
    };
    const deletedAt = version === 1 ? undefined : parseDeletedAt(b, "A bookmark");
    if (deletedAt) bookmark.deletedAt = deletedAt;
    if (b.collectionId !== undefined) {
      if (typeof b.collectionId !== "string" || !COLLECTION_ID.test(b.collectionId)) throw invalid("A bookmark has an invalid collection");
      bookmark.collectionId = b.collectionId;
    }
    const key = `${b.surah}:${b.verse}`;
    const known = byKey.get(key);
    byKey.set(key, known ? newer(known, bookmark, (x) => x.updatedAt) : bookmark);
  }
  const bookmarks = sortBookmarks([...byKey.values()]);
  if (bookmarks.filter((b) => !b.deletedAt).length > MAX_LIVE_BOOKMARKS) throw invalid(`At most ${MAX_LIVE_BOOKMARKS} bookmarks are allowed`);
  if (bookmarks.length + Object.keys(progress).length > MAX_ENTRIES) throw invalid("Too many entries");

  const choices: Choices = {};
  const c = (r.choices ?? {}) as Record<string, unknown>;
  if (typeof c !== "object" || c === null) throw invalid("Choices are not an object");
  if (c.selection != null) {
    const sel = c.selection as Record<string, unknown>;
    if (!isDate(sel.at) || typeof sel.value !== "object" || sel.value === null) throw invalid("Invalid edition choice");
    choices.selection = { value: parseSelectionObject(sel.value), at: sel.at };
  }
  if (c.locale != null) {
    const loc = c.locale as Record<string, unknown>;
    if (!isDate(loc.at) || !isLocale(loc.value)) throw invalid("Invalid language choice");
    choices.locale = { value: loc.value, at: loc.at };
  }
  if (c.layout != null) {
    const lay = c.layout as Record<string, unknown>;
    if (!isDate(lay.at) || !isLayout(lay.value)) throw invalid("Invalid layout choice");
    choices.layout = { value: lay.value, at: lay.at };
  }

  if (!Array.isArray(r.collections ?? [])) throw invalid("Collections are not a list");
  const collById = new Map<string, Collection>();
  for (const item of (r.collections ?? []) as unknown[]) {
    const c = item as Record<string, unknown>;
    const name = typeof c?.name === "string" ? cleanName(c.name) : "";
    if (typeof c?.id !== "string" || !COLLECTION_ID.test(c.id) || !name || !isDate(c.createdAt) || !isDate(c.updatedAt)) {
      throw invalid("A collection is invalid");
    }
    const collection: Collection = { id: c.id, name, createdAt: c.createdAt, updatedAt: c.updatedAt };
    const deletedAt = parseDeletedAt(c, "A collection");
    if (deletedAt) collection.deletedAt = deletedAt;
    const known = collById.get(c.id);
    collById.set(c.id, known ? newer(known, collection, (x) => x.updatedAt) : collection);
  }
  const collections = sortCollections([...collById.values()]);
  if (collections.filter((c) => !c.deletedAt).length > MAX_COLLECTIONS) throw invalid(`At most ${MAX_COLLECTIONS} collections are allowed`);

  let goal: Goal | null = null;
  if (r.goal != null) {
    const g = r.goal as Record<string, unknown>;
    if (!isInt(g.versesPerDay, 0, MAX_DAILY_GOAL) || !isDate(g.at)) throw invalid("Invalid daily goal");
    goal = { versesPerDay: g.versesPerDay, at: g.at };
  }
  const activity: Activity = {};
  const rawActivity = (r.activity ?? {}) as Record<string, unknown>;
  if (typeof rawActivity !== "object" || rawActivity === null || Array.isArray(rawActivity)) throw invalid("Invalid reading activity");
  const dayKeys = Object.keys(rawActivity);
  if (dayKeys.length > 400) throw invalid("Too many days of reading activity");
  for (const day of dayKeys) {
    const devices = rawActivity[day] as Record<string, unknown>;
    if (!DAY.test(day) || typeof devices !== "object" || devices === null || Object.keys(devices).length > 20) {
      throw invalid("Invalid reading activity");
    }
    activity[day] = {};
    for (const [device, count] of Object.entries(devices)) {
      if (!DEVICE_ID.test(device) || !isInt(count, 0, TOTAL_VERSES)) throw invalid("Invalid reading activity");
      activity[day][device] = count;
    }
  }

  return { version: USER_DATA_VERSION, lastRead, progress, bookmarks, choices, collections, goal, activity: sortActivity(activity) };
}

// ------------------------------------------------------------ export, import

const EXPORT_APP = "quranweb";
const EXPORT_FORMAT = 1; // the envelope; the data inside says its own version

export function exportUserData(data: UserData, now: string): string {
  return JSON.stringify({ app: EXPORT_APP, format: EXPORT_FORMAT, exportedAt: now, data }, null, 2);
}

/** Read a backup file; it may hold version 1 or 2 data, and the result is version 2. */
export function importUserData(text: string): UserData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new UserDataError("not-json", "The file is not valid JSON");
  }
  const p = parsed as Record<string, unknown> | null;
  if (!p || p.app !== EXPORT_APP || p.format !== EXPORT_FORMAT) {
    throw new UserDataError("not-backup", "The file is not a QuranWeb backup");
  }
  return parseUserData(p.data);
}

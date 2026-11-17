// User data kept in the browser (localStorage): last read position, per-surah
// progress and bookmarks. Everything here is a pure function so it is easy to test;
// the storage itself is in store.ts. The schema is versioned so it can be moved to
// accounts later (roadmap phase 3).

export const USER_DATA_VERSION = 1;

const MAX_SURAH = 114;
const MAX_VERSE = 286; // the longest surah, Al-Baqarah
const MAX_NOTE = 500;
const MAX_BOOKMARKS = 5000;

export interface Bookmark {
  surah: number;
  verse: number;
  note: string;
  createdAt: string;
}

export interface UserData {
  version: typeof USER_DATA_VERSION;
  lastRead: { surah: number; verse: number; at: string } | null;
  /** By surah number: the last verse marked as read (verses 1 to readUpTo). */
  progress: Record<string, { readUpTo: number; at: string }>;
  bookmarks: Bookmark[];
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
  return { version: USER_DATA_VERSION, lastRead: null, progress: {}, bookmarks: [] };
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

export function setLastRead(data: UserData, surah: number, verse: number, at: string): UserData {
  assertPosition(surah, verse);
  if (data.lastRead?.surah === surah && data.lastRead.verse === verse) return data;
  return { ...data, lastRead: { surah, verse, at } };
}

/** Mark verses 1 to `verse` as read. Marking the same verse again undoes it. */
export function toggleReadUpTo(data: UserData, surah: number, verse: number, at: string): UserData {
  assertPosition(surah, verse);
  const progress = { ...data.progress };
  if (progress[surah]?.readUpTo === verse) delete progress[surah];
  else progress[surah] = { readUpTo: verse, at };
  return { ...data, progress };
}

export function clearProgress(data: UserData, surah: number): UserData {
  if (!data.progress[surah]) return data;
  const progress = { ...data.progress };
  delete progress[surah];
  return { ...data, progress };
}

export const findBookmark = (data: UserData, surah: number, verse: number): Bookmark | undefined =>
  data.bookmarks.find((b) => b.surah === surah && b.verse === verse);

/** Add a bookmark, or remove it when it already exists. */
export function toggleBookmark(data: UserData, surah: number, verse: number, at: string): UserData {
  assertPosition(surah, verse);
  if (findBookmark(data, surah, verse)) return removeBookmark(data, surah, verse);
  if (data.bookmarks.length >= MAX_BOOKMARKS) throw new Error(`At most ${MAX_BOOKMARKS} bookmarks are allowed`);
  return { ...data, bookmarks: [...data.bookmarks, { surah, verse, note: "", createdAt: at }] };
}

export function removeBookmark(data: UserData, surah: number, verse: number): UserData {
  return { ...data, bookmarks: data.bookmarks.filter((b) => !(b.surah === surah && b.verse === verse)) };
}

export function setBookmarkNote(data: UserData, surah: number, verse: number, note: string): UserData {
  if (!findBookmark(data, surah, verse)) return data;
  const clean = note.trim().slice(0, MAX_NOTE);
  return {
    ...data,
    bookmarks: data.bookmarks.map((b) => (b.surah === surah && b.verse === verse ? { ...b, note: clean } : b)),
  };
}

/** Check and clean raw data (from localStorage or an import file). Throws a UserDataError if it is broken. */
export function parseUserData(raw: unknown): UserData {
  if (typeof raw !== "object" || raw === null) throw invalid("User data is not an object");
  const r = raw as Record<string, unknown>;
  if (r.version !== USER_DATA_VERSION) {
    throw new UserDataError("unsupported-version", `Unsupported data version: ${String(r.version)}`);
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
    progress[String(Number(key))] = { readUpTo: v.readUpTo, at: v.at };
  }

  if (!Array.isArray(r.bookmarks ?? [])) throw invalid("Bookmarks are not a list");
  const seen = new Set<string>();
  const bookmarks: Bookmark[] = [];
  for (const item of (r.bookmarks ?? []) as unknown[]) {
    const b = item as Record<string, unknown>;
    if (!isInt(b?.surah, 1, MAX_SURAH) || !isInt(b.verse, 1, MAX_VERSE) || !isDate(b.createdAt)) {
      throw invalid("A bookmark is invalid");
    }
    const key = `${b.surah}:${b.verse}`;
    if (seen.has(key)) continue;
    seen.add(key);
    bookmarks.push({
      surah: b.surah,
      verse: b.verse,
      note: typeof b.note === "string" ? b.note.trim().slice(0, MAX_NOTE) : "",
      createdAt: b.createdAt,
    });
  }
  if (bookmarks.length > MAX_BOOKMARKS) throw invalid(`At most ${MAX_BOOKMARKS} bookmarks are allowed`);

  return { version: USER_DATA_VERSION, lastRead, progress, bookmarks };
}

const EXPORT_APP = "quranweb";
const EXPORT_FORMAT = 1;

export function exportUserData(data: UserData, now: string): string {
  return JSON.stringify({ app: EXPORT_APP, format: EXPORT_FORMAT, exportedAt: now, data }, null, 2);
}

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

/** Merge imported data into the current data without removing anything. */
export function mergeUserData(current: UserData, incoming: UserData): UserData {
  const lastRead =
    !current.lastRead || (incoming.lastRead && incoming.lastRead.at > current.lastRead.at)
      ? incoming.lastRead
      : current.lastRead;

  const progress = { ...current.progress };
  for (const [key, inc] of Object.entries(incoming.progress)) {
    const cur = progress[key];
    if (!cur || inc.readUpTo > cur.readUpTo) progress[key] = inc;
  }

  const byKey = new Map(current.bookmarks.map((b) => [`${b.surah}:${b.verse}`, b]));
  for (const inc of incoming.bookmarks) {
    const key = `${inc.surah}:${inc.verse}`;
    const cur = byKey.get(key);
    byKey.set(
      key,
      cur
        ? { ...cur, note: inc.note || cur.note, createdAt: cur.createdAt < inc.createdAt ? cur.createdAt : inc.createdAt }
        : inc,
    );
  }
  return { version: USER_DATA_VERSION, lastRead, progress, bookmarks: [...byKey.values()] };
}

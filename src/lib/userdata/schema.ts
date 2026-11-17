// Data pengguna yang disimpan di browser (localStorage): terakhir dibaca, progres
// per surat, dan bookmark. Semua fungsi di sini murni (tanpa efek samping) supaya
// mudah diuji; penyimpanannya ada di store.ts. Skema bernomor versi supaya nanti
// mudah dipindahkan ke akun (Fase 3).

export const USER_DATA_VERSION = 1;

const MAX_SURAH = 114;
const MAX_AYAT = 286; // ayat terpanjang: Al-Baqarah
const MAX_NOTE = 500;
const MAX_BOOKMARKS = 5000;

export interface Bookmark {
  surah: number;
  ayat: number;
  note: string;
  createdAt: string;
}

export interface UserData {
  version: typeof USER_DATA_VERSION;
  lastRead: { surah: number; ayat: number; at: string } | null;
  /** Per nomor surat: ayat terakhir yang ditandai selesai dibaca (ayat 1 sampai readUpTo). */
  progress: Record<string, { readUpTo: number; at: string }>;
  bookmarks: Bookmark[];
}

export function emptyUserData(): UserData {
  return { version: USER_DATA_VERSION, lastRead: null, progress: {}, bookmarks: [] };
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

const isDate = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));

function assertPosition(surah: number, ayat: number): void {
  if (!isInt(surah, 1, MAX_SURAH) || !isInt(ayat, 1, MAX_AYAT)) {
    throw new Error(`Posisi tidak valid: ${surah}:${ayat}`);
  }
}

export function setLastRead(data: UserData, surah: number, ayat: number, at: string): UserData {
  assertPosition(surah, ayat);
  if (data.lastRead?.surah === surah && data.lastRead.ayat === ayat) return data;
  return { ...data, lastRead: { surah, ayat, at } };
}

/** Tandai ayat 1 sampai `ayat` selesai dibaca. Menandai ayat yang sama lagi membatalkannya. */
export function toggleReadUpTo(data: UserData, surah: number, ayat: number, at: string): UserData {
  assertPosition(surah, ayat);
  const progress = { ...data.progress };
  if (progress[surah]?.readUpTo === ayat) delete progress[surah];
  else progress[surah] = { readUpTo: ayat, at };
  return { ...data, progress };
}

export function clearProgress(data: UserData, surah: number): UserData {
  if (!data.progress[surah]) return data;
  const progress = { ...data.progress };
  delete progress[surah];
  return { ...data, progress };
}

export const findBookmark = (data: UserData, surah: number, ayat: number): Bookmark | undefined =>
  data.bookmarks.find((b) => b.surah === surah && b.ayat === ayat);

/** Tambah bookmark, atau hapus kalau sudah ada. */
export function toggleBookmark(data: UserData, surah: number, ayat: number, at: string): UserData {
  assertPosition(surah, ayat);
  if (findBookmark(data, surah, ayat)) return removeBookmark(data, surah, ayat);
  if (data.bookmarks.length >= MAX_BOOKMARKS) throw new Error(`Bookmark maksimal ${MAX_BOOKMARKS}`);
  return { ...data, bookmarks: [...data.bookmarks, { surah, ayat, note: "", createdAt: at }] };
}

export function removeBookmark(data: UserData, surah: number, ayat: number): UserData {
  return { ...data, bookmarks: data.bookmarks.filter((b) => !(b.surah === surah && b.ayat === ayat)) };
}

export function setBookmarkNote(data: UserData, surah: number, ayat: number, note: string): UserData {
  if (!findBookmark(data, surah, ayat)) return data;
  const clean = note.trim().slice(0, MAX_NOTE);
  return {
    ...data,
    bookmarks: data.bookmarks.map((b) => (b.surah === surah && b.ayat === ayat ? { ...b, note: clean } : b)),
  };
}

/** Periksa dan bersihkan data mentah (dari localStorage atau berkas impor). Melempar galat bila rusak. */
export function parseUserData(raw: unknown): UserData {
  if (typeof raw !== "object" || raw === null) throw new Error("Data pengguna bukan objek");
  const r = raw as Record<string, unknown>;
  if (r.version !== USER_DATA_VERSION) throw new Error(`Versi data tidak didukung: ${String(r.version)}`);

  let lastRead: UserData["lastRead"] = null;
  if (r.lastRead != null) {
    const l = r.lastRead as Record<string, unknown>;
    if (!isInt(l.surah, 1, MAX_SURAH) || !isInt(l.ayat, 1, MAX_AYAT) || !isDate(l.at)) {
      throw new Error("Terakhir dibaca tidak valid");
    }
    lastRead = { surah: l.surah, ayat: l.ayat, at: l.at };
  }

  const progress: UserData["progress"] = {};
  for (const [key, value] of Object.entries((r.progress ?? {}) as Record<string, unknown>)) {
    const v = value as Record<string, unknown>;
    if (!isInt(Number(key), 1, MAX_SURAH) || !isInt(v?.readUpTo, 1, MAX_AYAT) || !isDate(v.at)) {
      throw new Error(`Progres surat ${key} tidak valid`);
    }
    progress[String(Number(key))] = { readUpTo: v.readUpTo, at: v.at };
  }

  if (!Array.isArray(r.bookmarks ?? [])) throw new Error("Bookmark bukan daftar");
  const seen = new Set<string>();
  const bookmarks: Bookmark[] = [];
  for (const item of (r.bookmarks ?? []) as unknown[]) {
    const b = item as Record<string, unknown>;
    if (!isInt(b?.surah, 1, MAX_SURAH) || !isInt(b.ayat, 1, MAX_AYAT) || !isDate(b.createdAt)) {
      throw new Error("Ada bookmark yang tidak valid");
    }
    const key = `${b.surah}:${b.ayat}`;
    if (seen.has(key)) continue;
    seen.add(key);
    bookmarks.push({
      surah: b.surah,
      ayat: b.ayat,
      note: typeof b.note === "string" ? b.note.trim().slice(0, MAX_NOTE) : "",
      createdAt: b.createdAt,
    });
  }
  if (bookmarks.length > MAX_BOOKMARKS) throw new Error(`Bookmark maksimal ${MAX_BOOKMARKS}`);

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
    throw new Error("Berkas bukan JSON yang valid");
  }
  const p = parsed as Record<string, unknown> | null;
  if (!p || p.app !== EXPORT_APP || p.format !== EXPORT_FORMAT) {
    throw new Error("Berkas ini bukan cadangan QuranWeb");
  }
  return parseUserData(p.data);
}

/** Gabungkan data impor ke data sekarang tanpa menghapus apa pun. */
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

  const byKey = new Map(current.bookmarks.map((b) => [`${b.surah}:${b.ayat}`, b]));
  for (const inc of incoming.bookmarks) {
    const key = `${inc.surah}:${inc.ayat}`;
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

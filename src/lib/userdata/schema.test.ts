import { describe, expect, it } from "vitest";
import {
  clearProgress,
  emptyUserData,
  exportUserData,
  findBookmark,
  importUserData,
  mergeUserData,
  parseUserData,
  removeBookmark,
  setBookmarkNote,
  setLastRead,
  toggleBookmark,
  toggleReadUpTo,
} from "./schema";

const T1 = "2026-11-17T10:00:00.000Z";
const T2 = "2026-11-18T10:00:00.000Z";

describe("terakhir dibaca", () => {
  it("menyimpan posisi dan tidak mengubah objek bila posisinya sama", () => {
    const d = setLastRead(emptyUserData(), 2, 10, T1);
    expect(d.lastRead).toEqual({ surah: 2, ayat: 10, at: T1 });
    expect(setLastRead(d, 2, 10, T2)).toBe(d);
    expect(setLastRead(d, 2, 11, T2).lastRead?.ayat).toBe(11);
  });

  it("menolak posisi di luar rentang", () => {
    expect(() => setLastRead(emptyUserData(), 0, 1, T1)).toThrow(/tidak valid/);
    expect(() => setLastRead(emptyUserData(), 115, 1, T1)).toThrow();
    expect(() => setLastRead(emptyUserData(), 2, 0, T1)).toThrow();
    expect(() => setLastRead(emptyUserData(), 2, 1.5, T1)).toThrow();
  });
});

describe("progres", () => {
  it("menandai sampai ayat tertentu, mengganti, dan membatalkan dengan menandai lagi", () => {
    let d = toggleReadUpTo(emptyUserData(), 2, 10, T1);
    expect(d.progress["2"]).toEqual({ readUpTo: 10, at: T1 });
    d = toggleReadUpTo(d, 2, 25, T2);
    expect(d.progress["2"].readUpTo).toBe(25);
    d = toggleReadUpTo(d, 2, 25, T2);
    expect(d.progress["2"]).toBeUndefined();
  });

  it("clearProgress menghapus satu surat saja", () => {
    let d = toggleReadUpTo(emptyUserData(), 1, 7, T1);
    d = toggleReadUpTo(d, 2, 10, T1);
    expect(Object.keys(clearProgress(d, 1).progress)).toEqual(["2"]);
    expect(clearProgress(d, 3)).toBe(d);
  });
});

describe("bookmark", () => {
  it("menambah, menghapus lewat toggle, dan mencatat", () => {
    let d = toggleBookmark(emptyUserData(), 2, 255, T1);
    expect(findBookmark(d, 2, 255)).toEqual({ surah: 2, ayat: 255, note: "", createdAt: T1 });
    d = setBookmarkNote(d, 2, 255, "  Ayat Kursi  ");
    expect(findBookmark(d, 2, 255)?.note).toBe("Ayat Kursi");
    d = toggleBookmark(d, 2, 255, T2);
    expect(d.bookmarks).toEqual([]);
  });

  it("catatan dipotong 500 huruf dan diabaikan untuk bookmark yang tidak ada", () => {
    let d = toggleBookmark(emptyUserData(), 1, 1, T1);
    d = setBookmarkNote(d, 1, 1, "x".repeat(900));
    expect(findBookmark(d, 1, 1)?.note).toHaveLength(500);
    expect(setBookmarkNote(d, 9, 9, "tidak ada")).toBe(d);
    expect(removeBookmark(d, 9, 9).bookmarks).toHaveLength(1);
  });

  it("fungsi tidak mengubah data asal (immutable)", () => {
    const before = emptyUserData();
    toggleBookmark(before, 1, 1, T1);
    toggleReadUpTo(before, 1, 1, T1);
    setLastRead(before, 1, 1, T1);
    expect(before).toEqual(emptyUserData());
  });
});

describe("parseUserData", () => {
  it("menerima data valid dan membuang bookmark ganda", () => {
    const raw = {
      version: 1,
      lastRead: { surah: 2, ayat: 5, at: T1 },
      progress: { "2": { readUpTo: 5, at: T1 } },
      bookmarks: [
        { surah: 1, ayat: 1, note: "a", createdAt: T1 },
        { surah: 1, ayat: 1, note: "b", createdAt: T2 },
      ],
    };
    const d = parseUserData(raw);
    expect(d.bookmarks).toHaveLength(1);
    expect(d.bookmarks[0].note).toBe("a");
  });

  it("menolak versi lain, posisi salah, tanggal salah, dan bentuk salah", () => {
    expect(() => parseUserData(null)).toThrow();
    expect(() => parseUserData({ version: 2 })).toThrow(/Versi/);
    expect(() => parseUserData({ version: 1, lastRead: { surah: 200, ayat: 1, at: T1 } })).toThrow(/Terakhir dibaca/);
    expect(() => parseUserData({ version: 1, lastRead: { surah: 1, ayat: 1, at: "bukan tanggal" } })).toThrow();
    expect(() => parseUserData({ version: 1, progress: { "2": { readUpTo: 0, at: T1 } } })).toThrow(/Progres/);
    expect(() => parseUserData({ version: 1, bookmarks: "x" })).toThrow(/daftar/);
    expect(() => parseUserData({ version: 1, bookmarks: [{ surah: 1, ayat: 1, createdAt: "?" }] })).toThrow(/bookmark/);
  });

  it("data kosong versi 1 valid", () => {
    expect(parseUserData({ version: 1 })).toEqual(emptyUserData());
  });
});

describe("ekspor dan impor", () => {
  it("bolak-balik tanpa kehilangan data", () => {
    let d = setLastRead(emptyUserData(), 36, 12, T1);
    d = toggleReadUpTo(d, 36, 12, T1);
    d = toggleBookmark(d, 36, 9, T1);
    d = setBookmarkNote(d, 36, 9, "catatan");
    const text = exportUserData(d, T2);
    expect(JSON.parse(text)).toMatchObject({ app: "quranweb", format: 1, exportedAt: T2 });
    expect(importUserData(text)).toEqual(d);
  });

  it("menolak berkas yang bukan cadangan QuranWeb atau bukan JSON", () => {
    expect(() => importUserData("{bukan json")).toThrow(/bukan JSON/);
    expect(() => importUserData(JSON.stringify({ app: "lain", format: 1, data: {} }))).toThrow(/bukan cadangan QuranWeb/);
    expect(() => importUserData(JSON.stringify({ app: "quranweb", format: 1, data: { version: 9 } }))).toThrow(/Versi/);
  });
});

describe("mergeUserData", () => {
  it("memakai terakhir dibaca yang lebih baru, progres terjauh, dan menyatukan bookmark", () => {
    let a = setLastRead(emptyUserData(), 2, 10, T1);
    a = toggleReadUpTo(a, 2, 10, T1);
    a = toggleBookmark(a, 1, 1, T1);
    let b = setLastRead(emptyUserData(), 3, 5, T2);
    b = toggleReadUpTo(b, 2, 30, T2);
    b = toggleReadUpTo(b, 3, 5, T2);
    b = toggleBookmark(b, 1, 1, T2);
    b = setBookmarkNote(b, 1, 1, "dari impor");
    b = toggleBookmark(b, 4, 4, T2);

    const m = mergeUserData(a, b);
    expect(m.lastRead).toEqual({ surah: 3, ayat: 5, at: T2 });
    expect(m.progress["2"].readUpTo).toBe(30);
    expect(m.progress["3"].readUpTo).toBe(5);
    expect(m.bookmarks).toHaveLength(2);
    expect(findBookmark(m, 1, 1)).toMatchObject({ note: "dari impor", createdAt: T1 });
  });

  it("tidak menurunkan progres atau menimpa terakhir dibaca yang lebih baru", () => {
    const cur = setLastRead(toggleReadUpTo(emptyUserData(), 2, 50, T2), 2, 50, T2);
    const old = setLastRead(toggleReadUpTo(emptyUserData(), 2, 5, T1), 2, 5, T1);
    const m = mergeUserData(cur, old);
    expect(m.lastRead?.ayat).toBe(50);
    expect(m.progress["2"].readUpTo).toBe(50);
  });
});

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
  UserDataError,
} from "./schema";

const T1 = "2026-11-17T10:00:00.000Z";
const T2 = "2026-11-18T10:00:00.000Z";

describe("last read", () => {
  it("saves the position and returns the same object when it did not change", () => {
    const d = setLastRead(emptyUserData(), 2, 10, T1);
    expect(d.lastRead).toEqual({ surah: 2, verse: 10, at: T1 });
    expect(setLastRead(d, 2, 10, T2)).toBe(d);
    expect(setLastRead(d, 2, 11, T2).lastRead?.verse).toBe(11);
  });

  it("rejects positions out of range", () => {
    expect(() => setLastRead(emptyUserData(), 0, 1, T1)).toThrow(/Invalid position/);
    expect(() => setLastRead(emptyUserData(), 115, 1, T1)).toThrow();
    expect(() => setLastRead(emptyUserData(), 2, 0, T1)).toThrow();
    expect(() => setLastRead(emptyUserData(), 2, 1.5, T1)).toThrow();
  });
});

describe("progress", () => {
  it("marks up to a verse, replaces it, and undoes it by marking again", () => {
    let d = toggleReadUpTo(emptyUserData(), 2, 10, T1);
    expect(d.progress["2"]).toEqual({ readUpTo: 10, at: T1 });
    d = toggleReadUpTo(d, 2, 25, T2);
    expect(d.progress["2"].readUpTo).toBe(25);
    d = toggleReadUpTo(d, 2, 25, T2);
    expect(d.progress["2"]).toBeUndefined();
  });

  it("clearProgress removes one surah only", () => {
    let d = toggleReadUpTo(emptyUserData(), 1, 7, T1);
    d = toggleReadUpTo(d, 2, 10, T1);
    expect(Object.keys(clearProgress(d, 1).progress)).toEqual(["2"]);
    expect(clearProgress(d, 3)).toBe(d);
  });
});

describe("bookmarks", () => {
  it("adds, removes by toggling, and keeps a note", () => {
    let d = toggleBookmark(emptyUserData(), 2, 255, T1);
    expect(findBookmark(d, 2, 255)).toEqual({ surah: 2, verse: 255, note: "", createdAt: T1 });
    d = setBookmarkNote(d, 2, 255, "  Ayat Kursi  ");
    expect(findBookmark(d, 2, 255)?.note).toBe("Ayat Kursi");
    d = toggleBookmark(d, 2, 255, T2);
    expect(d.bookmarks).toEqual([]);
  });

  it("cuts a note to 500 characters and ignores a bookmark that does not exist", () => {
    let d = toggleBookmark(emptyUserData(), 1, 1, T1);
    d = setBookmarkNote(d, 1, 1, "x".repeat(900));
    expect(findBookmark(d, 1, 1)?.note).toHaveLength(500);
    expect(setBookmarkNote(d, 9, 9, "does not exist")).toBe(d);
    expect(removeBookmark(d, 9, 9).bookmarks).toHaveLength(1);
  });

  it("does not change the original data (immutable)", () => {
    const before = emptyUserData();
    toggleBookmark(before, 1, 1, T1);
    toggleReadUpTo(before, 1, 1, T1);
    setLastRead(before, 1, 1, T1);
    expect(before).toEqual(emptyUserData());
  });
});

describe("parseUserData", () => {
  it("accepts valid data and drops duplicate bookmarks", () => {
    const raw = {
      version: 1,
      lastRead: { surah: 2, verse: 5, at: T1 },
      progress: { "2": { readUpTo: 5, at: T1 } },
      bookmarks: [
        { surah: 1, verse: 1, note: "a", createdAt: T1 },
        { surah: 1, verse: 1, note: "b", createdAt: T2 },
      ],
    };
    const d = parseUserData(raw);
    expect(d.bookmarks).toHaveLength(1);
    expect(d.bookmarks[0].note).toBe("a");
  });

  it("rejects other versions, wrong positions, wrong dates and wrong shapes", () => {
    expect(() => parseUserData(null)).toThrow();
    expect(() => parseUserData({ version: 2 })).toThrow(/Unsupported data version/);
    expect(() => parseUserData({ version: 1, lastRead: { surah: 200, verse: 1, at: T1 } })).toThrow(/Invalid last read/);
    expect(() => parseUserData({ version: 1, lastRead: { surah: 1, verse: 1, at: "not a date" } })).toThrow();
    expect(() => parseUserData({ version: 1, progress: { "2": { readUpTo: 0, at: T1 } } })).toThrow(/Invalid progress/);
    expect(() => parseUserData({ version: 1, bookmarks: "x" })).toThrow(/not a list/);
    expect(() => parseUserData({ version: 1, bookmarks: [{ surah: 1, verse: 1, createdAt: "?" }] })).toThrow(/bookmark is invalid/);
  });

  it("empty version 1 data is valid", () => {
    expect(parseUserData({ version: 1 })).toEqual(emptyUserData());
  });
});

describe("export and import", () => {
  it("reports a code for every kind of rejection, for the interface to translate", () => {
    const code = (fn: () => unknown) => {
      try {
        fn();
      } catch (err) {
        return err instanceof UserDataError ? err.code : "other";
      }
    };
    expect(code(() => importUserData("{broken"))).toBe("not-json");
    expect(code(() => importUserData(JSON.stringify({ app: "other" })))).toBe("not-backup");
    expect(code(() => importUserData(JSON.stringify({ app: "quranweb", format: 1, data: { version: 9 } })))).toBe("unsupported-version");
    expect(code(() => importUserData(JSON.stringify({ app: "quranweb", format: 1, data: { version: 1, bookmarks: "x" } })))).toBe("invalid");
  });

  it("round-trips without losing data", () => {
    let d = setLastRead(emptyUserData(), 36, 12, T1);
    d = toggleReadUpTo(d, 36, 12, T1);
    d = toggleBookmark(d, 36, 9, T1);
    d = setBookmarkNote(d, 36, 9, "a note");
    const text = exportUserData(d, T2);
    expect(JSON.parse(text)).toMatchObject({ app: "quranweb", format: 1, exportedAt: T2 });
    expect(importUserData(text)).toEqual(d);
  });

  it("rejects files that are not a QuranWeb backup or not JSON", () => {
    expect(() => importUserData("{broken")).toThrow(/not valid JSON/);
    expect(() => importUserData(JSON.stringify({ app: "other", format: 1, data: {} }))).toThrow(/not a QuranWeb backup/);
    expect(() => importUserData(JSON.stringify({ app: "quranweb", format: 1, data: { version: 9 } }))).toThrow(/Unsupported data version/);
  });
});

describe("mergeUserData", () => {
  it("keeps the newer last read, the furthest progress, and unites the bookmarks", () => {
    let a = setLastRead(emptyUserData(), 2, 10, T1);
    a = toggleReadUpTo(a, 2, 10, T1);
    a = toggleBookmark(a, 1, 1, T1);
    let b = setLastRead(emptyUserData(), 3, 5, T2);
    b = toggleReadUpTo(b, 2, 30, T2);
    b = toggleReadUpTo(b, 3, 5, T2);
    b = toggleBookmark(b, 1, 1, T2);
    b = setBookmarkNote(b, 1, 1, "from the import");
    b = toggleBookmark(b, 4, 4, T2);

    const m = mergeUserData(a, b);
    expect(m.lastRead).toEqual({ surah: 3, verse: 5, at: T2 });
    expect(m.progress["2"].readUpTo).toBe(30);
    expect(m.progress["3"].readUpTo).toBe(5);
    expect(m.bookmarks).toHaveLength(2);
    expect(findBookmark(m, 1, 1)).toMatchObject({ note: "from the import", createdAt: T1 });
  });

  it("never lowers progress or overwrites a newer last read", () => {
    const cur = setLastRead(toggleReadUpTo(emptyUserData(), 2, 50, T2), 2, 50, T2);
    const old = setLastRead(toggleReadUpTo(emptyUserData(), 2, 5, T1), 2, 5, T1);
    const m = mergeUserData(cur, old);
    expect(m.lastRead?.verse).toBe(50);
    expect(m.progress["2"].readUpTo).toBe(50);
  });
});

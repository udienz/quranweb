import { describe, expect, it } from "vitest";
import {
  clearProgress,
  emptyUserData,
  exportUserData,
  findBookmark,
  importUserData,
  liveBookmarks,
  liveProgress,
  mergeUserData,
  parseUserData,
  progressOf,
  pruneTombstones,
  removeBookmark,
  setBookmarkNote,
  setLastRead,
  toggleBookmark,
  toggleReadUpTo,
  UserDataError,
  type Bookmark,
  type UserData,
} from "./schema";

const T1 = "2026-11-17T10:00:00.000Z";
const T2 = "2026-11-18T10:00:00.000Z";
const T3 = "2026-11-19T10:00:00.000Z";

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
    expect(progressOf(d, 2)).toBe(10);
    d = toggleReadUpTo(d, 2, 25, T2);
    expect(progressOf(d, 2)).toBe(25);
    expect(d.progress["2"]).toEqual({ readUpTo: 25, at: T2 });
    d = toggleReadUpTo(d, 2, 25, T3);
    expect(progressOf(d, 2)).toBe(0);
  });

  it("clearing keeps a tombstone that records when, and hides the progress", () => {
    let d = toggleReadUpTo(emptyUserData(), 1, 7, T1);
    d = toggleReadUpTo(d, 2, 10, T1);
    const cleared = clearProgress(d, 1, T2);
    expect(cleared.progress["1"]).toEqual({ readUpTo: 7, at: T2, deletedAt: T2 });
    expect(liveProgress(cleared).map((p) => p.surah)).toEqual([2]);
    expect(progressOf(cleared, 1)).toBe(0);
    expect(clearProgress(d, 3, T2)).toBe(d); // nothing to clear
    expect(clearProgress(cleared, 1, T3)).toBe(cleared); // already cleared
  });

  it("marking again after clearing starts a live entry", () => {
    const cleared = clearProgress(toggleReadUpTo(emptyUserData(), 2, 10, T1), 2, T2);
    const again = toggleReadUpTo(cleared, 2, 10, T3);
    expect(again.progress["2"]).toEqual({ readUpTo: 10, at: T3 });
  });
});

describe("bookmarks", () => {
  it("adds, removes by toggling (leaving a tombstone), and keeps a note", () => {
    let d = toggleBookmark(emptyUserData(), 2, 255, T1);
    expect(findBookmark(d, 2, 255)).toEqual({ surah: 2, verse: 255, note: "", createdAt: T1, updatedAt: T1 });
    d = setBookmarkNote(d, 2, 255, "  Ayat Kursi  ", T2);
    expect(findBookmark(d, 2, 255)).toMatchObject({ note: "Ayat Kursi", createdAt: T1, updatedAt: T2 });
    d = toggleBookmark(d, 2, 255, T3);
    expect(findBookmark(d, 2, 255)).toBeUndefined();
    expect(liveBookmarks(d)).toEqual([]);
    expect(d.bookmarks).toEqual([{ surah: 2, verse: 255, note: "Ayat Kursi", createdAt: T1, updatedAt: T3, deletedAt: T3 }]);
  });

  it("a bookmark added again after removal starts fresh and beats the tombstone", () => {
    let d = removeBookmark(setBookmarkNote(toggleBookmark(emptyUserData(), 1, 1, T1), 1, 1, "old", T1), 1, 1, T2);
    d = toggleBookmark(d, 1, 1, T3);
    expect(d.bookmarks).toEqual([{ surah: 1, verse: 1, note: "", createdAt: T3, updatedAt: T3 }]);
  });

  it("cuts a note to 500 characters, ignores unchanged notes and bookmarks that do not exist", () => {
    let d = toggleBookmark(emptyUserData(), 1, 1, T1);
    d = setBookmarkNote(d, 1, 1, "x".repeat(900), T2);
    expect(findBookmark(d, 1, 1)?.note).toHaveLength(500);
    expect(setBookmarkNote(d, 1, 1, "x".repeat(900), T3)).toBe(d);
    expect(setBookmarkNote(d, 9, 9, "does not exist", T3)).toBe(d);
    expect(removeBookmark(d, 9, 9, T3)).toBe(d);
  });

  it("does not change the original data (immutable)", () => {
    const before = emptyUserData();
    toggleBookmark(before, 1, 1, T1);
    toggleReadUpTo(before, 1, 1, T1);
    setLastRead(before, 1, 1, T1);
    expect(before).toEqual(emptyUserData());
  });

  it("keeps the bookmarks in a fixed order", () => {
    let d = toggleBookmark(emptyUserData(), 3, 1, T1);
    d = toggleBookmark(d, 1, 5, T1);
    d = toggleBookmark(d, 1, 2, T1);
    expect(d.bookmarks.map((b) => `${b.surah}:${b.verse}`)).toEqual(["1:2", "1:5", "3:1"]);
  });
});

describe("tombstones", () => {
  it("are dropped after 90 days and kept before", () => {
    const old = "2026-01-01T00:00:00.000Z";
    const recent = "2026-11-01T00:00:00.000Z";
    let d = toggleBookmark(toggleBookmark(emptyUserData(), 1, 1, old), 1, 2, old);
    d = removeBookmark(removeBookmark(d, 1, 1, old), 1, 2, recent);
    d = clearProgress(toggleReadUpTo(toggleReadUpTo(d, 5, 3, old), 6, 3, old), 5, old);
    d = clearProgress(d, 6, recent);
    const pruned = pruneTombstones(d, "2026-11-18T00:00:00.000Z");
    expect(pruned.bookmarks.map((b) => b.verse)).toEqual([2]);
    expect(Object.keys(pruned.progress)).toEqual(["6"]);
  });

  it("never drops live data, and returns the same object when nothing is old", () => {
    const d = toggleReadUpTo(toggleBookmark(emptyUserData(), 1, 1, "2020-01-01T00:00:00.000Z"), 1, 3, "2020-01-01T00:00:00.000Z");
    expect(pruneTombstones(d, T3)).toBe(d);
  });
});

describe("parseUserData", () => {
  const v2 = (): Record<string, unknown> => ({
    version: 2,
    lastRead: { surah: 2, verse: 5, at: T1 },
    progress: { "2": { readUpTo: 5, at: T1 }, "3": { readUpTo: 9, at: T2, deletedAt: T2 } },
    bookmarks: [
      { surah: 1, verse: 1, note: "a", createdAt: T1, updatedAt: T1 },
      { surah: 1, verse: 1, note: "b", createdAt: T1, updatedAt: T2 },
      { surah: 4, verse: 2, note: "", createdAt: T1, updatedAt: T3, deletedAt: T3 },
    ],
  });

  it("accepts version 2 and keeps the newest of duplicate bookmarks, tombstones included", () => {
    const d = parseUserData(v2());
    expect(d.version).toBe(2);
    expect(d.bookmarks).toHaveLength(2);
    expect(findBookmark(d, 1, 1)?.note).toBe("b");
    expect(d.progress["3"].deletedAt).toBe(T2);
  });

  it("migrates version 1: bookmarks last changed when created, nothing is deleted", () => {
    const d = parseUserData({
      version: 1,
      lastRead: { surah: 2, verse: 5, at: T1 },
      progress: { "2": { readUpTo: 5, at: T1 } },
      bookmarks: [{ surah: 1, verse: 1, note: " hello ", createdAt: T1 }],
    });
    expect(d).toEqual({
      version: 2,
      lastRead: { surah: 2, verse: 5, at: T1 },
      progress: { "2": { readUpTo: 5, at: T1 } },
      bookmarks: [{ surah: 1, verse: 1, note: "hello", createdAt: T1, updatedAt: T1 }],
    });
  });

  it("ignores a removal date in version 1 data, which never had them", () => {
    const d = parseUserData({ version: 1, bookmarks: [{ surah: 1, verse: 1, createdAt: T1, deletedAt: T2 }] });
    expect(d.bookmarks[0].deletedAt).toBeUndefined();
  });

  it("rejects other versions, wrong positions, wrong dates and wrong shapes", () => {
    expect(() => parseUserData(null)).toThrow();
    expect(() => parseUserData({ version: 3 })).toThrow(/Unsupported data version/);
    expect(() => parseUserData({ version: 2, lastRead: { surah: 200, verse: 1, at: T1 } })).toThrow(/Invalid last read/);
    expect(() => parseUserData({ version: 2, lastRead: { surah: 1, verse: 1, at: "not a date" } })).toThrow();
    expect(() => parseUserData({ version: 2, progress: { "2": { readUpTo: 0, at: T1 } } })).toThrow(/Invalid progress/);
    expect(() => parseUserData({ version: 2, progress: { "2": { readUpTo: 1, at: T1, deletedAt: "?" } } })).toThrow(/removal date/);
    expect(() => parseUserData({ version: 2, bookmarks: "x" })).toThrow(/not a list/);
    expect(() => parseUserData({ version: 2, bookmarks: [{ surah: 1, verse: 1, createdAt: "?" }] })).toThrow(/bookmark is invalid/);
    expect(() => parseUserData({ version: 2, bookmarks: [{ surah: 1, verse: 1, createdAt: T1 }] })).toThrow(/no valid change date/);
  });

  it("empty data of either version is valid and becomes version 2", () => {
    expect(parseUserData({ version: 1 })).toEqual(emptyUserData());
    expect(parseUserData({ version: 2 })).toEqual(emptyUserData());
  });

  it("limits the live bookmarks and the entries together", () => {
    // Unique valid positions: 114 surahs of up to 286 verses.
    const at = (i: number) => ({ surah: 1 + (Math.floor(i / 286) % 114), verse: 1 + (i % 286) });
    const bookmarks = (from: number, count: number, deleted: boolean) =>
      Array.from({ length: count }, (_, k) => ({
        ...at(from + k),
        createdAt: T1,
        updatedAt: T1,
        ...(deleted ? { deletedAt: T2 } : {}),
      }));
    const parse = (list: unknown[]) => () => parseUserData({ version: 2, bookmarks: list });

    expect(parse(bookmarks(0, 5001, false))).toThrow(/At most 5000 bookmarks/);
    expect(parse(bookmarks(0, 5000, false))).not.toThrow();
    // Tombstones are not bookmarks, but they count towards the total of 10,000 entries.
    expect(parse([...bookmarks(0, 5000, false), ...bookmarks(5000, 5000, true)])).not.toThrow();
    expect(parse([...bookmarks(0, 5000, false), ...bookmarks(5000, 5001, true)])).toThrow(/Too many entries/);
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
    expect(code(() => importUserData(JSON.stringify({ app: "quranweb", format: 1, data: { version: 2, bookmarks: "x" } })))).toBe("invalid");
  });

  it("round-trips without losing data, tombstones included", () => {
    let d = setLastRead(emptyUserData(), 36, 12, T1);
    d = toggleReadUpTo(d, 36, 12, T1);
    d = toggleBookmark(d, 36, 9, T1);
    d = setBookmarkNote(d, 36, 9, "a note", T2);
    d = removeBookmark(toggleBookmark(d, 1, 1, T2), 1, 1, T3);
    const text = exportUserData(d, T3);
    expect(JSON.parse(text)).toMatchObject({ app: "quranweb", format: 1, exportedAt: T3, data: { version: 2 } });
    expect(importUserData(text)).toEqual(d);
  });

  it("reads a backup file made by version 1 and returns version 2", () => {
    const file = JSON.stringify({
      app: "quranweb",
      format: 1,
      exportedAt: T1,
      data: { version: 1, lastRead: null, progress: {}, bookmarks: [{ surah: 2, verse: 3, note: "old", createdAt: T1 }] },
    });
    expect(importUserData(file).bookmarks).toEqual([{ surah: 2, verse: 3, note: "old", createdAt: T1, updatedAt: T1 }]);
  });

  it("rejects files that are not a QuranWeb backup or not JSON", () => {
    expect(() => importUserData("{broken")).toThrow(/not valid JSON/);
    expect(() => importUserData(JSON.stringify({ app: "other", format: 1, data: {} }))).toThrow(/not a QuranWeb backup/);
  });
});

// ------------------------------------------------------------------ merging

describe("mergeUserData", () => {
  it("the newest change to each item wins, whichever copy it is in", () => {
    let a = setLastRead(emptyUserData(), 2, 10, T1);
    a = toggleReadUpTo(a, 2, 10, T1);
    a = toggleBookmark(a, 1, 1, T1);
    let b = setLastRead(emptyUserData(), 3, 5, T2);
    b = toggleReadUpTo(b, 2, 5, T2);
    b = toggleReadUpTo(b, 3, 5, T2);
    b = setBookmarkNote(toggleBookmark(b, 1, 1, T1), 1, 1, "from b", T2);
    b = toggleBookmark(b, 4, 4, T2);

    const m = mergeUserData(a, b);
    expect(m.lastRead).toEqual({ surah: 3, verse: 5, at: T2 });
    expect(progressOf(m, 2)).toBe(5); // b marked verse 5 later than a marked verse 10
    expect(progressOf(m, 3)).toBe(5);
    expect(findBookmark(m, 1, 1)?.note).toBe("from b");
    expect(liveBookmarks(m)).toHaveLength(2);
    expect(mergeUserData(b, a)).toEqual(m);
  });

  it("a removal propagates: the device that still has the item loses it, in either order", () => {
    const base = toggleBookmark(emptyUserData(), 2, 255, T1);
    const removed = removeBookmark(base, 2, 255, T2); // device A removes it later
    for (const merged of [mergeUserData(base, removed), mergeUserData(removed, base)]) {
      expect(findBookmark(merged, 2, 255)).toBeUndefined();
      expect(merged.bookmarks[0].deletedAt).toBe(T2);
    }
  });

  it("an item added or changed after a removal comes back", () => {
    const removed = removeBookmark(toggleBookmark(emptyUserData(), 2, 255, T1), 2, 255, T2);
    const readded = toggleBookmark(removed, 2, 255, T3);
    expect(findBookmark(mergeUserData(removed, readded), 2, 255)?.createdAt).toBe(T3);
    const cleared = clearProgress(toggleReadUpTo(emptyUserData(), 2, 10, T1), 2, T2);
    const marked = toggleReadUpTo(cleared, 2, 12, T3);
    expect(progressOf(mergeUserData(cleared, marked), 2)).toBe(12);
  });

  it("importing an old backup never undoes a newer change", () => {
    const old = toggleBookmark(emptyUserData(), 1, 1, T1); // the backup still has the bookmark
    const now = removeBookmark(old, 1, 1, T2); // the reader removed it afterwards
    expect(findBookmark(mergeUserData(now, old), 1, 1)).toBeUndefined();
    const olderRead = setLastRead(emptyUserData(), 2, 3, T1);
    expect(mergeUserData(setLastRead(emptyUserData(), 5, 6, T2), olderRead).lastRead).toEqual({ surah: 5, verse: 6, at: T2 });
  });

  it("at the same instant a removal wins", () => {
    const live = toggleBookmark(emptyUserData(), 1, 1, T1);
    const removed = removeBookmark(live, 1, 1, T1);
    expect(findBookmark(mergeUserData(live, removed), 1, 1)).toBeUndefined();
    expect(findBookmark(mergeUserData(removed, live), 1, 1)).toBeUndefined();
  });

  it("empty data is the identity", () => {
    const d = toggleBookmark(setLastRead(emptyUserData(), 2, 3, T1), 1, 1, T1);
    expect(mergeUserData(d, emptyUserData())).toEqual(d);
    expect(mergeUserData(emptyUserData(), d)).toEqual(d);
  });
});

// A tiny seeded generator, so a failure can be reproduced.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function randomData(next: () => number): UserData {
  const pick = <T,>(items: T[]) => items[Math.floor(next() * items.length)];
  // Few distinct values, so that the copies collide a lot and the tie-breaks are exercised.
  const times = [T1, T2, T3];
  let d = emptyUserData();
  if (next() < 0.7) d = { ...d, lastRead: { surah: pick([1, 2]), verse: pick([1, 2, 3]), at: pick(times) } };
  for (const surah of [1, 2, 3]) {
    const roll = next();
    if (roll < 0.3) continue;
    const at = pick(times);
    d = { ...d, progress: { ...d.progress, [surah]: { readUpTo: pick([1, 5, 9]), at, ...(roll > 0.75 ? { deletedAt: at } : {}) } } };
  }
  const bookmarks: Bookmark[] = [];
  for (const [surah, verse] of [[1, 1], [1, 2], [2, 1], [3, 7]]) {
    const roll = next();
    if (roll < 0.25) continue;
    const updatedAt = pick(times);
    bookmarks.push({
      surah,
      verse,
      note: pick(["", "a", "b"]),
      createdAt: T1,
      updatedAt,
      ...(roll > 0.7 ? { deletedAt: updatedAt } : {}),
    });
  }
  return { ...d, bookmarks: bookmarks.sort((x, y) => x.surah - y.surah || x.verse - y.verse) };
}

describe("merge laws (random data)", () => {
  const cases = Array.from({ length: 300 }, (_, i) => {
    const next = rng(i + 1);
    return [randomData(next), randomData(next), randomData(next)] as const;
  });

  it("is commutative: the order of two copies does not matter", () => {
    cases.forEach(([a, b], i) => expect(mergeUserData(a, b), `case ${i}`).toEqual(mergeUserData(b, a)));
  });

  it("is idempotent: merging a copy with itself, or again, changes nothing", () => {
    cases.forEach(([a, b], i) => {
      expect(mergeUserData(a, a), `case ${i}`).toEqual(mergeUserData(a, emptyUserData()));
      const m = mergeUserData(a, b);
      expect(mergeUserData(m, a)).toEqual(m);
      expect(mergeUserData(m, b)).toEqual(m);
      expect(mergeUserData(m, m)).toEqual(m);
    });
  });

  it("is associative: three devices converge however they sync", () => {
    cases.forEach(([a, b, c], i) => {
      const left = mergeUserData(mergeUserData(a, b), c);
      expect(left, `case ${i}`).toEqual(mergeUserData(a, mergeUserData(b, c)));
      expect(left).toEqual(mergeUserData(mergeUserData(c, a), b));
    });
  });

  it("keeps the result valid data of the current version", () => {
    cases.forEach(([a, b], i) => {
      const m = mergeUserData(a, b);
      expect(() => parseUserData(m), `case ${i}`).not.toThrow();
      expect(parseUserData(JSON.parse(JSON.stringify(m)))).toEqual(m);
    });
  });
});

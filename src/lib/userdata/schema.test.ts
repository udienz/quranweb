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
  type UserData, setSelectionChoice, setLocaleChoice, createCollection, renameCollection, removeCollection, setBookmarkCollection, liveCollections, collectionOf, setDailyGoal, recordVersesRead, versesReadOn, goalStreak, versesReadInTotal, TOTAL_VERSES, setLayoutChoice, setPagingChoice, setThemeChoice, setFontSizeChoice, setPlaybackModeChoice, clampFutureTimes } from "./schema";

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
      choices: {},
      collections: [],
      goal: null,
      activity: {},
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

  it("brings future change times in a backup file back to now, so the file cannot outrank later real changes", () => {
    const FAR = "9999-01-01T00:00:00.000Z";
    const file = JSON.stringify({
      app: "quranweb",
      format: 1,
      exportedAt: T1,
      data: {
        version: 2,
        lastRead: null,
        progress: {},
        bookmarks: [
          { surah: 1, verse: 1, note: "planted", createdAt: FAR, updatedAt: FAR },
          { surah: 2, verse: 255, note: "", createdAt: FAR, updatedAt: FAR, deletedAt: FAR },
        ],
        choices: { locale: { value: "en", at: FAR } },
        collections: [],
        goal: null,
        activity: {},
      },
    });
    const imported = importUserData(file, T2);
    expect(imported.bookmarks.every((b) => b.updatedAt === T2 && b.createdAt === T2)).toBe(true);
    expect(imported.choices.locale?.at).toBe(T2);

    // A later real change on another device now wins, and the tombstone ages out like any other.
    let device = mergeUserData(toggleBookmark(emptyUserData(), 2, 255, T1), imported);
    device = toggleBookmark(removeBookmark(device, 1, 1, T3), 2, 255, T3);
    device = setLocaleChoice(device, "id", T3);
    const merged = mergeUserData(imported, device);
    expect(liveBookmarks(merged).map((b) => `${b.surah}:${b.verse}`)).toEqual(["2:255"]);
    expect(merged.choices.locale?.value).toBe("id");
    expect(pruneTombstones(imported, "2027-03-01T00:00:00.000Z").bookmarks.some((b) => b.deletedAt)).toBe(false);
  });

  it("keeps times up to a day ahead (a fast device clock) and returns the same object when nothing changes", () => {
    const d = toggleBookmark(emptyUserData(), 3, 3, "2026-11-19T20:00:00.000Z");
    expect(clampFutureTimes(d, T3)).toBe(d);
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
      ...(next() < 0.5 ? { collectionId: pick(["coll0001", "coll0002"]) } : {}),
    });
  }
  const choices: UserData["choices"] = {};
  if (next() < 0.6) choices.selection = { value: { qari: pick(["a", "b"]), translations: [pick(["ind-x", "eng-y"])] }, at: pick(times) };
  if (next() < 0.6) choices.locale = { value: pick(["en", "id"] as const), at: pick(times) };
  if (next() < 0.5) choices.layout = { value: pick(["mushaf", "cards"] as const), at: pick(times) };
  if (next() < 0.5) choices.paging = { value: pick(["verses", "mushaf"] as const), at: pick(times) };
  if (next() < 0.5) choices.theme = { value: pick(["light", "dark", "auto"] as const), at: pick(times) };
  if (next() < 0.5) choices.fontSize = { value: { arabic: pick([1, 1.3]), latin: pick([0.85, 1]) }, at: pick(times) };
  if (next() < 0.5) choices.playbackMode = { value: pick(["stop", "repeat", "next"] as const), at: pick(times) };
  const collections: UserData["collections"] = [];
  for (const id of ["coll0001", "coll0002"]) {
    const roll = next();
    if (roll < 0.3) continue;
    const updatedAt = pick(times);
    collections.push({ id, name: pick(["Doa", "Hafalan"]), createdAt: T1, updatedAt, ...(roll > 0.75 ? { deletedAt: updatedAt } : {}) });
  }
  const goal = next() < 0.6 ? { versesPerDay: pick([5, 10, 20]), at: pick(times) } : null;
  const activity: UserData["activity"] = {};
  for (const day of ["2026-11-01", "2026-11-02"]) {
    for (const device of ["dev00001", "dev00002"]) {
      if (next() < 0.5) (activity[day] ??= {})[device] = pick([1, 4, 9]);
    }
  }
  const sortedActivity = Object.fromEntries(Object.keys(activity).sort().map((d) => [d, Object.fromEntries(Object.keys(activity[d]).sort().map((k) => [k, activity[d][k]]))]));
  return { ...d, bookmarks: bookmarks.sort((x, y) => x.surah - y.surah || x.verse - y.verse), choices, collections, goal, activity: sortedActivity };
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

describe("choices (editions, reciter, language)", () => {
  it("records an explicit choice and keeps only valid selection fields", () => {
    let d = setSelectionChoice(emptyUserData(), { qari: "05", translations: ["ind-kemenag"], bogus: 1 } as never, T1);
    d = setLocaleChoice(d, "en", T2);
    expect(d.choices).toEqual({ selection: { value: { qari: "05", translations: ["ind-kemenag"] }, at: T1 }, locale: { value: "en", at: T2 } });
    expect(() => setLocaleChoice(d, "ko" as never, T3)).toThrow();
  });

  it("takes the newest choice for each kind on its own", () => {
    const a = setLocaleChoice(setSelectionChoice(emptyUserData(), { qari: "01" }, T3), "en", T1);
    const b = setLocaleChoice(setSelectionChoice(emptyUserData(), { qari: "02" }, T1), "id", T3);
    const m = mergeUserData(a, b);
    expect(m.choices.selection?.value).toEqual({ qari: "01" });
    expect(m.choices.locale?.value).toBe("id");
  });

  it("keeps the account's choices when a copy has none (an older browser or a device that never chose)", () => {
    const account = setLocaleChoice(emptyUserData(), "en", T1);
    expect(mergeUserData(account, emptyUserData()).choices).toEqual(account.choices);
  });

  it("round-trips through JSON and rejects broken choices", () => {
    const d = setLocaleChoice(setSelectionChoice(emptyUserData(), { arabic: "ara-x", tafsir: null }, T1), "id", T2);
    expect(parseUserData(JSON.parse(JSON.stringify(d)))).toEqual(d);
    const raw = JSON.parse(JSON.stringify(d));
    expect(() => parseUserData({ ...raw, choices: { locale: { value: "ko", at: T1 } } })).toThrow();
    expect(() => parseUserData({ ...raw, choices: { selection: { value: {}, at: "not a date" } } })).toThrow();
  });

  it("reads data without choices (saved before this feature) as having none", () => {
    const old = { version: 2, lastRead: null, progress: {}, bookmarks: [] };
    expect(parseUserData(old).choices).toEqual({});
  });
});

describe("bookmark collections", () => {
  const base = () => toggleBookmark(toggleBookmark(emptyUserData(), 2, 255, T1), 36, 1, T1);

  it("creates, renames and lists collections in creation order, with clean names", () => {
    let d = createCollection(base(), "coll0002", "  Hafalan   juz 30 ", T2);
    d = createCollection(d, "coll0001", "Doa", T3);
    expect(liveCollections(d).map((c) => c.name)).toEqual(["Hafalan juz 30", "Doa"]);
    d = renameCollection(d, "coll0001", "Doa harian", T3);
    expect(liveCollections(d)[1].name).toBe("Doa harian");
    expect(() => createCollection(d, "coll0003", "   ", T3)).toThrow(/name/);
    expect(() => createCollection(d, "coll0001", "Dup", T3)).toThrow(/already used/);
    expect(() => createCollection(d, "BAD ID", "x", T3)).toThrow(/Invalid collection id/);
  });

  it("puts a bookmark in a collection and takes it out, as a change of that bookmark", () => {
    let d = createCollection(base(), "coll0001", "Doa", T1);
    d = setBookmarkCollection(d, 2, 255, "coll0001", T2);
    const b = findBookmark(d, 2, 255)!;
    expect(collectionOf(d, b)).toBe("coll0001");
    expect(b.updatedAt).toBe(T2);
    d = setBookmarkCollection(d, 2, 255, null, T3);
    expect(findBookmark(d, 2, 255)!.collectionId).toBeUndefined();
    expect(() => setBookmarkCollection(d, 2, 255, "nosuch01", T3)).toThrow(/Unknown collection/);
  });

  it("keeps the bookmarks of a removed collection, without the collection", () => {
    let d = createCollection(base(), "coll0001", "Doa", T1);
    d = setBookmarkCollection(d, 2, 255, "coll0001", T1);
    d = removeCollection(d, "coll0001", T2);
    expect(liveCollections(d)).toEqual([]);
    expect(liveBookmarks(d).length).toBe(2);
    expect(collectionOf(d, findBookmark(d, 2, 255)!)).toBeNull();
  });

  it("a removal on one device reaches the other, and a rename on another device is kept", () => {
    const start = createCollection(base(), "coll0001", "Doa", T1);
    const a = removeCollection(start, "coll0001", T3);
    const b = renameCollection(start, "coll0001", "Doa pagi", T2);
    expect(liveCollections(mergeUserData(a, b))).toEqual([]);
    const c = renameCollection(start, "coll0001", "Doa petang", T3);
    expect(liveCollections(mergeUserData(b, c))[0].name).toBe("Doa petang");
  });

  it("round-trips through JSON, reads data without collections, and rejects broken ones", () => {
    let d = createCollection(base(), "coll0001", "Doa", T1);
    d = setBookmarkCollection(d, 2, 255, "coll0001", T2);
    expect(parseUserData(JSON.parse(JSON.stringify(d)))).toEqual(d);
    expect(parseUserData({ version: 2, lastRead: null, progress: {}, bookmarks: [] }).collections).toEqual([]);
    const raw = JSON.parse(JSON.stringify(d));
    expect(() => parseUserData({ ...raw, collections: [{ id: "x", name: "a", createdAt: T1, updatedAt: T1 }] })).toThrow();
    expect(() => parseUserData({ ...raw, collections: [{ id: "coll0009", name: "  ", createdAt: T1, updatedAt: T1 }] })).toThrow();
    const badBookmark = { ...raw, bookmarks: [{ ...raw.bookmarks[0], collectionId: "NOT VALID" }] };
    expect(() => parseUserData(badBookmark)).toThrow(/invalid collection/);
  });

  it("drops collection tombstones after 90 days", () => {
    const d = removeCollection(createCollection(emptyUserData(), "coll0001", "Doa", T1), "coll0001", T1);
    expect(pruneTombstones(d, new Date(Date.parse(T1) + 91 * 86400000).toISOString()).collections).toEqual([]);
  });
});

describe("daily goal and khatam progress", () => {
  const dev = "devaaaa1";
  it("sets and validates the goal", () => {
    expect(setDailyGoal(emptyUserData(), 20, T1).goal).toEqual({ versesPerDay: 20, at: T1 });
    expect(setDailyGoal(emptyUserData(), 0, T1).goal?.versesPerDay).toBe(0);
    expect(() => setDailyGoal(emptyUserData(), 1001, T1)).toThrow();
    expect(() => setDailyGoal(emptyUserData(), 2.5, T1)).toThrow();
  });

  it("adds a device's reading for a day, and sums devices", () => {
    let d = recordVersesRead(emptyUserData(), dev, "2026-11-18", 5);
    d = recordVersesRead(d, dev, "2026-11-18", 3);
    d = recordVersesRead(d, "devbbbb2", "2026-11-18", 4);
    expect(versesReadOn(d, "2026-11-18")).toBe(12);
    expect(versesReadOn(d, "2026-11-17")).toBe(0);
    expect(recordVersesRead(d, "BAD", "2026-11-18", 1)).toBe(d);
    expect(recordVersesRead(d, dev, "18-11-2026", 1)).toBe(d);
  });

  it("merges two devices without counting twice, however often they sync", () => {
    const start = emptyUserData();
    const a = recordVersesRead(start, "devaaaa1", "2026-11-18", 10);
    const b = recordVersesRead(start, "devbbbb2", "2026-11-18", 7);
    const m = mergeUserData(a, b);
    expect(versesReadOn(m, "2026-11-18")).toBe(17);
    expect(versesReadOn(mergeUserData(m, mergeUserData(a, m)), "2026-11-18")).toBe(17);
    // a reads more after syncing; the merge keeps the larger count of that device
    const a2 = recordVersesRead(m, "devaaaa1", "2026-11-18", 5);
    expect(versesReadOn(mergeUserData(a2, m), "2026-11-18")).toBe(22);
  });

  it("counts a streak ending today, or yesterday while today is still open", () => {
    let d = setDailyGoal(emptyUserData(), 10, T1);
    for (const day of ["2026-11-15", "2026-11-16", "2026-11-17"]) d = recordVersesRead(d, dev, day, 10);
    expect(goalStreak(d, "2026-11-18")).toBe(3);
    d = recordVersesRead(d, dev, "2026-11-18", 9);
    expect(goalStreak(d, "2026-11-18")).toBe(3);
    d = recordVersesRead(d, dev, "2026-11-18", 1);
    expect(goalStreak(d, "2026-11-18")).toBe(4);
    expect(goalStreak(d, "2026-11-20")).toBe(0);
    expect(goalStreak(setDailyGoal(d, 0, T2), "2026-11-18")).toBe(0);
  });

  it("crosses month and year boundaries in a streak", () => {
    let d = setDailyGoal(emptyUserData(), 1, T1);
    for (const day of ["2025-12-31", "2026-01-01"]) d = recordVersesRead(d, dev, day, 1);
    expect(goalStreak(d, "2026-01-01")).toBe(2);
  });

  it("adds up khatam progress from the progress marks", () => {
    let d = toggleReadUpTo(emptyUserData(), 1, 7, T1);
    d = toggleReadUpTo(d, 2, 100, T1);
    expect(versesReadInTotal(d)).toBe(107);
    expect(TOTAL_VERSES).toBe(6236);
  });

  it("round-trips, reads data without them, and rejects broken ones", () => {
    const d = recordVersesRead(setDailyGoal(emptyUserData(), 20, T1), dev, "2026-11-18", 4);
    expect(parseUserData(JSON.parse(JSON.stringify(d)))).toEqual(d);
    const old = parseUserData({ version: 2, lastRead: null, progress: {}, bookmarks: [] });
    expect([old.goal, old.activity]).toEqual([null, {}]);
    const raw = JSON.parse(JSON.stringify(d));
    expect(() => parseUserData({ ...raw, goal: { versesPerDay: -1, at: T1 } })).toThrow();
    expect(() => parseUserData({ ...raw, activity: { "2026-13": { [dev]: 1 } } })).toThrow();
    expect(() => parseUserData({ ...raw, activity: { "2026-11-18": { [dev]: 99999 } } })).toThrow();
  });

  it("keeps about four months of daily counts", () => {
    let d = recordVersesRead(emptyUserData(), dev, "2026-01-01", 3);
    d = recordVersesRead(d, dev, "2026-11-18", 3);
    expect(Object.keys(pruneTombstones(d, "2026-11-18T12:00:00.000Z").activity)).toEqual(["2026-11-18"]);
  });
});

describe("layout choice", () => {
  it("records, merges newest-first and validates", () => {
    const a = setLayoutChoice(emptyUserData(), "cards", T1);
    const b = setLayoutChoice(emptyUserData(), "mushaf", T2);
    expect(mergeUserData(a, b).choices.layout?.value).toBe("mushaf");
    expect(() => setLayoutChoice(emptyUserData(), "grid" as never, T1)).toThrow();
    const raw = JSON.parse(JSON.stringify(a));
    expect(parseUserData(raw)).toEqual(a);
    expect(() => parseUserData({ ...raw, choices: { layout: { value: "grid", at: T1 } } })).toThrow();
  });
});

describe("paging choice", () => {
  it("records, merges newest-first, keeps the other choices and validates", () => {
    const a = setPagingChoice(emptyUserData(), "mushaf", T1);
    const b = setPagingChoice(emptyUserData(), "verses", T2);
    expect(mergeUserData(a, b).choices.paging?.value).toBe("verses");
    expect(mergeUserData(b, a)).toEqual(mergeUserData(a, b));
    expect(setPagingChoice(setLayoutChoice(emptyUserData(), "cards", T1), "mushaf", T2).choices.layout?.value).toBe("cards");
    expect(() => setPagingChoice(emptyUserData(), "pages" as never, T1)).toThrow();
    const raw = JSON.parse(JSON.stringify(a));
    expect(parseUserData(raw)).toEqual(a);
    expect(() => parseUserData({ ...raw, choices: { paging: { value: "pages", at: T1 } } })).toThrow();
    expect(() => parseUserData({ ...raw, choices: { paging: { value: "mushaf", at: "yesterday" } } })).toThrow();
  });
});

describe("theme and text size choices", () => {
  it("record, merge newest-first and survive a round trip", () => {
    const a = setFontSizeChoice(setThemeChoice(emptyUserData(), "dark", T1), { arabic: 1.3, latin: 1 }, T1);
    const b = setFontSizeChoice(setThemeChoice(emptyUserData(), "auto", T2), { arabic: 0.85, latin: 1.5 }, T2);
    const merged = mergeUserData(a, b);
    expect(merged.choices.theme?.value).toBe("auto");
    expect(merged.choices.fontSize?.value).toEqual({ arabic: 0.85, latin: 1.5 });
    expect(mergeUserData(b, a)).toEqual(merged);
    expect(parseUserData(JSON.parse(JSON.stringify(a)))).toEqual(a);
  });

  it("refuse a theme or size that is not one of the steps", () => {
    expect(() => setThemeChoice(emptyUserData(), "sepia" as never, T1)).toThrow();
    expect(() => setFontSizeChoice(emptyUserData(), { arabic: 7, latin: 1 }, T1)).toThrow();
    const raw = JSON.parse(JSON.stringify(emptyUserData()));
    expect(() => parseUserData({ ...raw, choices: { theme: { value: "sepia", at: T1 } } })).toThrow();
    expect(() => parseUserData({ ...raw, choices: { fontSize: { value: { arabic: 1 }, at: T1 } } })).toThrow();
    expect(() => parseUserData({ ...raw, choices: { fontSize: { value: { arabic: 1, latin: 1 }, at: "yesterday" } } })).toThrow();
  });

  it("keep the other choices when only one changes", () => {
    const d = setThemeChoice(setLayoutChoice(emptyUserData(), "cards", T1), "light", T2);
    expect(d.choices.layout?.value).toBe("cards");
    expect(d.choices.theme).toEqual({ value: "light", at: T2 });
  });
});

describe("playback mode choice", () => {
  it("records, merges newest-first and survives a round trip", () => {
    const a = setPlaybackModeChoice(emptyUserData(), "repeat", T1);
    const b = setPlaybackModeChoice(emptyUserData(), "next", T2);
    expect(mergeUserData(a, b).choices.playbackMode?.value).toBe("next");
    expect(mergeUserData(b, a)).toEqual(mergeUserData(a, b));
    expect(parseUserData(JSON.parse(JSON.stringify(a)))).toEqual(a);
  });

  it("refuses a mode that does not exist", () => {
    expect(() => setPlaybackModeChoice(emptyUserData(), "loop" as never, T1)).toThrow();
    const raw = JSON.parse(JSON.stringify(emptyUserData()));
    expect(() => parseUserData({ ...raw, choices: { playbackMode: { value: "loop", at: T1 } } })).toThrow();
    expect(() => parseUserData({ ...raw, choices: { playbackMode: { value: "next", at: "yesterday" } } })).toThrow();
  });

  it("keeps the other choices when only the mode changes", () => {
    const d = setPlaybackModeChoice(setThemeChoice(emptyUserData(), "dark", T1), "next", T2);
    expect(d.choices.theme).toEqual({ value: "dark", at: T1 });
    expect(d.choices.playbackMode).toEqual({ value: "next", at: T2 });
  });
});

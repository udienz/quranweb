import { describe, expect, it } from "vitest";
import { getJuzScope, setJuzScope, setPendingStart, subscribeJuzScope, takePendingStart } from "./audio";
import { afterJuz, afterSurah, DEFAULT_PLAYBACK_MODE, isPlaybackMode, PLAYBACK_MODES, playbackUpdate } from "./playback";

describe("what follows the last verse of a surah", () => {
  it("stops by default, as before", () => {
    expect(DEFAULT_PLAYBACK_MODE).toBe("stop");
    expect(afterSurah("stop", 5)).toEqual({ kind: "stop" });
  });

  it("repeat starts the same surah from verse 1", () => {
    expect(afterSurah("repeat", 5)).toEqual({ kind: "start", surah: 5, verse: 1 });
    expect(afterSurah("repeat", 114)).toEqual({ kind: "start", surah: 114, verse: 1 });
  });

  it("next starts the following surah from verse 1, and stops after the last one", () => {
    expect(afterSurah("next", 1)).toEqual({ kind: "start", surah: 2, verse: 1 });
    expect(afterSurah("next", 113)).toEqual({ kind: "start", surah: 114, verse: 1 });
    expect(afterSurah("next", 114)).toEqual({ kind: "stop" });
  });

  it("knows its three modes and nothing else", () => {
    expect([...PLAYBACK_MODES]).toEqual(["stop", "repeat", "next"]);
    expect(PLAYBACK_MODES.every(isPlaybackMode)).toBe(true);
    expect(isPlaybackMode("loop")).toBe(false);
    expect(isPlaybackMode(undefined)).toBe(false);
  });
});

describe("what follows the last verse of a juz", () => {
  it("stops, repeats the juz, or goes on to the next one, which does not wrap after juz 30", () => {
    expect(afterJuz("stop", 5)).toEqual({ kind: "stop" });
    expect(afterJuz("repeat", 5)).toEqual({ kind: "start", juz: 5 });
    expect(afterJuz("repeat", 30)).toEqual({ kind: "start", juz: 30 });
    expect(afterJuz("next", 5)).toEqual({ kind: "start", juz: 6 });
    expect(afterJuz("next", 29)).toEqual({ kind: "start", juz: 30 });
    expect(afterJuz("next", 30)).toEqual({ kind: "stop" });
  });
});

describe("the mode from the account", () => {
  const at = "2026-11-18T00:00:00.000Z";
  it("only applies when it differs from this browser", () => {
    expect(playbackUpdate({}, "stop")).toBeNull();
    expect(playbackUpdate({ playbackMode: { value: "next", at } }, "next")).toBeNull();
    expect(playbackUpdate({ playbackMode: { value: "next", at } }, "stop")).toBe("next");
  });
});

describe("the verse playback is heading for", () => {
  it("is taken once, and only for the matching surah and verse", () => {
    setPendingStart({ surah: 2, verse: 1 });
    expect(takePendingStart(1, 1, 10)).toBeNull();
    expect(takePendingStart(2, 11, 20)).toBeNull();
    expect(takePendingStart(2, 1, 10)).toBe(1);
    expect(takePendingStart(2, 1, 10)).toBeNull();
  });

  it("can be a verse in the middle of the page that arrives (where a juz starts)", () => {
    setPendingStart({ surah: 2, verse: 142 });
    expect(takePendingStart(2, 131, 140)).toBeNull();
    expect(takePendingStart(3, 141, 150)).toBeNull();
    expect(takePendingStart(2, 141, 150)).toBe(142);
    expect(takePendingStart(2, 141, 150)).toBeNull();
  });
});

describe("the juz being played", () => {
  it("is remembered, cleared, and announced to whoever watches", () => {
    let calls = 0;
    const stop = subscribeJuzScope(() => calls++);
    setJuzScope(5);
    setJuzScope(5); // no change, no notice
    expect(getJuzScope()).toBe(5);
    setJuzScope(null);
    expect(getJuzScope()).toBeNull();
    expect(calls).toBe(2);
    stop();
    setJuzScope(7);
    expect(calls).toBe(2); // unsubscribed
    setJuzScope(null);
  });
});

import { afterVerseEnds } from "./playback";
import type { JuzRef } from "./quran/types";
import type { RangeLoop } from "./memorize";

describe("afterVerseEnds", () => {
  const juzs: JuzRef[] = [
    { juz: 1, start: { surah: 1, verse: 1 }, end: { surah: 2, verse: 141 } },
    { juz: 2, start: { surah: 2, verse: 142 }, end: { surah: 2, verse: 252 } },
    { juz: 3, start: { surah: 2, verse: 253 }, end: { surah: 3, verse: 92 } },
  ];
  type State = Parameters<typeof afterVerseEnds>[0];
  const base: State = { verse: { surah: 2, verse: 5, lastOnPage: false }, verseCount: 286, repeatsLeft: 0, loop: null, juzScope: null, juzs, mode: "stop" };
  const end = (over: Partial<Omit<State, "verse">> & { verse?: Partial<State["verse"]> }) =>
    afterVerseEnds({ ...base, ...over, verse: { ...base.verse, ...over.verse } });

  it("goes to the next verse of the page", () => {
    expect(end({})).toEqual({ kind: "nextOnPage" });
  });

  it("plays the same verse again while repeats are left, before anything else", () => {
    expect(end({ repeatsLeft: 2, verse: { lastOnPage: true } })).toEqual({ kind: "repeat" });
  });

  it("carries on with the next page of the surah after the last verse of a page", () => {
    expect(end({ verse: { verse: 10, lastOnPage: true } })).toEqual({ kind: "nextPage", surah: 2, verse: 11 });
  });

  it("at the end of a surah does what the reader chose", () => {
    const last = { surah: 2, verse: 286, lastOnPage: true };
    expect(end({ verse: last, mode: "stop" })).toEqual({ kind: "stop" });
    expect(end({ verse: last, mode: "repeat" })).toEqual({ kind: "startAt", surah: 2, verse: 1 });
    expect(end({ verse: last, mode: "next" })).toEqual({ kind: "startAt", surah: 3, verse: 1 });
    expect(end({ verse: { surah: 114, verse: 6, lastOnPage: true }, verseCount: 6, mode: "next" })).toEqual({ kind: "stop" });
  });

  it("does not take the end of a surah for the end of the page when the page goes on", () => {
    expect(end({ verse: { surah: 112, verse: 4, lastOnPage: false }, verseCount: 4, mode: "stop" })).toEqual({ kind: "nextOnPage" });
  });

  it("loops a range: the next round from its first verse, or the end", () => {
    const loop: RangeLoop = { surah: 2, from: 3, to: 5, times: 2, round: 1 };
    expect(end({ loop, verse: { verse: 4 } })).toEqual({ kind: "nextOnPage" });
    expect(end({ loop, verse: { verse: 5 } })).toEqual({ kind: "loopAgain", loop: { ...loop, round: 2 }, surah: 2, verse: 3 });
    expect(end({ loop: { ...loop, round: 2 }, verse: { verse: 5 } })).toEqual({ kind: "loopEnd" });
    expect(end({ loop: { ...loop, times: 0, round: 99 }, verse: { verse: 5 } })).toMatchObject({ kind: "loopAgain" });
    // A loop of another surah does not apply.
    expect(end({ loop: { ...loop, surah: 3 }, verse: { verse: 5 } })).toEqual({ kind: "nextOnPage" });
  });

  it("a juz goes on across the end of a surah, and at its own end follows the reader's choice", () => {
    const inJuz = { juzScope: 1 };
    expect(end({ ...inJuz, verse: { surah: 1, verse: 7, lastOnPage: true }, verseCount: 7, mode: "stop" })).toEqual({ kind: "goTo", surah: 2, verse: 1 });
    const last = { surah: 2, verse: 141, lastOnPage: true };
    expect(end({ ...inJuz, verse: last, mode: "stop" })).toEqual({ kind: "juzEnd" });
    expect(end({ ...inJuz, verse: last, mode: "repeat" })).toEqual({ kind: "juzNext", juz: juzs[0] });
    expect(end({ ...inJuz, verse: last, mode: "next" })).toEqual({ kind: "juzNext", juz: juzs[1] });
    expect(end({ juzScope: 3, verse: { surah: 3, verse: 92, lastOnPage: true }, verseCount: 200, mode: "next" })).toEqual({ kind: "juzEnd" });
  });

  it("the end of a juz wins over the next verse of the page", () => {
    expect(end({ juzScope: 1, verse: { surah: 2, verse: 141, lastOnPage: false }, mode: "stop" })).toEqual({ kind: "juzEnd" });
  });

  it("a juz that is not in the list is ignored", () => {
    expect(end({ juzScope: 9, verse: { verse: 10, lastOnPage: true } })).toEqual({ kind: "nextPage", surah: 2, verse: 11 });
  });
});

describe("takePendingStartAmong", () => {
  it("takes a pending start that is one of the verses of the page, of any of its surahs, and clears it", async () => {
    const { setPendingStart, takePendingStartAmong } = await import("./audio");
    const page = [{ surah: 111, verse: 4 }, { surah: 111, verse: 5 }, { surah: 112, verse: 1 }, { surah: 112, verse: 2 }];
    setPendingStart(null);
    expect(takePendingStartAmong(page)).toBeNull();
    setPendingStart({ surah: 113, verse: 1 });
    expect(takePendingStartAmong(page)).toBeNull();
    expect(takePendingStartAmong([{ surah: 113, verse: 1 }])).toBe(0);
    setPendingStart({ surah: 112, verse: 1 });
    expect(takePendingStartAmong(page)).toBe(2);
    expect(takePendingStartAmong(page)).toBeNull();
  });
});

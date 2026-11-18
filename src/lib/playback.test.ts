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

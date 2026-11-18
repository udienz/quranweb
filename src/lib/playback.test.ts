import { describe, expect, it } from "vitest";
import { setPendingStart, takePendingStart } from "./audio";
import { afterSurah, DEFAULT_PLAYBACK_MODE, isPlaybackMode, PLAYBACK_MODES, playbackUpdate } from "./playback";

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
    expect(takePendingStart(1, 1)).toBe(false);
    expect(takePendingStart(2, 11)).toBe(false);
    expect(takePendingStart(2, 1)).toBe(true);
    expect(takePendingStart(2, 1)).toBe(false);
  });
});

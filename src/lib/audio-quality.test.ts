import { describe, expect, it } from "vitest";
import { audioFor, isAudioQuality } from "./audio-quality";

describe("audioFor", () => {
  const verse = { audio: ["https://a/128.mp3", "https://a/64.mp3"], audioSaver: ["https://a/64.mp3", "https://a/128.mp3"] };
  it("plays the usual order in standard mode and the smallest file first in data-saver mode", () => {
    expect(audioFor(verse, "standard")).toEqual(verse.audio);
    expect(audioFor(verse, "saver")).toEqual(verse.audioSaver);
  });
  it("falls back to the usual order when the reciter has no smaller file", () => {
    expect(audioFor({ audio: ["https://a/64.mp3"] }, "saver")).toEqual(["https://a/64.mp3"]);
  });
});

describe("isAudioQuality", () => {
  it("accepts the two qualities and nothing else", () => {
    expect(isAudioQuality("standard")).toBe(true);
    expect(isAudioQuality("saver")).toBe(true);
    expect(isAudioQuality("low")).toBe(false);
    expect(isAudioQuality(null)).toBe(false);
  });
});

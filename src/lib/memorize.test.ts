import { describe, expect, it } from "vitest";
import { isVerseRepeat, makeRange, rangeStep } from "./memorize";

describe("makeRange", () => {
  it("orders the two verses and starts at round 1", () => {
    expect(makeRange(2, 286, 5, 1, 3)).toEqual({ surah: 2, from: 1, to: 5, times: 3, round: 1 });
  });
  it("allows a single verse and an endless loop", () => {
    expect(makeRange(1, 7, 4, 4, 0)).toEqual({ surah: 1, from: 4, to: 4, times: 0, round: 1 });
  });
  it("refuses verses outside the surah and bad numbers", () => {
    expect(makeRange(1, 7, 0, 3, 2)).toBeNull();
    expect(makeRange(1, 7, 3, 8, 2)).toBeNull();
    expect(makeRange(1, 7, 1.5, 3, 2)).toBeNull();
    expect(makeRange(1, 7, 1, 3, -1)).toBeNull();
  });
});

describe("rangeStep", () => {
  const loop = makeRange(2, 286, 1, 5, 3)!;
  it("lets the verses inside the range, and other surahs, go on as usual", () => {
    expect(rangeStep(loop, 2, 3)).toEqual({ kind: "continue" });
    expect(rangeStep(loop, 3, 5)).toEqual({ kind: "continue" });
  });
  it("goes back to the first verse after the last, counting rounds, and stops after the last round", () => {
    const second = rangeStep(loop, 2, 5);
    expect(second).toEqual({ kind: "again", loop: { ...loop, round: 2 } });
    const third = rangeStep((second as { loop: typeof loop }).loop, 2, 5);
    expect(third).toEqual({ kind: "again", loop: { ...loop, round: 3 } });
    expect(rangeStep({ ...loop, round: 3 }, 2, 5)).toEqual({ kind: "stop" });
  });
  it("never stops an endless loop", () => {
    expect(rangeStep({ ...loop, times: 0, round: 999 }, 2, 5)).toEqual({ kind: "again", loop: { ...loop, times: 0, round: 1000 } });
  });
});

describe("isVerseRepeat", () => {
  it("accepts the offered counts only", () => {
    expect([1, 2, 3, 5, 10].every(isVerseRepeat)).toBe(true);
    expect(isVerseRepeat(4)).toBe(false);
    expect(isVerseRepeat("2")).toBe(false);
  });
});

describe("isHideMode", () => {
  it("accepts the three modes only", async () => {
    const { isHideMode } = await import("./memorize");
    expect(["none", "arabic", "translation"].every(isHideMode)).toBe(true);
    expect(isHideMode("both")).toBe(false);
  });
});

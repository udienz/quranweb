import { describe, expect, it } from "vitest";
import { DEFAULT_FONT_SIZE, displayScript, displayUpdates, FONT_SCALES, isTheme, parseFontSize, stepFontScale } from "./display";

describe("display choices", () => {
  it("accepts only the known themes and size steps", () => {
    expect(["light", "dark", "auto"].every(isTheme)).toBe(true);
    expect(isTheme("sepia")).toBe(false);
    expect(parseFontSize({ arabic: 1.3, latin: 0.85 })).toEqual({ arabic: 1.3, latin: 0.85 });
    expect(parseFontSize({ arabic: 1.2, latin: 1 })).toBeNull();
    expect(parseFontSize({ arabic: 1 })).toBeNull();
    expect(parseFontSize("big")).toBeNull();
    expect(parseFontSize(null)).toBeNull();
  });

  it("steps the size up and down and stops at the ends", () => {
    expect(stepFontScale(1, 1)).toBe(1.15);
    expect(stepFontScale(1, -1)).toBe(0.85);
    expect(stepFontScale(FONT_SCALES[0], -1)).toBe(FONT_SCALES[0]);
    expect(stepFontScale(FONT_SCALES[FONT_SCALES.length - 1], 1)).toBe(FONT_SCALES[FONT_SCALES.length - 1]);
    expect(stepFontScale(42, 1)).toBe(1); // unknown: treated as the first step
  });

  it("only asks for what differs from this browser", () => {
    const local = { theme: "auto" as const, fontSize: DEFAULT_FONT_SIZE };
    expect(displayUpdates({}, local)).toEqual({});
    expect(displayUpdates({ theme: { value: "auto", at: "2026-11-18T00:00:00.000Z" } }, local)).toEqual({});
    expect(
      displayUpdates(
        { theme: { value: "dark", at: "2026-11-18T00:00:00.000Z" }, fontSize: { value: { arabic: 1.5, latin: 1 }, at: "2026-11-18T00:00:00.000Z" } },
        local,
      ),
    ).toEqual({ theme: "dark", fontSize: { arabic: 1.5, latin: 1 } });
  });

  it("the head script is valid JavaScript", () => {
    expect(() => new Function(displayScript)).not.toThrow();
  });
});

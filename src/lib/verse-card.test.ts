import { describe, expect, it } from "vitest";
import { CARD_MAX_HEIGHT, CARD_MIN_HEIGHT, CARD_WIDTH, layoutCard, wrapLines, type Measure } from "./verse-card";

// A stand-in for the canvas: every character is half as wide as the font size is high.
const measure: Measure = (text, _kind, size) => text.length * size * 0.5;
const input = (arabic: string, translation?: string) => ({
  arabic,
  translation: translation ? { text: translation, credit: "Yusuf Ali, via Tanzil", dir: "ltr" as const } : undefined,
  reference: "Qur'an 112:1 (Al-Ikhlas)",
  site: "quranweb.udienz.web.id",
});
const words = (n: number, w = "word") => Array.from({ length: n }, () => w).join(" ");

describe("wrapLines", () => {
  it("breaks at spaces so that no line is wider than the limit, and keeps every word", () => {
    const lines = wrapLines("one two three four five", 90, (l) => l.length * 10);
    expect(lines).toEqual(["one two", "three", "four five"]);
    expect(lines.join(" ")).toBe("one two three four five");
  });

  it("keeps a word wider than the line whole, and a paragraph break", () => {
    expect(wrapLines("abcdefghij", 30, (l) => l.length * 10)).toEqual(["abcdefghij"]);
    expect(wrapLines("a\n\nb", 100, (l) => l.length * 10)).toEqual(["a", "b"]);
  });
});

describe("layoutCard", () => {
  it("puts a short verse on the square card, and keeps the lines inside it, the foot at the bottom", () => {
    const layout = layoutCard(input("قل هو الله أحد", "Say: He is Allah, the One and Only"), measure);
    expect(layout.width).toBe(CARD_WIDTH);
    expect(layout.height).toBe(CARD_MIN_HEIGHT);
    expect(layout.arabic.size).toBe(68);
    const all = [...layout.arabic.baseline, layout.reference.baseline, ...(layout.translation?.baseline ?? []), layout.site.baseline];
    expect(all.every((y) => y > 0 && y <= layout.height)).toBe(true);
    expect(layout.site.baseline).toBeGreaterThan(Math.max(...layout.credit.baseline));
    expect(layout.trimmed).toBe(false);
  });

  it("orders the parts from the top: brand, Arabic, citation, translation, credit, address", () => {
    const l = layoutCard(input("قل هو الله أحد", "Say"), measure);
    expect(l.brand.baseline).toBeLessThan(l.arabic.baseline[0]);
    expect(l.arabic.baseline[l.arabic.baseline.length - 1]).toBeLessThan(l.reference.baseline);
    expect(l.reference.baseline).toBeLessThan(l.translation!.baseline[0]);
    expect(l.translation!.baseline[l.translation!.baseline.length - 1]).toBeLessThan(l.credit.baseline[0]);
  });

  it("makes the card taller, and the Arabic smaller, for a long verse, but never taller than the limit", () => {
    const layout = layoutCard(input(words(60), words(80)), measure);
    expect(layout.height).toBeGreaterThan(CARD_MIN_HEIGHT);
    expect(layout.height).toBeLessThanOrEqual(CARD_MAX_HEIGHT);
    expect(layout.arabic.size).toBeLessThan(68);
  });

  it("cuts the translation, and never the Arabic, when even the smallest size does not fit", () => {
    const arabic = words(400);
    const layout = layoutCard(input(arabic, words(500)), measure);
    expect(layout.height).toBeLessThanOrEqual(CARD_MAX_HEIGHT);
    expect(layout.arabic.lines.join(" ")).toBe(arabic);
    expect(layout.trimmed).toBe(true);
  });

  it("has no translation block when none is chosen", () => {
    expect(layoutCard(input("قل هو الله أحد"), measure).translation).toBeNull();
  });
});

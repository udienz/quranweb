import { describe, expect, it } from "vitest";
import { clampPage, PAGE_SIZE, pageCount, pageItems, pageOf, pageRange } from "./pagination";

describe("page arithmetic", () => {
  it("counts pages, with at least one", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(7)).toBe(1);
    expect(pageCount(PAGE_SIZE)).toBe(1);
    expect(pageCount(PAGE_SIZE + 1)).toBe(2);
    expect(pageCount(286)).toBe(29);
  });

  it("finds the page of a verse", () => {
    expect([1, 10, 11, 20, 21, 286].map((v) => pageOf(v))).toEqual([1, 1, 2, 2, 3, 29]);
  });

  it("gives the verses of a page and stops at the last verse", () => {
    expect(pageRange(1, 286)).toEqual({ from: 1, to: 10 });
    expect(pageRange(2, 286)).toEqual({ from: 11, to: 20 });
    expect(pageRange(29, 286)).toEqual({ from: 281, to: 286 });
    expect(pageRange(1, 7)).toEqual({ from: 1, to: 7 });
  });

  it("every verse is on exactly the page that pageOf says", () => {
    for (const total of [1, 7, 10, 11, 29, 83, 286]) {
      for (let verse = 1; verse <= total; verse++) {
        const { from, to } = pageRange(pageOf(verse), total);
        expect(verse >= from && verse <= to, `${verse}/${total}`).toBe(true);
      }
    }
  });
});

describe("clampPage", () => {
  it("accepts a valid page", () => {
    expect(clampPage("3", 286)).toBe(3);
    expect(clampPage(["4", "5"], 286)).toBe(4);
  });

  it("anything unusable is page 1", () => {
    for (const bad of [undefined, "", "abc", "0", "-3", "2.5", "NaN", " "]) expect(clampPage(bad, 286), String(bad)).toBe(1);
  });

  it("a page past the end is the last page", () => {
    expect(clampPage("999", 286)).toBe(29);
    expect(clampPage("2", 7)).toBe(1);
  });
});

describe("pageItems", () => {
  it("shows every page when there are few", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps the ends, the neighbours of the current page and gaps in between", () => {
    expect(pageItems(1, 29)).toEqual([1, 2, 3, 4, "gap", 29]);
    expect(pageItems(3, 29)).toEqual([1, 2, 3, 4, "gap", 29]);
    expect(pageItems(4, 29)).toEqual([1, 2, 3, 4, 5, "gap", 29]);
    expect(pageItems(5, 29)).toEqual([1, "gap", 4, 5, 6, "gap", 29]);
    expect(pageItems(15, 29)).toEqual([1, "gap", 14, 15, 16, "gap", 29]);
    expect(pageItems(27, 29)).toEqual([1, "gap", 26, 27, 28, 29]);
    expect(pageItems(29, 29)).toEqual([1, "gap", 26, 27, 28, 29]);
    expect(pageItems(1, 8)).toEqual([1, 2, 3, 4, "gap", 8]);
  });

  it("a gap never hides a single page", () => {
    expect(pageItems(6, 29)).toEqual([1, "gap", 5, 6, 7, "gap", 29]);
    expect(pageItems(4, 9)).toEqual([1, 2, 3, 4, 5, "gap", 9]);
  });

  it("always has the first page, the last page and the current page, in order and without repeats", () => {
    for (let total = 1; total <= 40; total++) {
      for (let current = 1; current <= total; current++) {
        const items = pageItems(current, total);
        const pages = items.filter((i): i is number => i !== "gap");
        expect(pages, `${current}/${total}`).toEqual([...new Set(pages)].sort((a, b) => a - b));
        expect(pages).toContain(1);
        expect(pages).toContain(total);
        expect(pages).toContain(current);
        // a gap stands between two pages that are at least two apart
        items.forEach((item, i) => {
          if (item === "gap") expect((items[i + 1] as number) - (items[i - 1] as number)).toBeGreaterThan(2);
        });
      }
    }
  });
});

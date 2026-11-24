import { afterEach, describe, expect, it, vi } from "vitest";
import { createQulProvider } from "./qul";

const BASE = "https://qul.test/copy";
function mockFetch(routes: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL | Request) => {
      const data = routes[String(url)];
      return data === undefined ? new Response("", { status: 404 }) : new Response(JSON.stringify(data));
    }),
  );
}
afterEach(() => vi.unstubAllGlobals());

describe("QUL provider", () => {
  it("has nothing to give without a copy", () => {
    const provider = createQulProvider();
    expect(provider.editions()).toEqual([]);
    expect(provider.tajweed).toBeUndefined();
    expect(provider.rukus).toBeUndefined();
  });

  it("reads the tajweed runs of a surah and the rukus", async () => {
    mockFetch({
      [`${BASE}/tajweed/112.json`]: { surah: 112, verses: [{ verse: 1, runs: [["قُلۡ "], ["هُوَ", "ghunnah"]] }, { verse: 2, runs: [["ٱ", "ham_wasl"], ["للَّهُ"]] }] },
      [`${BASE}/ruku.json`]: { count: 1, references: [{ ruku: 1, start: { chapter: 1, verse: 1 }, end: { chapter: 1, verse: 7 } }] },
    });
    const provider = createQulProvider({ baseUrl: `${BASE}/` });
    expect(await provider.tajweed!(112)).toEqual([[["قُلۡ "], ["هُوَ", "ghunnah"]], [["ٱ", "ham_wasl"], ["للَّهُ"]]]);
    expect(await provider.rukus!()).toEqual([{ ruku: 1, start: { surah: 1, verse: 1 }, end: { surah: 1, verse: 7 } }]);
  });

  it("refuses a tajweed file of another surah, with a verse missing, or with a run that is not text", async () => {
    mockFetch({
      [`${BASE}/tajweed/1.json`]: { surah: 2, verses: [] },
      [`${BASE}/tajweed/2.json`]: { surah: 2, verses: [{ verse: 2, runs: [["x"]] }] },
      [`${BASE}/tajweed/3.json`]: { surah: 3, verses: [{ verse: 1, runs: [["x", 1]] }] },
    });
    const provider = createQulProvider({ baseUrl: BASE });
    for (const surah of [1, 2, 3]) await expect(provider.tajweed!(surah)).rejects.toThrow(/unexpected format/);
  });
});

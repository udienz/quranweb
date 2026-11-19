import { describe, expect, it } from "vitest";
import type { Qari } from "./types";
import { BEST_KNOWN_RECITERS, matchesReciter, orderReciters } from "./reciter-order";

const source = { name: "test", url: "https://example.test" } as Qari["source"];
const qari = (id: string, name: string, arabicName?: string): Qari => ({ id, name, arabicName, source });

describe("orderReciters", () => {
  it("puts the best known reciters first in their fixed order, then the others by name", () => {
    const { bestKnown, others } = orderReciters([
      qari("zz", "Zaid"),
      qari("abdurrahman-as-sudais", "Abdurrahman As-Sudais"),
      qari("aa", "Ahmad"),
      qari("misyari-rasyid-al-afasi", "Misyari Rasyid Al-Afasi"),
    ]);
    expect(bestKnown.map((q) => q.id)).toEqual(["misyari-rasyid-al-afasi", "abdurrahman-as-sudais"]);
    expect(others.map((q) => q.id)).toEqual(["aa", "zz"]);
  });

  it("starts with Misyari Rasyid Al-Afasi", () => {
    expect(BEST_KNOWN_RECITERS[0]).toBe("misyari-rasyid-al-afasi");
  });
});

describe("matchesReciter", () => {
  const husary = qari("h", "Mahmoud Khalil Al-Husary", "محمود خليل الحصري");
  it("matches every word, ignoring case, hyphens and diacritics", () => {
    expect(matchesReciter(husary, "")).toBe(true);
    expect(matchesReciter(husary, "husary")).toBe(true);
    expect(matchesReciter(husary, "khalil alhusary")).toBe(true);
    expect(matchesReciter(qari("s", "Abdurrahman As-Sudais"), "súdais")).toBe(true);
    expect(matchesReciter(husary, "husary minshawi")).toBe(false);
  });

  it("matches the Arabic name, without harakat and with any form of alif", () => {
    expect(matchesReciter(husary, "الحصري")).toBe(true);
    expect(matchesReciter(qari("i", "Ibrahim", "إبراهيم"), "ابراهيم")).toBe(true);
    expect(matchesReciter(qari("i", "Ibrahim", "إبراهيم"), "إِبْرَاهِيم")).toBe(true);
  });
});

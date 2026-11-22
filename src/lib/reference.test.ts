import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseReference } from "./reference";

const surahs = (JSON.parse(readFileSync("e2e/fixtures/api/v2/surat.json", "utf8")).data as { nomor: number; namaLatin: string }[]).map((s) => ({
  number: s.nomor,
  name: { latin: s.namaLatin },
}));
const ref = (q: string) => parseReference(q, surahs);

describe("parseReference", () => {
  it("reads two numbers as a surah and a verse", () => {
    for (const q of ["2:255", "2 255", "2.255", "2/255", "  2 : 255 ", "QS 2:255", "QS. 2: 255", "Qur'an 2:255", "surah 2 ayat 255"]) expect(ref(q), q).toEqual({ surah: 2, verse: 255 });
    expect(ref("1:1")).toEqual({ surah: 1, verse: 1 });
    expect(ref("114:6")).toEqual({ surah: 114, verse: 6 });
  });

  it("reads a name and a verse number", () => {
    for (const q of ["baqarah 255", "Al-Baqarah 255", "al baqarah 255", "albaqarah:255", "QS. Al-Baqarah: 255", "QS Al-Baqarah no. 255", "Surat Al-Baqarah ayat 255"]) {
      expect(ref(q), q).toEqual({ surah: 2, verse: 255 });
    }
  });

  it("reads a name with its own numbers, and the form the share menu writes", () => {
    expect(ref("Al-Baqarah 2:255")).toEqual({ surah: 2, verse: 255 });
    expect(ref("Qur'an 2:255 (Al-Baqarah)")).toEqual({ surah: 2, verse: 255 });
    expect(ref("fatihah 7")).toEqual({ surah: 1, verse: 7 });
  });

  it("matches a name without its article, accents, apostrophes and hyphens", () => {
    expect(ref("ikhlas 1")).toEqual({ surah: 112, verse: 1 });
    expect(ref("Al-Ikhlas 4")).toEqual({ surah: 112, verse: 4 });
    expect(ref("imran 10")).toEqual({ surah: 3, verse: 10 });
    expect(ref("ali imran 10")).toEqual({ surah: 3, verse: 10 });
    expect(ref("nisa 3")).toEqual({ surah: 4, verse: 3 });
    expect(ref("an-nisa' 3")).toEqual({ surah: 4, verse: 3 });
  });

  it("leads to the surah when the verse is past its end", () => {
    expect(ref("2:287")).toEqual({ surah: 2, verse: null });
    expect(ref("1:8")).toEqual({ surah: 1, verse: null });
    expect(ref("baqarah 999")).toEqual({ surah: 2, verse: null });
    expect(ref("2:0")).toEqual({ surah: 2, verse: null });
  });

  it("is not a reference when there is no surah or no verse", () => {
    for (const q of ["", "  ", "255", "2", "baqarah", "al-fatihah", "115:1", "0:1", "xyz 5", "1 2 3", "12345 1", "2:255:3", "ab 5"]) expect(ref(q), q).toBeNull();
  });

  it("does not guess between two surahs that a short name could mean", () => {
    // "al" is shorter than three letters; "ma" too; a prefix that fits many surahs is refused.
    expect(ref("al 5")).toBeNull();
    expect(ref("ma 5")).toBeNull();
    expect(ref("ba 5")).toBeNull();
  });
});

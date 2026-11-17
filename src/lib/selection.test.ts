import { describe, expect, it } from "vitest";
import { parseSelectionCookie, serializeSelection } from "./selection";

describe("cookie pilihan", () => {
  it("bolak-balik", () => {
    const sel = { arabic: "ara-quranuthmanihaf", translations: ["ind-kemenag", "eng-abdullahyusufal"], tafsir: null, qari: "misyari-rasyid-al-afasi" };
    expect(parseSelectionCookie(serializeSelection(sel))).toEqual(sel);
  });

  it("kosong atau rusak menghasilkan objek kosong", () => {
    expect(parseSelectionCookie(undefined)).toEqual({});
    expect(parseSelectionCookie("")).toEqual({});
    expect(parseSelectionCookie("%E0%A4%A")).toEqual({});
    expect(parseSelectionCookie(encodeURIComponent("bukan json"))).toEqual({});
    expect(parseSelectionCookie(encodeURIComponent("[1,2]"))).toEqual({});
  });

  it("membuang nilai yang bukan ID edisi yang wajar", () => {
    const raw = encodeURIComponent(
      JSON.stringify({ arabic: "../../etc/passwd", qari: "Qari Besar", tafsir: 5, translations: ["ok-1", "<script>"], lain: "x" }),
    );
    expect(parseSelectionCookie(raw)).toEqual({});
  });

  it("menghapus duplikat terjemahan dan membatasi jumlahnya", () => {
    expect(parseSelectionCookie(serializeSelection({ translations: ["a-b", "a-b"] })).translations).toEqual(["a-b"]);
    const many = Array.from({ length: 9 }, (_, i) => `ed-${i}`);
    expect(parseSelectionCookie(serializeSelection({ translations: many })).translations).toBeUndefined();
  });

  it("transliterasi dan tafsir boleh null (dimatikan)", () => {
    expect(parseSelectionCookie(serializeSelection({ transliteration: null, tafsir: null }))).toEqual({ transliteration: null, tafsir: null });
  });
});

import { describe, expect, it } from "vitest";
import { parseSelectionCookie, serializeSelection } from "./selection";

describe("selection cookie", () => {
  it("round-trips", () => {
    const sel = { arabic: "ara-quranuthmanihaf", translations: ["ind-kemenag", "eng-abdullahyusufal"], tafsir: null, qari: "misyari-rasyid-al-afasi" };
    expect(parseSelectionCookie(serializeSelection(sel))).toEqual(sel);
  });

  it("an empty or broken value gives an empty object", () => {
    expect(parseSelectionCookie(undefined)).toEqual({});
    expect(parseSelectionCookie("")).toEqual({});
    expect(parseSelectionCookie("%E0%A4%A")).toEqual({});
    expect(parseSelectionCookie(encodeURIComponent("not json"))).toEqual({});
    expect(parseSelectionCookie(encodeURIComponent("[1,2]"))).toEqual({});
  });

  it("drops values that are not plausible edition IDs", () => {
    const raw = encodeURIComponent(
      JSON.stringify({ arabic: "../../etc/passwd", qari: "Big Qari", tafsir: 5, translations: ["ok-1", "<script>"], other: "x" }),
    );
    expect(parseSelectionCookie(raw)).toEqual({});
  });

  it("removes duplicate translations and limits their number", () => {
    expect(parseSelectionCookie(serializeSelection({ translations: ["a-b", "a-b"] })).translations).toEqual(["a-b"]);
    const many = Array.from({ length: 9 }, (_, i) => `ed-${i}`);
    expect(parseSelectionCookie(serializeSelection({ translations: many })).translations).toBeUndefined();
  });

  it("transliteration and tafsir may be null (switched off)", () => {
    expect(parseSelectionCookie(serializeSelection({ transliteration: null, tafsir: null }))).toEqual({ transliteration: null, tafsir: null });
  });
});

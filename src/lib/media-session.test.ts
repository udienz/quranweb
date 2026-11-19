import { describe, expect, it } from "vitest";
import { mediaMetadata } from "./media-session";

describe("mediaMetadata", () => {
  it("names the surah and verse, the reciter and the site", () => {
    expect(mediaMetadata({ surahName: "Al-Baqarah", surah: 2, verse: 255, reciter: "Misyari Rasyid Al-Afasi", site: "QuranWeb" })).toEqual({
      title: "Al-Baqarah 2:255",
      artist: "Misyari Rasyid Al-Afasi",
      album: "QuranWeb",
    });
  });
});

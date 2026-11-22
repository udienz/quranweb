import { describe, expect, it } from "vitest";
import { shareReference, shareText, shareUrl, whatsappHref } from "./share";

describe("shareReference", () => {
  it("writes QS. for Indonesian and the English form for every other language", () => {
    expect(shareReference("id", "Al-Baqarah", 2, 255)).toBe("QS. Al-Baqarah: 255");
    for (const locale of ["en", "ms", "ar", "ja", "tr"]) expect(shareReference(locale, "Al-Baqarah", 2, 255)).toBe("Qur'an 2:255 (Al-Baqarah)");
  });
});

describe("shareText", () => {
  it("has the Arabic, each translation, the citation in brackets and the address, in that order", () => {
    const text = shareText({ arabic: "ٱللَّهُ", translations: ["Allah", "God"], reference: "Qur'an 2:255 (Al-Baqarah)", url: "https://x.test/surah/2/255" });
    expect(text).toBe("ٱللَّهُ\n\nAllah\n\nGod\n\n(Qur'an 2:255 (Al-Baqarah))\n\nhttps://x.test/surah/2/255");
  });

  it("has no translation lines when none is chosen", () => {
    expect(shareText({ arabic: "a", translations: [], reference: "r", url: "u" })).toBe("a\n\n(r)\n\nu");
  });
});

describe("links", () => {
  it("shareUrl is the verse's own page", () => {
    expect(shareUrl("https://quranweb.udienz.web.id", 2, 255)).toBe("https://quranweb.udienz.web.id/surah/2/255");
  });

  it("whatsappHref encodes the whole text, so Arabic, new lines and ampersands survive", () => {
    const text = "ٱللَّهُ & co\n\n(r)";
    const href = whatsappHref(text);
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    expect(href).not.toMatch(/[\s&]/);
    expect(decodeURIComponent(href.slice("https://wa.me/?text=".length))).toBe(text);
  });
});

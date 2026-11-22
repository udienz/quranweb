import { describe, expect, it } from "vitest";
import { LOCALES } from "./i18n/config";
import { excerpt, isIndexed, ogLocale, OG_IMAGE, PRODUCTION_ORIGIN, robotsFor, shareMetadata } from "./site";
import { mushafEntries, sitemapEntries, verseEntries } from "./sitemap";

describe("isIndexed", () => {
  it("is true only for the production address", () => {
    expect(isIndexed("https://quranweb.udienz.web.id")).toBe(true);
    expect(isIndexed("https://quranweb-qa.udienz.web.id")).toBe(false);
    expect(isIndexed("http://localhost:3000")).toBe(false);
    expect(isIndexed("http://quranweb.udienz.web.id")).toBe(false);
    expect(isIndexed("https://quranweb.udienz.web.id.example.com")).toBe(false);
  });
});

describe("shareMetadata", () => {
  it("sets the canonical address and all of the preview data", () => {
    const m = shareMetadata({ title: "Al-Baqarah", description: "The Cow", path: "/surah/2", locale: "en" });
    expect(m.alternates?.canonical).toBe("/surah/2");
    expect(m.openGraph).toMatchObject({ title: "Al-Baqarah", description: "The Cow", url: "/surah/2", siteName: "QuranWeb", locale: "en_US" });
    expect(m.openGraph?.images).toEqual([OG_IMAGE]);
    expect(m.twitter).toMatchObject({ card: "summary_large_image", title: "Al-Baqarah", images: ["/og.png"] });
  });

  it("leaves out the canonical address for the layout", () => {
    expect(shareMetadata({ title: "x", path: "/", locale: "id", canonical: false }).alternates).toBeUndefined();
  });

  it("has an og:locale for every interface language", () => {
    for (const code of LOCALES) expect(ogLocale(code)).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
  });
});

describe("excerpt", () => {
  it("keeps a short text whole and cuts a long one at a word", () => {
    expect(excerpt("In the name of Allah")).toBe("In the name of Allah");
    const long = "word ".repeat(100);
    const cut = excerpt(long, 50);
    expect(cut.length).toBeLessThanOrEqual(51);
    expect(cut.endsWith("…")).toBe(true);
    expect(cut.slice(0, -1).trimEnd().endsWith("word")).toBe(true);
  });

  it("drops quotation marks at the ends and collapses whitespace", () => {
    expect(excerpt("  “Praise  be\nto Allah”  ")).toBe("Praise be to Allah");
  });
});

describe("sitemapEntries", () => {
  const numbers = Array.from({ length: 114 }, (_, i) => i + 1);
  const entries = sitemapEntries(PRODUCTION_ORIGIN, numbers);

  it("lists the home page, every surah, About and Privacy, each once", () => {
    const urls = entries.map((e) => e.url);
    expect(urls).toHaveLength(114 + 3);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain(`${PRODUCTION_ORIGIN}/`);
    expect(urls).toContain(`${PRODUCTION_ORIGIN}/surah/1`);
    expect(urls).toContain(`${PRODUCTION_ORIGIN}/surah/114`);
    expect(urls).toContain(`${PRODUCTION_ORIGIN}/about`);
    expect(urls).toContain(`${PRODUCTION_ORIGIN}/privacy`);
  });

  it("lists no page of a surah and none of the reader's own pages", () => {
    for (const { url } of entries) {
      expect(url).not.toContain("?");
      expect(url).not.toMatch(/\/(my-reading|settings|admin|api)(\/|$)/);
    }
  });
});

describe("verseEntries", () => {
  it("lists every verse of every surah once, as /surah/N/V", () => {
    const entries = verseEntries(PRODUCTION_ORIGIN, [{ number: 1, verseCount: 7 }, { number: 112, verseCount: 4 }]);
    expect(entries.map((e) => e.url)).toEqual([
      ...[1, 2, 3, 4, 5, 6, 7].map((v) => `${PRODUCTION_ORIGIN}/surah/1/${v}`),
      ...[1, 2, 3, 4].map((v) => `${PRODUCTION_ORIGIN}/surah/112/${v}`),
    ]);
  });
});

describe("mushafEntries", () => {
  it("lists the 604 pages once each", () => {
    const urls = mushafEntries(PRODUCTION_ORIGIN).map((e) => e.url);
    expect(urls).toHaveLength(604);
    expect(urls[0]).toBe(`${PRODUCTION_ORIGIN}/mushaf/1`);
    expect(urls[603]).toBe(`${PRODUCTION_ORIGIN}/mushaf/604`);
    expect(new Set(urls).size).toBe(604);
  });
});

describe("robotsFor", () => {
  it("lets crawlers into production, except the reader's own pages, and names the sitemap", () => {
    const r = robotsFor(PRODUCTION_ORIGIN);
    expect(r.rules).toEqual({ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/my-reading", "/search", "/settings"] });
    expect(r.sitemap).toEqual([`${PRODUCTION_ORIGIN}/sitemap/0.xml`, `${PRODUCTION_ORIGIN}/sitemap/1.xml`, `${PRODUCTION_ORIGIN}/sitemap/2.xml`]);
  });

  it("keeps crawlers out of QA and of a local copy", () => {
    for (const origin of ["https://quranweb-qa.udienz.web.id", "http://localhost:3000"]) {
      const r = robotsFor(origin);
      expect(r.rules).toEqual({ userAgent: "*", disallow: "/" });
      expect(r.sitemap).toBeUndefined();
    }
  });
});

import type { MetadataRoute } from "next";
import { getQuran } from "@/lib/quran";
import { mushafEntries, sitemapEntries, verseEntries } from "@/lib/sitemap";
import { siteOrigin } from "@/lib/site-origin";

/**
 * Sitemap 0 lists the home page, the surahs and the two information pages; sitemap 1 the page of every verse (6,236 of
 * them, and one file may hold 50,000); sitemap 2 the 604 pages of the mushaf. They are numbered, and listed by robots.ts, so that more files (the mushaf pages)
 * can be added without changing an address.
 */
export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }];
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const origin = await siteOrigin();
  const surahs = await getQuran().getSurahList();
  if (id === 2) return mushafEntries(origin);
  return id === 1 ? verseEntries(origin, surahs) : sitemapEntries(origin, surahs.map((s) => s.number));
}

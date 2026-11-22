import type { MetadataRoute } from "next";
import { getQuran } from "@/lib/quran";
import { sitemapEntries } from "@/lib/sitemap";
import { siteOrigin } from "@/lib/site-origin";

/**
 * Sitemap 0 lists the home page, the surahs and the two information pages. It is numbered, and listed by robots.ts, so
 * that more files (the pages of each verse, the mushaf pages) can be added without changing an address.
 */
export async function generateSitemaps() {
  return [{ id: 0 }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  const surahs = await getQuran().getSurahList();
  return sitemapEntries(origin, surahs.map((s) => s.number));
}

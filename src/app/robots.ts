import type { MetadataRoute } from "next";
import { robotsFor } from "@/lib/site";
import { siteOrigin } from "@/lib/site-origin";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return robotsFor(await siteOrigin());
}

// What the site says about itself to search engines and to link previews (WhatsApp, Telegram, X, Facebook): which address
// is the real one, which pages may be indexed, and the title, description and image a shared link shows. Pure functions;
// the address of the running site is read from the request in `site-origin.ts`.

import type { Metadata, MetadataRoute } from "next";
import type { Locale } from "./i18n/config";

export const SITE_NAME = "QuranWeb";

/** The only site that search engines may index. QA and local copies would compete with it as duplicates. */
export const PRODUCTION_ORIGIN = "https://quranweb.udienz.web.id";

/** The image link previews show for every page (public/og.png, 1200 by 630, drawn by scripts/og-image.mjs). */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: SITE_NAME };

export const isIndexed = (origin: string): boolean => origin === PRODUCTION_ORIGIN;

/** The pages with nothing for a search engine: the reader's own data, settings and the API. robots.ts keeps crawlers out. */
export const NOT_FOR_CRAWLERS = ["/api/", "/admin", "/my-reading", "/search", "/settings"] as const;

/** Production: everything may be crawled except the reader's own pages, with the sitemap. Anywhere else: nothing. */
export function robotsFor(origin: string): MetadataRoute.Robots {
  if (!isIndexed(origin)) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...NOT_FOR_CRAWLERS] },
    sitemap: [`${origin}/sitemap/0.xml`, `${origin}/sitemap/1.xml`, `${origin}/sitemap/2.xml`],
  };
}

/** `og:locale` for each interface language (language and territory, as Open Graph wants them). */
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US", id: "id_ID", tr: "tr_TR", ms: "ms_MY", bn: "bn_BD", fr: "fr_FR", ru: "ru_RU", ur: "ur_PK", ar: "ar_AR",
  fa: "fa_IR", es: "es_ES", bs: "bs_BA", zh: "zh_CN", th: "th_TH", uz: "uz_UZ", ta: "ta_IN", ml: "ml_IN", de: "de_DE",
  pt: "pt_BR", it: "it_IT", hi: "hi_IN", sw: "sw_KE", ha: "ha_NG", ja: "ja_JP", vi: "vi_VN",
};
export const ogLocale = (locale: Locale): string => OG_LOCALE[locale];

/**
 * Metadata for a page that may be shared: its own address as the canonical one, and the title, description and image that
 * link previews show. Next.js replaces the layout's `openGraph` object instead of merging it, so every page sets all of
 * it here.
 */
export function shareMetadata(input: {
  title: string;
  description?: string;
  /** The page's own address, without the origin ("/surah/2"). */
  path: string;
  locale: Locale;
  type?: "website" | "article";
  /** False for the layout: a page without metadata of its own would inherit the home page as its canonical address. */
  canonical?: boolean;
}): Metadata {
  const { title, description, path, locale, type = "website", canonical = true } = input;
  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical: path } } : {}),
    openGraph: { title, description, url: path, siteName: SITE_NAME, type, locale: ogLocale(locale), images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

/** A short plain-text excerpt for a description: whole words, at most `max` characters. */
export function excerpt(text: string, max = 180): string {
  // Quotation marks at the ends would be left unmatched by the cut: a description does not need them.
  const flat = text.replace(/\s+/g, " ").trim().replace(/^["“”'‘’]+|["“”'‘’]+$/g, "").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd()}…`;
}

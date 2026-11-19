import type { MetadataRoute } from "next";
import { getI18n } from "@/lib/i18n/server";

/**
 * The web app manifest: lets the site be installed on a phone or computer (its own icon and window). It is per request,
 * in the reader's language (the browser sends Accept-Language with it; cookies only when the browser chooses to).
 * Nothing works offline yet: there is no service worker (roadmap issue #46, a later step).
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { locale, t } = await getI18n();
  return {
    name: t("meta.title"),
    short_name: t("meta.title"),
    description: t("meta.description"),
    lang: locale,
    start_url: "/",
    scope: "/",
    display: "standalone",
    // The light theme's background (the splash screen) and primary colour (the logo's background).
    background_color: "#f5f2eb",
    theme_color: "#176c7d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

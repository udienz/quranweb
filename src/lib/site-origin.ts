// The public address of the running site, for canonical links, link previews, robots.txt and the sitemap. Server only.

import { headers } from "next/headers";

/**
 * "https://quranweb.udienz.web.id", from `SITE_URL`, else `BETTER_AUTH_URL` (the same public address, set on both servers
 * for sign-in), else the request: nginx passes the Host of its own server_name. An address that is none of these (a local
 * run, or a server that did not pass the Host) is not the production one, so such a copy is not indexed.
 */
export async function siteOrigin(): Promise<string> {
  const configured = (process.env.SITE_URL ?? process.env.BETTER_AUTH_URL)?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const local = /^(localhost|127\.|\[::1\])/.test(host);
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}

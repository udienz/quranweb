import { NextResponse, type NextRequest } from "next/server";
import { surahFromSegment } from "@/lib/surah-number";

/**
 * `/surah/<not a surah>` answers 404. The page shows the not-found page itself, but by then the response has started
 * streaming with status 200 (Cache Components cannot use `dynamicParams = false`), so search engines and link checkers
 * saw a normal page. Here the address is checked before rendering and rewritten to a path that does not exist, which
 * Next.js answers with the translated not-found page and status 404.
 */
export function proxy(request: NextRequest) {
  const segment = decodeURIComponent(request.nextUrl.pathname.split("/")[2] ?? "");
  if (surahFromSegment(segment) !== null) return NextResponse.next();
  return NextResponse.rewrite(new URL("/__not-a-surah", request.url));
}

export const config = { matcher: "/surah/:number" };

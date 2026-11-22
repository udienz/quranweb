import { NextResponse, type NextRequest } from "next/server";
import { mushafPageFromSegment, surahFromSegment, verseFromSegment } from "@/lib/surah-number";

/**
 * `/surah/<not a surah>`, `/surah/<surah>/<not a verse of it>` and `/mushaf/<not a page>` answer 404. The page shows the
 * not-found page itself, but by then the response has started streaming with status 200 (Cache Components cannot use
 * `dynamicParams = false`), so search engines and link checkers saw a normal page. Here the address is checked before
 * rendering and rewritten to a path that does not exist, which Next.js answers with the translated not-found page and status 404.
 *
 * The segment after a surah is a verse number. The 10-verse pages of the mushaf-page plan (`/surah/2/page/3`) will need their own
 * case here.
 */
export function proxy(request: NextRequest) {
  const [, area, first = "", second] = request.nextUrl.pathname.split("/").map(decodeURIComponent);
  if (area === "mushaf") {
    return mushafPageFromSegment(first) !== null && second === undefined ? NextResponse.next() : NextResponse.rewrite(new URL("/__not-a-surah", request.url));
  }
  const surah = surahFromSegment(first);
  if (surah !== null && (second === undefined || verseFromSegment(surah, second) !== null)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/__not-a-surah", request.url));
}

export const config = { matcher: ["/surah/:number", "/surah/:number/:verse", "/mushaf/:page"] };

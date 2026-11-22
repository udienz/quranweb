import { NextResponse, type NextRequest } from "next/server";
import { surahFromSegment, verseFromSegment } from "@/lib/surah-number";

/**
 * `/surah/<not a surah>` and `/surah/<surah>/<not a verse of it>` answer 404. The page shows the not-found page itself, but
 * by then the response has started streaming with status 200 (Cache Components cannot use `dynamicParams = false`), so
 * search engines and link checkers saw a normal page. Here the address is checked before rendering and rewritten to a path
 * that does not exist, which Next.js answers with the translated not-found page and status 404.
 *
 * The segment after the surah is a verse number. The mushaf pages (`/surah/2/page/3`, planned) will need their own case here.
 */
export function proxy(request: NextRequest) {
  const [, , surahSegment = "", verseSegment] = request.nextUrl.pathname.split("/").map(decodeURIComponent);
  const surah = surahFromSegment(surahSegment);
  if (surah !== null && (verseSegment === undefined || verseFromSegment(surah, verseSegment) !== null)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/__not-a-surah", request.url));
}

export const config = { matcher: ["/surah/:number", "/surah/:number/:verse"] };

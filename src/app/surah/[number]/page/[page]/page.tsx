import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SurahScreen, { surahMetadata } from "../../SurahScreen";

// Rendered per request, see the note in app/page.tsx.
export const instant = false;

/** The same preview as the surah itself: every page of it shares one canonical address, `/surah/N`. */
export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  return surahMetadata(params);
}

/** `/surah/2/page/3`: the third page of 10 verses. The proxy already answers 404 for a page that does not exist. */
export default async function SurahPageNumber({ params }: { params: Promise<{ number: string; page: string }> }) {
  const { number, page } = await params;
  if (!/^[1-9]\d*$/.test(page)) notFound();
  return <SurahScreen number={number} rawPage={page} legacy={false} />;
}

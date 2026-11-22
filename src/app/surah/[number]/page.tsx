import type { Metadata } from "next";
import SurahScreen, { surahMetadata } from "./SurahScreen";

// Rendered per request, see the note in app/page.tsx.
export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  return surahMetadata(params);
}

export default async function SurahPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  return <SurahScreen number={(await params).number} rawPage={(await searchParams).page} legacy />;
}

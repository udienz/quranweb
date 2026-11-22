"use client";

import { useEffect } from "react";
import { rememberClickedLink } from "@/lib/pending-verse";

/** Remembers the verse that a clicked link points to, for the mushaf page it may lead to (`lib/pending-verse.ts`). */
export default function KeepVerseInView() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      rememberClickedLink(link?.getAttribute("href") ?? null);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

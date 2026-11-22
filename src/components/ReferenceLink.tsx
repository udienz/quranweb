"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type KeyboardEvent } from "react";
import { verseHref } from "@/lib/anchors";
import { useI18n } from "@/lib/i18n/client";
import type { SurahMeta } from "@/lib/quran";
import { parseReference } from "@/lib/reference";

/** What a typed query leads to when it is a reference ("2:255", "baqarah 255"): the address and how to show it. */
export function useReference(query: string, surahs: SurahMeta[]): { href: string; label: string } | null {
  return useMemo(() => {
    const ref = parseReference(query, surahs);
    const meta = ref && surahs.find((s) => s.number === ref.surah);
    if (!ref || !meta) return null;
    return ref.verse === null
      ? { href: `/surah/${ref.surah}`, label: meta.name.latin }
      : { href: verseHref(ref.surah, ref.verse), label: `${meta.name.latin} ${ref.surah}:${ref.verse}` };
  }, [query, surahs]);
}

/** Enter in the search box opens the reference it spells out. */
export function useEnterToGo(target: { href: string } | null): (e: KeyboardEvent<HTMLInputElement>) => void {
  const router = useRouter();
  return (e) => {
    if (e.key === "Enter" && target) router.push(target.href);
  };
}

/** The link above the list: "Go to Al-Baqarah 2:255". */
export default function ReferenceLink({ target, className }: { target: { href: string; label: string }; className: string }) {
  const { t } = useI18n();
  return (
    <Link href={target.href} className={className}>
      {t("home.goTo", { reference: target.label })}
    </Link>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { SurahMeta } from "@/lib/quran";
import { meaningOf } from "@/lib/quran/labels";
import { searchSurahs } from "@/lib/surah-search";

/**
 * The home page's surah search box, with suggestions while you type. It searches all 114 surahs (the page lists six): by number,
 * by Latin name or part of it, by Arabic name, and last by the meaning of the name. A suggestion opens its surah. It is a combobox:
 * Arrow Down and Arrow Up move through the suggestions, Enter opens the highlighted one, Escape closes the list. A typed verse
 * ("2:255", "baqarah 255") still opens that verse on Enter, as before (`reference`).
 */
export default function SurahSearchBox({
  query,
  onQueryChange,
  surahs,
  reference,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  surahs: SurahMeta[];
  reference: { href: string; label: string } | null;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (surah: number) => `${id}-option-${surah}`;
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => searchSurahs(surahs, query, (s) => meaningOf(s, locale)), [surahs, query, locale]);
  // A typed verse has its own link above the list, so "no surah found" is not shown beside it.
  const showPanel = open && query.trim() !== "" && (results.length > 0 || !reference);
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));
  const activeSurah = showPanel ? results[activeIndex] : undefined;

  // A press outside the box closes the list (a tap on a suggestion is inside it).
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  // Moving with the arrow keys keeps the highlighted suggestion in view when the list scrolls.
  useEffect(() => {
    if (activeSurah) document.getElementById(optionId(activeSurah.number))?.scrollIntoView({ block: "nearest" });
    // optionId only depends on the id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSurah?.number]);

  function go(surah: SurahMeta) {
    setOpen(false);
    router.push(`/surah/${surah.number}`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (results.length === 0) return;
      e.preventDefault();
      if (!showPanel) {
        setOpen(true);
        setActive(0);
      } else setActive((activeIndex + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      if (!showPanel || results.length === 0) return;
      e.preventDefault();
      setActive((activeIndex - 1 + results.length) % results.length);
    } else if (e.key === "Escape") {
      // Without this a search field clears itself on Escape in some browsers.
      if (showPanel) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === "Enter") {
      if (reference) router.push(reference.href);
      else if (activeSurah) {
        e.preventDefault();
        go(activeSurah);
      }
    }
  }

  return (
    <div ref={root} className="relative w-full sm:w-72">
      <input
        type="search"
        // Arabic is typed from right to left whatever the page's direction.
        dir="auto"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={showPanel && results.length > 0 ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={activeSurah ? optionId(activeSurah.number) : undefined}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="go"
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t("home.searchPlaceholder")}
        aria-label={t("home.searchLabel")}
        className="home-editorial__surah-search w-full rounded-full border px-5 py-3 text-sm outline-none transition"
      />
      {showPanel && (
        <div className="home-editorial__suggest">
          {results.length > 0 ? (
            <ul id={listId} role="listbox" aria-label={t("home.listTitle")}>
              {results.map((s, i) => (
                <li
                  key={s.number}
                  id={optionId(s.number)}
                  role="option"
                  aria-selected={i === activeIndex}
                  className="home-editorial__suggest-option"
                  data-active={i === activeIndex ? "true" : undefined}
                  // Keep the focus in the box, so the list does not close before the click arrives.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(s)}
                >
                  <span className="home-editorial__suggest-number">{String(s.number).padStart(3, "0")}</span>
                  <span className="home-editorial__suggest-latin">{s.name.latin}</span>
                  <span className="home-editorial__suggest-arabic font-arabic" dir="rtl" lang="ar" translate="no">
                    {s.name.arabic}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="home-editorial__suggest-empty">
              {t("home.noResults")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { writeCookie } from "@/lib/cookies";
import { useI18n } from "@/lib/i18n/client";
import { SIDEBAR_COOKIE } from "@/lib/layout";


const ChevronIcon = ({ flip }: { flip: boolean }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={flip ? "rotate-180" : ""}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

/**
 * The surah page's two columns on wide screens: the side panel (surah list and reading settings) and the reader.
 * The panel can be collapsed so the reader, and the mushaf text in it, uses the whole width. Phones never show the
 * panel (they have the settings above the surah), so the button is for wide screens only.
 */
export default function SurahLayout({
  initiallyCollapsed,
  side,
  children,
}: {
  initiallyCollapsed: boolean;
  side: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    writeCookie(SIDEBAR_COOKIE, next ? "collapsed" : "open");
  }

  return (
    <div className={`mx-auto grid max-w-[1200px] gap-6 px-4 py-6 ${collapsed ? "" : "lg:grid-cols-[320px_1fr]"}`}>
      {!collapsed && <aside className="hidden lg:block">{side}</aside>}
      <div className="min-w-0">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          className="mb-3 hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground lg:inline-flex"
        >
          <ChevronIcon flip={collapsed} />
          {collapsed ? t("reader.showPanel") : t("reader.hidePanel")}
        </button>
        {children}
      </div>
    </div>
  );
}

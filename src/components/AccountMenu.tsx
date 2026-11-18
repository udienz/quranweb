"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { authClient, signIn } from "@/lib/auth/client";
import { useAccountSync } from "@/lib/sync/client";
import { useI18n } from "@/lib/i18n/client";
import { useDismiss } from "@/lib/useDismiss";

/** Names up to this length are shown as text on wide screens; longer ones (and every name on phones) become an icon. */
const SHORT_NAME = 18;

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

const item = "block w-full whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-background";

/**
 * The account button in the header and its dropdown: "My reading" (which lives here instead of the main navigation
 * when sign-in is on), and Sign in, or the reader's name and email with Sign out. Rendered only when sign-in is on.
 */
export default function AccountMenu() {
  const { t } = useI18n();
  const { data, isPending } = authClient.useSession();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const sync = useAccountSync(data?.user.id ?? null);
  const box = useRef<HTMLDivElement>(null);

  // Close on a click outside or on Escape.
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, box);

  async function start() {
    setFailed(false);
    const result = await signIn(search ? `${pathname}?${search}` : pathname);
    if (result.error) setFailed(true);
  }

  if (isPending) return <span className="h-8 w-16" aria-hidden />;

  const user = data?.user;
  const showName = !!user && user.name.length <= SHORT_NAME;

  return (
    <div ref={box} className="relative flex items-center gap-2 text-xs sm:text-sm">
      {sync === "error" && (
        <span role="status" title={t("account.syncFailed")} className="text-amber-600" aria-label={t("account.syncFailed")}>
          !
        </span>
      )}
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("account.menu")}
        title={user ? `${user.name} (${user.email})` : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-1 py-1 font-semibold hover:bg-background sm:pr-3"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-background text-muted-foreground">
          <PersonIcon />
        </span>
        {user ? (
          showName && <span className="hidden max-w-[10rem] truncate md:inline">{user.name}</span>
        ) : (
          <span className="hidden sm:inline">{t("account.signIn")}</span>
        )}
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="hidden sm:block">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-lg">
          {user && (
            <div className="mb-1 border-b border-border px-3 pb-2 pt-1">
              <p className="truncate font-semibold">{t("account.signedInAs", { name: user.name })}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
          <Link href="/my-reading" className={item} onClick={() => setOpen(false)}>
            {t("nav.myReading")}
          </Link>
          <Link href="/settings" className={item} onClick={() => setOpen(false)}>
            {t("nav.settings")}
          </Link>
          {user ? (
            <button
              type="button"
              className={item}
              onClick={() => {
                setOpen(false);
                authClient.signOut();
              }}
            >
              {t("account.signOut")}
            </button>
          ) : (
            <button type="button" className={item} onClick={start}>
              {t("account.signIn")}
            </button>
          )}
          {failed && (
            <p role="alert" className="px-3 py-1 text-xs text-red-600">
              {t("account.error")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

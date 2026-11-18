"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient, signIn } from "@/lib/auth/client";
import { useAccountSync } from "@/lib/sync/client";
import { useI18n } from "@/lib/i18n/client";

/** Names up to this length are shown as text; longer ones become an icon with the name in its tooltip. */
const SHORT_NAME = 18;

/** Sign-in button or the signed-in reader with a sign-out button. Rendered only when sign-in is on. */
export default function AccountMenu() {
  const { t } = useI18n();
  const { data, isPending } = authClient.useSession();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [failed, setFailed] = useState(false);
  const sync = useAccountSync(data?.user.id ?? null);

  async function start() {
    setFailed(false);
    const result = await signIn(search ? `${pathname}?${search}` : pathname);
    if (result.error) setFailed(true);
  }

  if (isPending) return <span className="h-8 w-16" aria-hidden />;

  if (!data) {
    return (
      <button
        type="button"
        onClick={start}
        title={failed ? t("account.error") : undefined}
        className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold sm:text-sm ${
          failed ? "border-red-500 text-red-600" : "border-border bg-card hover:bg-background"
        }`}
      >
        {t("account.signIn")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      {sync === "error" && (
        <span role="status" title={t("account.syncFailed")} className="text-amber-600" aria-label={t("account.syncFailed")}>
          !
        </span>
      )}
      {/* The name itself when it is short (wide screens); a person icon on phones and for long names.
          The full name and email are in the tooltip and, for screen readers, in the label. */}
      {data.user.name.length <= SHORT_NAME && (
        <span className="hidden font-medium md:inline" title={data.user.email}>
          {data.user.name}
        </span>
      )}
      <span
        role="img"
        aria-label={t("account.signedInAs", { name: data.user.name })}
        title={`${data.user.name} (${data.user.email})`}
        className={`grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground ${
          data.user.name.length <= SHORT_NAME ? "md:hidden" : ""
        }`}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      </span>
      <button
        type="button"
        onClick={() => authClient.signOut()}
        className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 font-semibold hover:bg-background"
      >
        {t("account.signOut")}
      </button>
    </div>
  );
}

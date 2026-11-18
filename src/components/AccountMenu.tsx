"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient, signIn } from "@/lib/auth/client";
import { useAccountSync } from "@/lib/sync/client";
import { useI18n } from "@/lib/i18n/client";

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
      <span className="hidden max-w-[10rem] truncate text-muted-foreground md:inline" title={data.user.email}>
        {t("account.signedInAs", { name: data.user.name })}
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

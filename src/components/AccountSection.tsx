"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useI18n } from "@/lib/i18n/client";
import { userDataSync } from "@/lib/userdata/store";

/** Download and delete for a signed-in reader. Rendered only when sign-in is on. */
export default function AccountSection() {
  const { t } = useI18n();
  const { data } = authClient.useSession();
  const [step, setStep] = useState<"idle" | "confirm" | "deleting" | "failed">("idle");

  if (!data) return null;

  async function remove() {
    setStep("deleting");
    try {
      const response = await fetch("/api/me", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "delete" }),
      });
      if (!response.ok) throw new Error(String(response.status));
      // The copy in this browser stays, and it no longer belongs to any account.
      userDataSync.clearOwner();
      window.location.reload();
    } catch {
      setStep("failed");
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card">
      <h2 className="border-b border-border px-5 py-3 font-display font-semibold">{t("account.section.title")}</h2>
      <div className="space-y-4 px-5 py-4 text-sm">
        <p>{t("account.section.details", { name: data.user.name, email: data.user.email })}</p>
        <p className="text-muted-foreground">{t("account.section.keeps")}</p>

        <div>
          <a
            href="/api/me/export"
            download
            className="inline-block rounded-full border border-border px-4 py-2 font-medium hover:bg-background"
          >
            {t("account.section.download")}
          </a>
          <p className="mt-1 text-muted-foreground">{t("account.section.downloadHint")}</p>
        </div>

        <div>
          {step === "idle" || step === "failed" ? (
            <button
              type="button"
              onClick={() => setStep("confirm")}
              className="rounded-full border border-red-500 px-4 py-2 font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              {t("account.section.delete")}
            </button>
          ) : (
            <div role="alertdialog" aria-label={t("account.section.delete")} className="rounded-xl border border-red-500 p-4">
              <p className="mb-3">{t("account.section.deleteWarning")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={step === "deleting"}
                  onClick={remove}
                  className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
                >
                  {step === "deleting" ? t("account.section.deleting") : t("account.section.deleteConfirm")}
                </button>
                <button
                  type="button"
                  disabled={step === "deleting"}
                  onClick={() => setStep("idle")}
                  className="rounded-full border border-border px-4 py-2 font-medium hover:bg-background"
                >
                  {t("account.section.cancel")}
                </button>
              </div>
            </div>
          )}
          {step === "failed" && (
            <p role="alert" className="mt-2 text-red-600">
              {t("account.section.deleteFailed")}
            </p>
          )}
        </div>

        <p>
          <Link href="/privacy" className="text-primary hover:underline">
            {t("account.section.privacy")}
          </Link>
        </p>
      </div>
    </section>
  );
}

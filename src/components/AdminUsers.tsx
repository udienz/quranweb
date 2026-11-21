"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { AdminAction, AdminUserRow, AuditRow } from "@/lib/admin/server";

/** Accounts and the audit log, for the admin. Account details only; no reading data is ever shown here. */
export default function AdminUsers({ users, audit, selfId }: { users: AdminUserRow[]; audit: AuditRow[]; selfId: string }) {
  const { t, date } = useI18n();
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function act(id: string, action: AdminAction) {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setConfirming(null);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const button = "rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-background disabled:opacity-60";

  return (
    <>
      {failed && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {t("admin.failed")}
        </p>
      )}
      <section className="mb-8 overflow-x-auto rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border px-5 py-3 font-display font-semibold">
          {t("admin.users", { count: users.length })}
        </h2>
        {users.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">{t("admin.empty")}</p>
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="px-5 py-2 font-medium">{t("admin.columns.account")}</th>
                <th className="px-3 py-2 font-medium">{t("admin.columns.created")}</th>
                <th className="px-3 py-2 font-medium">{t("admin.columns.lastSeen")}</th>
                <th className="px-3 py-2 font-medium">{t("admin.columns.status")}</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <span className="block font-medium">{u.name}</span>
                    <span className="block text-muted-foreground">{u.email}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{date(u.createdAt, { dateStyle: "medium" })}</td>
                  <td className="whitespace-nowrap px-3 py-3">{u.lastSeenAt ? date(u.lastSeenAt) : "-"}</td>
                  <td className="px-3 py-3">{u.disabledAt ? t("admin.status.disabled") : t("admin.status.active")}</td>
                  <td className="px-5 py-3">
                    {u.id === selfId ? (
                      <span className="text-xs text-muted-foreground">{t("admin.you")}</span>
                    ) : confirming === u.id ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-xs">{t("admin.deleteWarning")}</span>
                        <button type="button" disabled={busy} onClick={() => act(u.id, "delete")} className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
                          {t("admin.confirmDelete")}
                        </button>
                        <button type="button" disabled={busy} onClick={() => setConfirming(null)} className={button}>
                          {t("account.section.cancel")}
                        </button>
                      </span>
                    ) : (
                      <span className="flex gap-2">
                        <button type="button" disabled={busy} onClick={() => act(u.id, u.disabledAt ? "enable" : "disable")} className={button}>
                          {u.disabledAt ? t("admin.enable") : t("admin.disable")}
                        </button>
                        <button type="button" disabled={busy} onClick={() => setConfirming(u.id)} className={`${button} text-red-600`}>
                          {t("admin.delete")}
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border px-5 py-3 font-display font-semibold">{t("admin.audit.title")}</h2>
        {audit.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">{t("admin.audit.empty")}</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {audit.map((a) => (
              <li key={a.id} className="px-5 py-2">
                <span className="text-muted-foreground">{date(a.at)}</span> {a.actorEmail}: {t(`admin.audit.actions.${a.action}`)}{" "}
                <span className="text-muted-foreground">{a.targetUserId}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

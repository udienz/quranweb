import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import AdminUsers from "@/components/AdminUsers";
import { isAdminEmail } from "@/lib/admin/config";
import { listAudit, listUsers } from "@/lib/admin/server";
import { getAuth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t("admin.title")} | ${t("meta.title")}`, robots: { index: false, follow: false } };
}

// Per request: it reads the session and the database.
export const instant = false;

export default async function AdminPage() {
  const auth = getAuth();
  if (!auth) notFound();
  const session = await auth.api.getSession({ headers: await headers() });
  // Anyone who is not an admin sees the same page as for an address that does not exist.
  if (!session || !isAdminEmail(session.user.email, session.user.emailVerified)) notFound();

  const { t } = await getI18n();
  const db = getDatabase();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-semibold">{t("admin.title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("admin.subtitle")}</p>
      <AdminUsers users={listUsers(db)} audit={listAudit(db)} selfId={session.user.id} />
    </div>
  );
}

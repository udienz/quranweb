import type { Database } from "../db";
import { readAccountData } from "../sync/server";
import type { UserData } from "../userdata/schema";

export interface AccountExport {
  app: "quranweb";
  /** Same envelope as the backup file of the My reading page, so the file can be imported there. */
  format: 1;
  exportedAt: string;
  account: { email: string; name: string; createdAt: string };
  data: UserData;
}

/** Everything the site holds about the reader: the account details and the reading data. */
export function exportAccount(
  db: Database,
  user: { id: string; email: string; name: string; createdAt: Date },
  now = new Date(),
): AccountExport {
  return {
    app: "quranweb",
    format: 1,
    exportedAt: now.toISOString(),
    account: { email: user.email, name: user.name, createdAt: new Date(user.createdAt).toISOString() },
    data: readAccountData(db, user.id),
  };
}

/** Delete the account at once and for good: the user row and, by cascade, its sessions, sign-in links and reading data. */
export function deleteAccount(db: Database, userId: string): void {
  db.prepare('DELETE FROM "user" WHERE id = ?').run(userId);
}

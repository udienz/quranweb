import { deleteAccount } from "../account/server";
import type { Database } from "../db";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  lastSeenAt: number | null;
  disabledAt: number | null;
}

export interface AuditRow {
  id: number;
  at: number;
  actorEmail: string;
  action: AdminAction;
  targetUserId: string;
}

export type AdminAction = "disable" | "enable" | "delete";
export const ADMIN_ACTIONS: readonly AdminAction[] = ["disable", "enable", "delete"];

/** Rows from node:sqlite have a null prototype, which React refuses to pass to a client component; copy them into plain objects. */
const plain = <T extends object>(rows: unknown[]): T[] => rows.map((r) => ({ ...(r as object) }) as T);

/**
 * The accounts, newest first. Account details only: the admin never sees a reader's bookmarks, notes or
 * progress (they are not selected here), and nothing here can touch Qur'an content.
 */
export function listUsers(db: Database): AdminUserRow[] {
  return plain<AdminUserRow>(
    db
      .prepare(
        `SELECT id, email, name, CAST(strftime('%s', "createdAt") AS INTEGER) * 1000 AS createdAt,
                "lastSeenAt" AS lastSeenAt, "disabledAt" AS disabledAt
         FROM "user" ORDER BY "createdAt" DESC`,
      )
      .all(),
  );
}

export function listAudit(db: Database, limit = 50): AuditRow[] {
  return plain<AuditRow>(
    db
      .prepare(
        `SELECT id, at, actor_email AS actorEmail, action, target_user_id AS targetUserId
         FROM admin_audit ORDER BY id DESC LIMIT ?`,
      )
      .all(limit),
  );
}

/** Apply an admin action and record it, in one transaction. Returns false when the account does not exist. */
export function applyAdminAction(
  db: Database,
  actorEmail: string,
  action: AdminAction,
  targetUserId: string,
  now = Date.now(),
): boolean {
  db.exec("BEGIN IMMEDIATE");
  try {
    const exists = db.prepare('SELECT 1 AS x FROM "user" WHERE id = ?').get(targetUserId);
    if (!exists) {
      db.exec("ROLLBACK");
      return false;
    }
    if (action === "disable") {
      db.prepare('UPDATE "user" SET "disabledAt" = ? WHERE id = ?').run(now, targetUserId);
      // A disabled reader is signed out everywhere at once.
      db.prepare('DELETE FROM session WHERE "userId" = ?').run(targetUserId);
    } else if (action === "enable") {
      db.prepare('UPDATE "user" SET "disabledAt" = NULL WHERE id = ?').run(targetUserId);
    } else {
      deleteAccount(db, targetUserId);
    }
    db.prepare("INSERT INTO admin_audit (at, actor_email, action, target_user_id) VALUES (?, ?, ?, ?)").run(
      now,
      actorEmail,
      action,
      targetUserId,
    );
    db.exec("COMMIT");
    return true;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

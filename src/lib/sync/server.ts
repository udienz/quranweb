import type { Database } from "../db";
import { emptyUserData, mergeUserData, parseUserData, pruneTombstones, type UserData } from "../userdata/schema";

/** The biggest state allowed by the schema limits is about 3 MB (5,000 bookmarks with 500-character notes). */
export const MAX_BODY_BYTES = 4 * 1024 * 1024;

/** The stored data of an account (empty when nothing was stored yet). */
export function readAccountData(db: Database, userId: string): UserData {
  const row = db.prepare("SELECT data FROM account_data WHERE user_id = ?").get(userId) as { data: string } | undefined;
  if (!row) return emptyUserData();
  try {
    return parseUserData(JSON.parse(row.data));
  } catch {
    // Written only by this code after validation, so this means damage; never serve or extend it silently.
    throw new Error("The stored data of this account is not valid");
  }
}

/**
 * Merge what a device sends into the stored data, keep the result and return it. One transaction,
 * so two devices sending at the same moment cannot lose each other's changes.
 */
export function exchangeAccountData(db: Database, userId: string, incoming: UserData, now = new Date()): UserData {
  db.exec("BEGIN IMMEDIATE");
  try {
    const merged = pruneTombstones(mergeUserData(readAccountData(db, userId), incoming), now.toISOString());
    db.prepare(
      `INSERT INTO account_data (user_id, data, updated_at) VALUES (?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    ).run(userId, JSON.stringify(merged), now.getTime());
    db.exec("COMMIT");
    return merged;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

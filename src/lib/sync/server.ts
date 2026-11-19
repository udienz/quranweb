import type { Database } from "../db";
import { clampFutureTimes, emptyUserData, mergeUserData, parseUserData, pruneTombstones, type UserData } from "../userdata/schema";

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
    // Future change times from either side are brought back to now first: the device sent them, and a stored copy
    // may still hold some from before this check existed (it heals on the next exchange).
    const at = now.toISOString();
    const merged = pruneTombstones(
      mergeUserData(clampFutureTimes(readAccountData(db, userId), at), clampFutureTimes(incoming, at)),
      at,
    );
    // Each side is within the schema limits, but their union may not be (two devices with 3,000 bookmarks
    // each). readAccountData refuses a stored document over the limits, so storing it would lock the
    // account out of sync and export: check it here and throw (UserDataError), which rolls back.
    parseUserData(JSON.parse(JSON.stringify(merged)));
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

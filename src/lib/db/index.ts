import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS, type Migration } from "./migrations";

export type Database = DatabaseSync;

/** Applies every migration newer than the stored version, each in its own transaction. */
export function migrate(
  db: Database,
  migrations: readonly Migration[] = MIGRATIONS,
): number {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL, applied_at INTEGER NOT NULL)",
  );
  const row = db.prepare("SELECT MAX(version) AS v FROM schema_version").get() as {
    v: number | null;
  };
  const current = row.v ?? 0;

  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  sorted.forEach((m, i) => {
    if (m.version !== i + 1) {
      throw new Error(`Migrations must be numbered 1, 2, 3... without gaps (found ${m.version} at position ${i + 1})`);
    }
  });
  if (current > sorted.length) {
    throw new Error(
      `The database is at version ${current} but this build only knows ${sorted.length}: refusing to run an older build against a newer schema`,
    );
  }

  for (const m of sorted.filter((x) => x.version > current)) {
    db.exec("BEGIN");
    try {
      db.exec(m.sql);
      db.prepare("INSERT INTO schema_version (version, applied_at) VALUES (?, ?)").run(
        m.version,
        Date.now(),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw new Error(
        `Migration ${m.version} (${m.name}) failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return sorted.length;
}

/** Opens (creating it if needed) the database file with WAL and foreign keys, and migrates it. */
export function openDatabase(path: string): Database {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");
  try {
    migrate(db);
  } catch (error) {
    db.close();
    throw error;
  }
  return db;
}

let shared: Database | undefined;

/** The process-wide connection. Needs QURAN_DB_PATH; the app runs without accounts when it is unset. */
export function getDatabase(): Database {
  if (shared) return shared;
  const path = process.env.QURAN_DB_PATH;
  if (!path) throw new Error("QURAN_DB_PATH is not set: the database is not configured");
  shared = openDatabase(path);
  return shared;
}

export function databaseConfigured(): boolean {
  return Boolean(process.env.QURAN_DB_PATH);
}

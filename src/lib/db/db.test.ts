import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { migrate, openDatabase } from "./index";
import { MIGRATIONS } from "./migrations";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "qw-db-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const tables = (db: DatabaseSync) =>
  (db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map((r) => r.name);

describe("database", () => {
  it("creates the schema, in WAL mode with foreign keys", () => {
    const db = openDatabase(join(dir, "a.db"));
    expect(tables(db)).toEqual(expect.arrayContaining(["users", "bookmarks", "progress", "reading_state", "preferences", "audit_log", "schema_version"]));
    expect((db.prepare("PRAGMA journal_mode").get() as { journal_mode: string }).journal_mode).toBe("wal");
    expect((db.prepare("PRAGMA foreign_keys").get() as { foreign_keys: number }).foreign_keys).toBe(1);
    db.close();
  });

  it("is idempotent across restarts", () => {
    const path = join(dir, "a.db");
    openDatabase(path).close();
    const db = openDatabase(path);
    expect(db.prepare("SELECT COUNT(*) AS n FROM schema_version").get()).toEqual({ n: MIGRATIONS.length });
    db.close();
  });

  it("deletes a user's rows with the user", () => {
    const db = openDatabase(join(dir, "a.db"));
    db.prepare("INSERT INTO users (id, google_sub, email, created_at, last_seen_at) VALUES (1, 's', 'x@example.test', 0, 0)").run();
    db.prepare("INSERT INTO bookmarks (user_id, surah, verse, created_at, updated_at) VALUES (1, 2, 255, 0, 0)").run();
    db.prepare("DELETE FROM users WHERE id = 1").run();
    expect(db.prepare("SELECT COUNT(*) AS n FROM bookmarks").get()).toEqual({ n: 0 });
    db.close();
  });

  it("rolls a failed migration back completely and names it", () => {
    const db = new DatabaseSync(join(dir, "b.db"));
    const bad = [{ version: 1, name: "bad", sql: "CREATE TABLE t (a); CREATE TABLE t (a);" }];
    expect(() => migrate(db, bad)).toThrow(/Migration 1 \(bad\) failed/);
    expect(tables(db)).not.toContain("t");
    db.close();
  });

  it("applies only the newer migrations", () => {
    const db = new DatabaseSync(join(dir, "c.db"));
    migrate(db, [{ version: 1, name: "one", sql: "CREATE TABLE a (x)" }]);
    migrate(db, [
      { version: 1, name: "one", sql: "CREATE TABLE a (x)" },
      { version: 2, name: "two", sql: "CREATE TABLE b (x)" },
    ]);
    expect(tables(db)).toEqual(expect.arrayContaining(["a", "b"]));
    db.close();
  });

  it("runs an older build against a newer database (rollback) and leaves it untouched", () => {
    const db = new DatabaseSync(join(dir, "d.db"));
    migrate(db, [
      { version: 1, name: "one", sql: "CREATE TABLE a (x)" },
      { version: 2, name: "two", sql: "CREATE TABLE b (x)" },
    ]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => migrate(db, [{ version: 1, name: "one", sql: "CREATE TABLE a (x)" }])).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/continuing/));
    warn.mockRestore();
    expect(db.prepare("SELECT MAX(version) AS v FROM schema_version").get()).toEqual({ v: 2 });
    db.close();
  });

  it("rejects gaps in the numbering", () => {
    const db = new DatabaseSync(join(dir, "e.db"));
    expect(() => migrate(db, [{ version: 2, name: "two", sql: "SELECT 1" }])).toThrow(/without gaps/);
    db.close();
  });
});

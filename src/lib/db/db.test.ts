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
    expect(tables(db)).toEqual(expect.arrayContaining(["user", "session", "account", "account_data", "admin_audit", "schema_version"]));
    // Migration 5 dropped the unused tables of migration 1.
    for (const old of ["users", "reading_state", "progress", "bookmarks", "preferences", "audit_log"]) expect(tables(db)).not.toContain(old);
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

  it("drops the migration 1 tables only when they are empty, and keeps them (and everything else) otherwise", () => {
    const upTo4 = MIGRATIONS.filter((m) => m.version <= 4);
    for (const [name, insert] of [
      ["users", "INSERT INTO users (id, google_sub, email, created_at, last_seen_at) VALUES (1, 's', 'x@example.test', 0, 0)"],
      ["audit_log", "INSERT INTO audit_log (at, actor_email, action) VALUES (0, 'boss@example.test', 'x')"],
    ] as const) {
      const db = new DatabaseSync(join(dir, `${name}.db`));
      db.exec("PRAGMA foreign_keys = ON");
      migrate(db, upTo4);
      db.prepare(insert).run();
      expect(() => migrate(db, MIGRATIONS), name).toThrow(/Migration 5 \(drop-unused-v1-tables\) failed.*v1_tables_must_be_empty/);
      expect(tables(db)).toEqual(expect.arrayContaining(["users", "reading_state", "progress", "bookmarks", "preferences", "audit_log"]));
      expect(db.prepare(`SELECT COUNT(*) AS n FROM ${name}`).get()).toEqual({ n: 1 });
      expect(db.prepare("SELECT MAX(version) AS v FROM schema_version").get()).toEqual({ v: 4 });
      db.close();
    }
  });

  it("an image from before migration 5 still starts on a database it has run (the rollback)", () => {
    const path = join(dir, "r.db");
    openDatabase(path).close();
    const db = new DatabaseSync(path);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => migrate(db, MIGRATIONS.filter((m) => m.version <= 4))).not.toThrow();
    warn.mockRestore();
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

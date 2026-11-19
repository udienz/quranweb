// Database helper that runs with the Node of the app container (no sqlite3 CLI needed):
//   node - snapshot <db> <out>   < scripts/db-tool.mjs   consistent copy (VACUUM INTO) + integrity check
//   node - check <db>            < scripts/db-tool.mjs   integrity check + row counts
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";

const [command, a, b] = process.argv.slice(2);

function check(path) {
  const db = new DatabaseSync(path, { readOnly: true });
  const result = db.prepare("PRAGMA integrity_check").all();
  if (result.length !== 1 || result[0].integrity_check !== "ok") {
    throw new Error(`integrity check failed: ${JSON.stringify(result)}`);
  }
  const version = db.prepare("SELECT MAX(version) AS v FROM schema_version").get().v;
  // Row counts of the tables that hold readers' data, so a backup report shows at a glance that it is not empty. Only the
  // tables that exist are counted: the same tool must work on every schema version a rollback can meet. (Until 2026-11-19
  // it counted the never-used tables of migration 1, which were always 0, and migration 5 drops them.)
  const present = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name));
  const counts = {};
  for (const table of ["user", "session", "account_data", "admin_audit"]) {
    if (present.has(table)) counts[table] = db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get().n;
  }
  db.close();
  return { version, ...counts };
}

try {
  if (command === "snapshot") {
    if (!a || !b) throw new Error("usage: snapshot <db> <out>");
    if (existsSync(b)) throw new Error(`${b} already exists`);
    const db = new DatabaseSync(a);
    db.exec("PRAGMA busy_timeout = 5000");
    db.prepare("VACUUM INTO ?").run(b);
    db.close();
    console.log(JSON.stringify(check(b)));
  } else if (command === "check") {
    if (!a) throw new Error("usage: check <db>");
    console.log(JSON.stringify(check(a)));
  } else {
    throw new Error("usage: snapshot <db> <out> | check <db>");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

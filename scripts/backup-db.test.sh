#!/usr/bin/env bash
# Round trip of backup and restore with a real database, age and Node (no Docker needed):
#   scripts/backup-db.test.sh        (needs node 24+ and age; CI installs age)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

age-keygen -o "$work/key.txt" 2>/dev/null
age-keygen -y "$work/key.txt" > "$work/recipients.txt"

# A small database with the tables db-tool.mjs reads (the real migrations are tested by vitest).
node --input-type=module - "$work/live.db" <<'JS'
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(process.argv[2]);
db.exec("PRAGMA journal_mode = WAL");
db.exec(`CREATE TABLE schema_version (version INTEGER NOT NULL, applied_at INTEGER NOT NULL);
  INSERT INTO schema_version VALUES (1, 0);
  CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT);
  CREATE TABLE bookmarks (user_id INTEGER, surah INTEGER, verse INTEGER);
  CREATE TABLE progress (user_id INTEGER, surah INTEGER);
  INSERT INTO users VALUES (1, 'reader@example.test');
  INSERT INTO bookmarks VALUES (1, 2, 255);`);
db.close();
JS

export AGE_RECIPIENTS="$work/recipients.txt" BACKUP_DIR="$work/backups" RETENTION_DAYS=30
export DB_FILE="$work/live.db" SNAPSHOT_DIR="$work" RUN_IN_APP=env
bash "$here/backup-db.sh" qa | tee "$work/out.txt"
grep -q '"users":1' "$work/out.txt"

backup="$(ls "$work"/backups/quranweb-qa-*.db.age)"
# the file must be encrypted and the plaintext snapshot gone
if grep -q "SQLite format" "$backup"; then echo "backup is not encrypted" >&2; exit 1; fi
[ -z "$(ls -A "$work" | grep '^\.snapshot' || true)" ] || { echo "snapshot left behind" >&2; exit 1; }

bash "$here/restore-db.sh" "$backup" "$work/key.txt" "$work/restored.db" | tee "$work/restore.txt"
grep -q '"bookmarks":1' "$work/restore.txt"
if bash "$here/restore-db.sh" "$backup" "$work/key.txt" "$work/restored.db" 2>/dev/null; then
  echo "restore overwrote an existing file" >&2; exit 1
fi

# retention: an old file goes, a fresh one stays
touch -d '40 days ago' "$work/backups/quranweb-qa-20000101T000000Z.db.age"
bash "$here/backup-db.sh" qa >/dev/null
[ ! -e "$work/backups/quranweb-qa-20000101T000000Z.db.age" ] || { echo "old backup was kept" >&2; exit 1; }
# the upload hook runs and a failing one fails the run
UPLOAD_CMD="cp -t $work" bash "$here/backup-db.sh" qa >/dev/null
ls "$work"/quranweb-qa-*.db.age >/dev/null
if UPLOAD_CMD=false bash "$here/backup-db.sh" qa >/dev/null 2>&1; then echo "failed upload did not fail the run" >&2; exit 1; fi
echo "backup test OK"

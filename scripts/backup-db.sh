#!/usr/bin/env bash
# Encrypted backup of the account database. Run ON THE SERVER (by the systemd timer):
#   backup-db.sh <qa|prod>
# 1. a consistent snapshot is taken inside the running container (SQLite VACUUM INTO, so no
#    need to stop anything) and checked with PRAGMA integrity_check;
# 2. it is encrypted with age to the PUBLIC key in $AGE_RECIPIENTS (the private key is not on
#    the server, so a stolen server cannot read old backups);
# 3. the encrypted file goes to the local directory $BACKUP_DIR, and, when $UPLOAD_CMD is set,
#    that command is run with the file path as its argument to copy it off the server
#    (for example an rclone or aws s3 cp wrapper); a failing upload fails the run;
# 4. local files older than $RETENTION_DAYS (default 30) are deleted.
# Plaintext never touches the host disk: the snapshot stays in the database volume until it is
# encrypted, and is removed afterwards even on failure.
set -euo pipefail

ENVIRONMENT="${1:?usage: backup-db.sh <qa|prod>}"
case "$ENVIRONMENT" in qa|prod) ;; *) echo "environment must be qa or prod" >&2; exit 2 ;; esac

AGE_RECIPIENTS="${AGE_RECIPIENTS:-/etc/quranweb/backup-recipients.txt}"
BACKUP_DIR="${BACKUP_DIR:-/srv/quranweb-backups/$ENVIRONMENT}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_FILE="${DB_FILE:-/db/quranweb.db}"
SNAPSHOT_DIR="${SNAPSHOT_DIR:-/db}"
TOOL="${DB_TOOL:-$(dirname "$0")/db-tool.mjs}"
# Prefix that runs a command where the database is; tests replace it with `env`.
read -r -a RUN_IN_APP <<< "${RUN_IN_APP:-docker exec -i quranweb-$ENVIRONMENT}"

[ -s "$AGE_RECIPIENTS" ] || { echo "no age recipients in $AGE_RECIPIENTS" >&2; exit 2; }
command -v age >/dev/null || { echo "age is not installed" >&2; exit 2; }

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SNAPSHOT="$SNAPSHOT_DIR/.snapshot-$STAMP.db"
OUT="$BACKUP_DIR/quranweb-$ENVIRONMENT-$STAMP.db.age"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
umask 077

cleanup() {
  "${RUN_IN_APP[@]}" rm -f "$SNAPSHOT" 2>/dev/null || true
  rm -f "$OUT.part"
}
trap cleanup EXIT

SUMMARY="$("${RUN_IN_APP[@]}" node - snapshot "$DB_FILE" "$SNAPSHOT" < "$TOOL")"
"${RUN_IN_APP[@]}" cat "$SNAPSHOT" | age -R "$AGE_RECIPIENTS" -o "$OUT.part"
[ -s "$OUT.part" ] || { echo "the encrypted backup is empty" >&2; exit 1; }
mv "$OUT.part" "$OUT"

if [ -n "${UPLOAD_CMD:-}" ]; then
  $UPLOAD_CMD "$OUT"
fi

find "$BACKUP_DIR" -maxdepth 1 -name "quranweb-$ENVIRONMENT-*.db.age" -mtime "+$RETENTION_DAYS" -delete
echo "backup OK: $OUT $SUMMARY"

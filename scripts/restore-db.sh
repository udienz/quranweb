#!/usr/bin/env bash
# Decrypt a backup and check it. Used for the restore rehearsal and for a real restore:
#   restore-db.sh <backup.db.age> <age-identity-file> <target.db>
# It refuses to overwrite an existing file. For a real restore stop the container first, move
# the old database and its -wal/-shm files away, restore to /srv/quranweb-db/<env>/quranweb.db,
# fix the owner (uid 1001) and start the container.
set -euo pipefail

BACKUP="${1:?usage: restore-db.sh <backup.db.age> <age-identity-file> <target.db>}"
IDENTITY="${2:?usage: restore-db.sh <backup.db.age> <age-identity-file> <target.db>}"
TARGET="${3:?usage: restore-db.sh <backup.db.age> <age-identity-file> <target.db>}"
TOOL="${DB_TOOL:-$(dirname "$0")/db-tool.mjs}"
read -r -a RUN_NODE <<< "${RUN_NODE:-node}"

[ ! -e "$TARGET" ] || { echo "$TARGET already exists: not overwriting" >&2; exit 2; }
umask 077
age -d -i "$IDENTITY" -o "$TARGET.part" "$BACKUP"
if ! SUMMARY="$("${RUN_NODE[@]}" - check "$TARGET.part" < "$TOOL")"; then
  rm -f "$TARGET.part"
  echo "the decrypted backup failed the integrity check" >&2
  exit 1
fi
mv "$TARGET.part" "$TARGET"
echo "restore OK: $TARGET $SUMMARY"

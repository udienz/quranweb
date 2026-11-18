#!/usr/bin/env bash
# Copy one encrypted backup to a remote with rclone (for example Google Drive) and delete the remote copies that are
# older than RETENTION_DAYS. Used as UPLOAD_CMD of backup-db.sh:   upload-rclone.sh <quranweb-qa-STAMP.db.age>
#
#   RCLONE_CONFIG    rclone config file (default /etc/quranweb/rclone.conf)
#   RCLONE_REMOTE    remote and folder, e.g. gdrive:quranweb-backups (a plain directory also works; the tests use one)
#   RETENTION_DAYS   default 30
#   KEEP_MIN         never delete when fewer than this many files would remain (default 3), so a clock error or a
#                    long upload outage cannot wipe every copy
#
# The file lands in <remote>/<qa|prod>/, chosen from its name. A failing copy or a size mismatch fails the run.
set -euo pipefail

FILE="${1:?usage: upload-rclone.sh <backup.db.age>}"
RCLONE="${RCLONE:-rclone}"
export RCLONE_CONFIG="${RCLONE_CONFIG:-/etc/quranweb/rclone.conf}"
REMOTE="${RCLONE_REMOTE:?set RCLONE_REMOTE, for example gdrive:quranweb-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
KEEP_MIN="${KEEP_MIN:-3}"

name="$(basename "$FILE")"
case "$name" in
  quranweb-qa-*.db.age) env=qa ;;
  quranweb-prod-*.db.age) env=prod ;;
  *) echo "not a backup file name: $name" >&2; exit 2 ;;
esac
[ -s "$FILE" ] || { echo "$FILE is missing or empty" >&2; exit 2; }
dest="${REMOTE%/}/$env"

"$RCLONE" mkdir "$dest"
"$RCLONE" copyto "$FILE" "$dest/$name"

# Check that what arrived is as big as what was sent.
local_size="$(stat -c %s "$FILE")"
remote_size="$("$RCLONE" size --json "$dest/$name" | sed -E 's/.*"bytes": *([0-9]+).*/\1/')"
if [ "$remote_size" != "$local_size" ]; then
  echo "upload check failed: $name is $remote_size bytes on the remote, $local_size here" >&2
  exit 1
fi

# Retention. Only files of this environment with a backup name are considered.
pattern="quranweb-$env-*.db.age"
total="$("$RCLONE" lsf --files-only --include "$pattern" "$dest" | wc -l)"
old="$("$RCLONE" lsf --files-only --include "$pattern" --min-age "${RETENTION_DAYS}d" "$dest" | wc -l)"
if [ "$old" -gt 0 ]; then
  if [ $((total - old)) -lt "$KEEP_MIN" ]; then
    echo "not deleting $old old copies: fewer than $KEEP_MIN would remain" >&2
  else
    "$RCLONE" delete --include "$pattern" --min-age "${RETENTION_DAYS}d" "$dest"
  fi
fi
echo "uploaded $name to $dest ($local_size bytes)"

#!/usr/bin/env bash
# Mirror the local encrypted backups to a private git repository (off-server copy). Used as UPLOAD_CMD of
# backup-db.sh, which passes the new file; this script pushes the whole backup directory instead, so the
# repository always holds exactly what the server keeps (30 days, see backup-db.sh).
#
#   BACKUP_ROOT        local backups, one folder per environment (default /srv/quranweb-backups)
#   BACKUP_GIT_REMOTE  the repository, e.g. git@github.com:udienz/quranweb-backups.git (a local path works too)
#   BACKUP_GIT_KEY     SSH key with write access to that repository only (a deploy key; default /root/.ssh/quranweb-backup)
#   BACKUP_GIT_STATE   local clone kept between runs, so only new files are uploaded (default /var/lib/quranweb/backup-git)
#   KEEP_MIN           refuse to push fewer files than this while the remote has more (default 3), so a mistake
#                      on the server cannot wipe the off-server copy
#
# Each run pushes one commit with no parent and replaces the branch, so files older than 30 days leave the
# repository's history too (the host may keep unreachable data for a while before it collects it).
set -euo pipefail

ROOT="${BACKUP_ROOT:-/srv/quranweb-backups}"
REMOTE="${BACKUP_GIT_REMOTE:?set BACKUP_GIT_REMOTE}"
KEY="${BACKUP_GIT_KEY:-/root/.ssh/quranweb-backup}"
STATE="${BACKUP_GIT_STATE:-/var/lib/quranweb/backup-git}"
KEEP_MIN="${KEEP_MIN:-3}"
BRANCH=main

if [ -n "${1:-}" ]; then
  case "$(basename "$1")" in quranweb-*-*.db.age) ;; *) echo "not a backup file name: $1" >&2; exit 2 ;; esac
fi
if [[ "$REMOTE" == *@*:* || "$REMOTE" == ssh://* ]]; then
  export GIT_SSH_COMMAND="ssh -i $KEY -o IdentitiesOnly=yes -o BatchMode=yes"
fi
g() { git --git-dir="$STATE" "$@"; }

if [ ! -d "$STATE" ]; then
  mkdir -p "$(dirname "$STATE")"
  git init -q --bare "$STATE"
  g remote add origin "$REMOTE"
fi
# Knowing what the remote already has means only new files are sent.
g fetch -q origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH" 2>/dev/null || true
remote_count=0
if g rev-parse -q --verify "refs/remotes/origin/$BRANCH" >/dev/null; then
  remote_count="$(g ls-tree -r --name-only "refs/remotes/origin/$BRANCH" | grep -c '\.db\.age$' || true)"
fi

# Build the tree from the backup files only (one folder per environment).
export GIT_INDEX_FILE="$STATE/backup-index"
rm -f "$GIT_INDEX_FILE"
mapfile -t files < <(cd "$ROOT" && find . -mindepth 2 -maxdepth 2 -type f -name 'quranweb-*-*.db.age' | sed 's|^\./||' | sort)
count="${#files[@]}"
if [ "$count" -eq 0 ]; then echo "no backup files in $ROOT: nothing pushed" >&2; exit 1; fi
if [ "$count" -lt "$KEEP_MIN" ] && [ "$remote_count" -gt "$count" ]; then
  echo "only $count local backups but $remote_count on the remote: not replacing them" >&2; exit 1
fi
(cd "$ROOT" && g --work-tree="$ROOT" add -f -- "${files[@]}")
tree="$(g write-tree)"
commit="$(GIT_AUTHOR_NAME="quranweb backup" GIT_AUTHOR_EMAIL="backup@quranweb.invalid" \
  GIT_COMMITTER_NAME="quranweb backup" GIT_COMMITTER_EMAIL="backup@quranweb.invalid" \
  g commit-tree "$tree" -m "Encrypted backups as of $(date -u +%Y-%m-%dT%H:%MZ) ($count files)")"
g push -q --force origin "$commit:refs/heads/$BRANCH"

# Check that the remote now points at exactly this commit.
pushed="$(g ls-remote origin "refs/heads/$BRANCH" | cut -f1)"
[ "$pushed" = "$commit" ] || { echo "push check failed: remote has $pushed, expected $commit" >&2; exit 1; }
g update-ref "refs/remotes/origin/$BRANCH" "$commit"
g gc -q --prune=now 2>/dev/null || true
echo "pushed $count encrypted backups to $REMOTE ($commit)"

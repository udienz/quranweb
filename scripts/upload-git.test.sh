#!/usr/bin/env bash
# Tests of upload-git.sh with a local bare repository as the remote:   bash scripts/upload-git.test.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }
export BACKUP_ROOT="$work/backups" BACKUP_GIT_REMOTE="$work/remote.git" BACKUP_GIT_STATE="$work/state"
git init -q --bare "$BACKUP_GIT_REMOTE"
mkdir -p "$BACKUP_ROOT/qa" "$BACKUP_ROOT/prod"
mk() { printf 'age-encryption.org/v1 %s' "$1" > "$BACKUP_ROOT/$1"; }
up() { bash "$here/upload-git.sh" "$@"; }
remote_files() { git --git-dir="$BACKUP_GIT_REMOTE" ls-tree -r --name-only main | tr '\n' ' '; }
commits() { git --git-dir="$BACKUP_GIT_REMOTE" rev-list --count main; }

mk qa/quranweb-qa-20261101T000000Z.db.age; mk qa/quranweb-qa-20261102T000000Z.db.age; mk prod/quranweb-prod-20261102T000000Z.db.age
printf 'x' > "$BACKUP_ROOT/qa/notes.txt"; printf 'x' > "$BACKUP_ROOT/stray.db.age"
up "$BACKUP_ROOT/qa/quranweb-qa-20261102T000000Z.db.age" >/dev/null
[ "$(remote_files)" = "prod/quranweb-prod-20261102T000000Z.db.age qa/quranweb-qa-20261101T000000Z.db.age qa/quranweb-qa-20261102T000000Z.db.age " ] || fail "first push: $(remote_files)"
[ "$(git --git-dir="$BACKUP_GIT_REMOTE" show main:qa/quranweb-qa-20261101T000000Z.db.age)" = "age-encryption.org/v1 qa/quranweb-qa-20261101T000000Z.db.age" ] || fail "content"

# A file the server dropped (older than 30 days) leaves the remote, and history stays one commit long.
mk qa/quranweb-qa-20261103T000000Z.db.age; rm "$BACKUP_ROOT/qa/quranweb-qa-20261101T000000Z.db.age"
up >/dev/null
remote_files | grep -q 20261101 && fail "a dropped file is still on the remote"
remote_files | grep -q 20261103 || fail "the new file is missing"
[ "$(commits)" = 1 ] || fail "history grew: $(commits) commits"
git --git-dir="$BACKUP_GIT_REMOTE" log --all --format=%B | grep -q "20261101" && fail "old commit message still reachable"

# Refuses a name that is not a backup, and an empty or nearly empty set that would wipe the remote.
if up "$work/whatever.txt" 2>/dev/null; then fail "a stray name was accepted"; fi
before="$(remote_files)"
rm -f "$BACKUP_ROOT"/qa/*.db.age "$BACKUP_ROOT"/prod/*.db.age
if up 2>/dev/null; then fail "an empty backup folder was pushed"; fi
mk qa/quranweb-qa-20261110T000000Z.db.age
out="$(up 2>&1 || true)"; echo "$out" | grep -q "not replacing them" || fail "a nearly empty set replaced the remote: $out"
[ "$(remote_files)" = "$before" ] || fail "the remote changed after a refusal"

# Recovers when the state folder is lost (fresh server): fetches and pushes again.
mk qa/quranweb-qa-20261111T000000Z.db.age; mk qa/quranweb-qa-20261112T000000Z.db.age
rm -rf "$BACKUP_GIT_STATE"
up >/dev/null
[ "$(remote_files)" = "qa/quranweb-qa-20261110T000000Z.db.age qa/quranweb-qa-20261111T000000Z.db.age qa/quranweb-qa-20261112T000000Z.db.age " ] || fail "after losing state: $(remote_files)"
echo "upload-git test OK"

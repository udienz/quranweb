#!/usr/bin/env bash
# Tests of upload-rclone.sh (with a plain directory as the "remote") and rclone-conf-from-blob.py:
#   bash scripts/upload-rclone.test.sh        (needs rclone, python3 and coreutils; CI installs rclone)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
remote="$work/remote"
export RCLONE_CONFIG=/dev/null RCLONE_REMOTE="$remote" RETENTION_DAYS=30
fail() { echo "FAIL: $*" >&2; exit 1; }
upload() { bash "$here/upload-rclone.sh" "$@"; }

backup() { # name -> a small file with that name in $work/local
  mkdir -p "$work/local"; printf 'encrypted-%s' "$1" > "$work/local/$1"; echo "$work/local/$1"
}

# 1. lands in the folder of its environment, with the right content
f="$(backup quranweb-qa-20261118T000000Z.db.age)"
upload "$f" >/dev/null
[ "$(cat "$remote/qa/quranweb-qa-20261118T000000Z.db.age")" = "encrypted-quranweb-qa-20261118T000000Z.db.age" ] || fail "content"
f="$(backup quranweb-prod-20261118T000000Z.db.age)"; upload "$f" >/dev/null
[ -e "$remote/prod/quranweb-prod-20261118T000000Z.db.age" ] || fail "prod folder"

# 2. refuses names and files that are not backups
if upload "$work/local/../local" 2>/dev/null; then fail "a directory was accepted"; fi
printf x > "$work/notes.txt"; if upload "$work/notes.txt" 2>/dev/null; then fail "a stray file was accepted"; fi
: > "$work/local/quranweb-qa-empty.db.age"; if upload "$work/local/quranweb-qa-empty.db.age" 2>/dev/null; then fail "an empty file was accepted"; fi

# 3. retention: old copies go, the new ones, the other environment and stray files stay
for i in 1 2 3 4; do : > "$remote/qa/quranweb-qa-2026010${i}T000000Z.db.age"; printf x >> "$remote/qa/quranweb-qa-2026010${i}T000000Z.db.age"; touch -d '40 days ago' "$remote/qa/quranweb-qa-2026010${i}T000000Z.db.age"; done
touch -d '40 days ago' "$remote/prod/quranweb-prod-20261118T000000Z.db.age" "$remote/qa/notes-keep-me.txt" 2>/dev/null || { printf x > "$remote/qa/notes-keep-me.txt"; touch -d '40 days ago' "$remote/qa/notes-keep-me.txt"; }
for i in 1 2 3; do upload "$(backup quranweb-qa-2026111${i}T000000Z.db.age)" >/dev/null; done
ls "$remote/qa" | grep -q 'quranweb-qa-2026010' && fail "an old copy was kept"
[ "$(ls "$remote/qa" | grep -c 'quranweb-qa-20261')" = 4 ] || fail "wrong number of new copies: $(ls "$remote/qa")"
[ -e "$remote/qa/notes-keep-me.txt" ] || fail "a stray file was deleted"
[ -e "$remote/prod/quranweb-prod-20261118T000000Z.db.age" ] || fail "the other environment was touched"

# 4. never delete when too few would remain (a clock error or a long outage must not wipe every copy)
rm -rf "$remote"; mkdir -p "$remote/qa"
for i in 1 2 3 4; do printf x > "$remote/qa/quranweb-qa-2025010${i}T000000Z.db.age"; touch -d '90 days ago' "$remote/qa/quranweb-qa-2025010${i}T000000Z.db.age"; done
out="$(upload "$(backup quranweb-qa-20261120T000000Z.db.age)" 2>&1)"
echo "$out" | grep -q "not deleting 4 old copies" || fail "no warning: $out"
[ "$(ls "$remote/qa" | wc -l)" = 5 ] || fail "files were deleted although too few would remain"

# 5. a size mismatch fails the run
cat > "$work/shim" <<SHIM
#!/usr/bin/env bash
if [ "\$1" = size ]; then echo '{"count":1,"bytes":1}'; else exec rclone "\$@"; fi
SHIM
chmod +x "$work/shim"
if RCLONE="$work/shim" upload "$(backup quranweb-qa-20261121T000000Z.db.age)" 2>/dev/null; then fail "a size mismatch did not fail"; fi

# 6. rclone-conf-from-blob.py: the new blob, the old JSON and the failures
tok='{"access_token":"AT","token_type":"Bearer","refresh_token":"RT","expiry":"2026-11-18T14:00:00+07:00"}'
blob="$(python3 -c "import base64,json,sys;print(base64.urlsafe_b64encode(json.dumps({'token':sys.argv[1]}).encode()).decode().rstrip('='))" "$tok")"
conv() { python3 "$here/rclone-conf-from-blob.py" "${1:-gdrive}"; }
new="$(printf 'Paste the following into your remote machine --->\n%s\n<---End paste\n' "$blob" | conv)"
old="$(printf '%s\n' "$tok" | conv)"
[ "$new" = "$old" ] || fail "blob and JSON give different configs"
echo "$new" | grep -q '^\[gdrive\]$' && echo "$new" | grep -q '^scope = drive.file$' && echo "$new" | grep -q '"refresh_token":"RT"' || fail "config content: $new"
[ "$(printf '%s\n' "$tok" | conv backup | head -1)" = "[backup]" ] || fail "remote name"
if printf '%s\n' '{"access_token":"AT"}' | conv >/dev/null 2>&1; then fail "a token without refresh_token was accepted"; fi
err="$(printf 'garbage %s\n' "$tok" | conv 2>&1 >/dev/null || true)"; echo "$err" | grep -q "RT\|AT" && fail "the error message shows the token"
if printf 'not a token at all\n' | conv >/dev/null 2>&1; then fail "garbage was accepted"; fi

echo "upload-rclone test OK"

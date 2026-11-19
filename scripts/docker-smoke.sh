#!/usr/bin/env bash
# Build the production image and check that it starts and serves its pages and static files, as the servers would run it.
# Usage: bash scripts/docker-smoke.sh            (needs docker; CI runs it)
#
# The checkout on the servers is made with umask 007, so directories are closed to "others", and the image's runtime user
# (uid 1001) is "other". A new directory in public/ once stopped the app from starting (EACCES, QA 2026-11-19, PR #71), and
# only the QA deploy found it. With STRICT_PERMISSIONS=1 this script first removes the "others" bits from the checkout, so
# the build sees the same thing the server does (CI sets it; locally it would change your working copy, so it is off).
set -euo pipefail

IMAGE="quranweb:smoke"
NAME="quranweb-smoke"
PORT="${SMOKE_PORT:-3999}"

if [ "${STRICT_PERMISSIONS:-0}" = "1" ]; then
  chmod -R o-rwx .
fi

docker build -t "$IMAGE" .
docker rm -f "$NAME" >/dev/null 2>&1 || true
# No data source and no network needed: the pages checked below do not read the Qur'an data.
docker run -d --name "$NAME" -p "127.0.0.1:$PORT:3000" "$IMAGE" >/dev/null
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

# 000 when nothing answers (curl fails then, which must not end the script before the report).
status() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$1" || true; }

for i in $(seq 1 30); do
  [ "$(status /privacy)" = "200" ] && break
  sleep 1
done

fail=0
for path in /privacy /manifest.webmanifest /favicon.ico /icon.svg /icons/icon-192.png /icons/icon-maskable-512.png; do
  code="$(status "$path")"
  if [ "$code" = "200" ]; then echo "ok   $path"; else echo "FAIL $path -> $code"; fail=1; fi
done

user="$(docker exec "$NAME" id -u)"
if [ "$user" = "1001" ]; then echo "ok   runs as uid 1001"; else echo "FAIL runs as uid $user, expected 1001"; fail=1; fi

if docker logs "$NAME" 2>&1 | grep -E "EACCES|Error:"; then
  echo "FAIL errors in the container log"
  fail=1
fi

if [ "$fail" = "1" ]; then
  docker logs --tail 40 "$NAME" >&2 || true
  exit 1
fi
echo "docker smoke test OK"

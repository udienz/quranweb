#!/usr/bin/env bash
# Deploy quranweb ke server. Dijalankan DI SERVER dari workflow GitHub:
#   ssh server 'bash -s' -- <qa|prod> <git-ref> < scripts/deploy.sh
# nginx + certbot di host sudah meneruskan domain ke port lokal di bawah.
#   qa   -> quranweb-qa.udienz.web.id, 127.0.0.1:3000
#   prod -> quranweb.udienz.web.id,    127.0.0.1:3002
set -euo pipefail

ENVIRONMENT="${1:?usage: deploy.sh <qa|prod> <git-ref>}"
REF="${2:?usage: deploy.sh <qa|prod> <git-ref>}"

case "$ENVIRONMENT" in
  qa)   PORT=3000 ;;
  prod) PORT=3002 ;;
  *) echo "environment harus qa atau prod" >&2; exit 2 ;;
esac

NAME="quranweb-$ENVIRONMENT"
IMAGE="quranweb:$ENVIRONMENT"
DIR="${DEPLOY_DIR:-$HOME/deploy/$NAME}"
REPO="https://github.com/udienz/quranweb.git"

if [ ! -d "$DIR/.git" ]; then
  mkdir -p "$(dirname "$DIR")"
  git clone "$REPO" "$DIR"
fi
cd "$DIR"
git fetch --tags origin
git checkout --force --detach "$REF"

# Simpan image sebelumnya supaya bisa rollback kalau deploy gagal.
PREVIOUS="$(sudo docker image inspect -f '{{.Id}}' "$IMAGE" 2>/dev/null || true)"

sudo docker build -t "$IMAGE" .
sudo docker rm -f "$NAME" >/dev/null 2>&1 || true
sudo docker run -d --name "$NAME" --restart unless-stopped \
  -p "127.0.0.1:$PORT:3000" "$IMAGE" >/dev/null

for i in $(seq 1 20); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/")" = "200" ]; then
    echo "deploy $ENVIRONMENT OK: $REF"
    sudo docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done

echo "deploy $ENVIRONMENT GAGAL: app tidak merespons" >&2
sudo docker logs --tail 30 "$NAME" >&2
if [ -n "$PREVIOUS" ]; then
  echo "rollback ke image sebelumnya" >&2
  sudo docker rm -f "$NAME" >/dev/null 2>&1 || true
  sudo docker run -d --name "$NAME" --restart unless-stopped \
    -p "127.0.0.1:$PORT:3000" "$PREVIOUS" >/dev/null
fi
exit 1

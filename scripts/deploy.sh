#!/usr/bin/env bash
# Deploy quranweb on the server. Run ON THE SERVER by the GitHub workflows:
#   ssh server 'bash -s' -- <qa|prod> <git-ref> < scripts/deploy.sh
# nginx + certbot on the host already forward each domain to the local port below.
#   qa   -> quranweb-qa.udienz.web.id, 127.0.0.1:3000
#   prod -> quranweb.udienz.web.id,    127.0.0.1:3002
set -euo pipefail

ENVIRONMENT="${1:?usage: deploy.sh <qa|prod> <git-ref>}"
REF="${2:?usage: deploy.sh <qa|prod> <git-ref>}"

case "$ENVIRONMENT" in
  qa)   PORT=3000 ;;
  prod) PORT=3002 ;;
  *) echo "environment must be qa or prod" >&2; exit 2 ;;
esac

# The app reads its data from the local copy of the mirrors (EQuran.id format under
# api/v2, fawazahmed0 format under quran-api), mounted read-only into the container, so
# it makes no HTTP request for text. nginx still serves the same files publicly at
# /api/v2 and /quran-api. The directory comes from the quranweb-data repository.
MIRROR_DIR="${MIRROR_DIR:-/srv/quranweb-mirror}"
if [ ! -d "$MIRROR_DIR/api/v2" ] || [ ! -d "$MIRROR_DIR/quran-api" ]; then
  echo "mirror directory $MIRROR_DIR does not have api/v2 and quran-api" >&2
  exit 2
fi
DATA_ARGS=(-v "$MIRROR_DIR:/data:ro" -e QURAN_API_URL=/data/api/v2 -e QURAN_FAWAZ_URL=/data/quran-api)

# The account database (SQLite) lives in its own directory per environment, mounted read-write at
# /db. It is created if missing and NEVER replaced or emptied by a deploy. The app opens it and
# applies the migrations at start, so a deploy that cannot use it does not answer and rolls back.
DB_DIR="${DB_DIR:-/srv/quranweb-db/$ENVIRONMENT}"
sudo install -d -m 700 -o 1001 -g 1001 "$DB_DIR"
DATA_ARGS+=(-v "$DB_DIR:/db" -e QURAN_DB_PATH=/db/quranweb.db)

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

# Remember the previous image so we can roll back if the deploy fails.
PREVIOUS="$(sudo docker image inspect -f '{{.Id}}' "$IMAGE" 2>/dev/null || true)"

sudo docker build -t "$IMAGE" .
sudo docker rm -f "$NAME" >/dev/null 2>&1 || true
sudo docker run -d --name "$NAME" --restart unless-stopped \
  "${DATA_ARGS[@]}" \
  -p "127.0.0.1:$PORT:3000" "$IMAGE" >/dev/null

for i in $(seq 1 20); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/")" = "200" ]; then
    echo "deploy $ENVIRONMENT OK: $REF"
    sudo docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done

echo "deploy $ENVIRONMENT FAILED: the app does not answer" >&2
sudo docker logs --tail 30 "$NAME" >&2
if [ -n "$PREVIOUS" ]; then
  echo "rolling back to the previous image" >&2
  sudo docker rm -f "$NAME" >/dev/null 2>&1 || true
  sudo docker run -d --name "$NAME" --restart unless-stopped \
    "${DATA_ARGS[@]}" \
    -p "127.0.0.1:$PORT:3000" "$PREVIOUS" >/dev/null
fi
exit 1

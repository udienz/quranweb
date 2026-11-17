#!/usr/bin/env bash
# Deploy quranweb on the server. Run ON THE SERVER by the GitHub workflows:
#   ssh server 'bash -s' -- <qa|prod> <git-ref> < scripts/deploy.sh
# nginx + certbot on the host already forward each domain to the local port below.
#   qa   -> quranweb-qa.udienz.web.id, 127.0.0.1:3000 (data: mirror)
#   prod -> quranweb.udienz.web.id,    127.0.0.1:3002 (data: mirror)
set -euo pipefail

ENVIRONMENT="${1:?usage: deploy.sh <qa|prod> <git-ref>}"
REF="${2:?usage: deploy.sh <qa|prod> <git-ref>}"

case "$ENVIRONMENT" in
  # API_URL and FAWAZ_URL: the app's data sources, our own mirrors on each domain
  # (from the quranweb-data repository; served by nginx at /api/v2 and /quran-api).
  qa)   PORT=3000; API_URL="https://quranweb-qa.udienz.web.id/api/v2";  FAWAZ_URL="https://quranweb-qa.udienz.web.id/quran-api" ;;
  prod) PORT=3002; API_URL="https://quranweb.udienz.web.id/api/v2";    FAWAZ_URL="https://quranweb.udienz.web.id/quran-api" ;;
  *) echo "environment must be qa or prod" >&2; exit 2 ;;
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

# Remember the previous image so we can roll back if the deploy fails.
PREVIOUS="$(sudo docker image inspect -f '{{.Id}}' "$IMAGE" 2>/dev/null || true)"

sudo docker build -t "$IMAGE" .
sudo docker rm -f "$NAME" >/dev/null 2>&1 || true
sudo docker run -d --name "$NAME" --restart unless-stopped \
  -e QURAN_API_URL="$API_URL" -e QURAN_FAWAZ_URL="$FAWAZ_URL" \
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
    -e QURAN_API_URL="$API_URL" -e QURAN_FAWAZ_URL="$FAWAZ_URL" \
    -p "127.0.0.1:$PORT:3000" "$PREVIOUS" >/dev/null
fi
exit 1

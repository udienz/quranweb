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
if [ ! -d "$MIRROR_DIR/api/v2" ] || [ ! -d "$MIRROR_DIR/quran-api" ] || [ ! -d "$MIRROR_DIR/quranenc" ]; then
  echo "mirror directory $MIRROR_DIR does not have api/v2, quran-api and quranenc" >&2
  exit 2
fi
DATA_ARGS=(-v "$MIRROR_DIR:/data:ro" -e QURAN_API_URL=/data/api/v2 -e QURAN_FAWAZ_URL=/data/quran-api -e QURAN_QURANENC_URL=/data/quranenc)

# The account database (SQLite) lives in its own directory per environment, mounted read-write at
# /db. It is created if missing and NEVER replaced or emptied by a deploy. The app opens it and
# applies the migrations at start, so a deploy that cannot use it does not answer and rolls back.
DB_DIR="${DB_DIR:-/srv/quranweb-db/$ENVIRONMENT}"
sudo install -d -m 700 -o 1001 -g 1001 "$DB_DIR"
DATA_ARGS+=(-v "$DB_DIR:/db" -e QURAN_DB_PATH=/db/quranweb.db)

# BEGIN contact
# The privacy contact (not secret, shown on the privacy page) comes from the GitHub variables
# PRIVACY_CONTACT_NAME and PRIVACY_CONTACT_EMAIL. The workflows send each one base64-encoded in
# PRIVACY_CONTACT_NAME_B64 and PRIVACY_CONTACT_EMAIL_B64, so spaces, quotes or accents in a name cannot
# break the ssh command line. Unset or empty means the variable is not passed (the page then says the
# contact is not set up). A value in the env file below is overridden by these.
decode_b64() { [ -n "${1:-}" ] && printf '%s' "$1" | base64 -d 2>/dev/null | tr -d '\r\n' || true; }
for var in PRIVACY_CONTACT_NAME PRIVACY_CONTACT_EMAIL; do
  encoded="${var}_B64"
  value="$(decode_b64 "${!encoded:-}")"
  if [ -n "$value" ]; then DATA_ARGS+=(-e "$var=$value"); fi
done
# END contact

# Sign-in settings and secrets (BETTER_AUTH_URL, BETTER_AUTH_SECRET, AUTH_ISSUER_URL, AUTH_CLIENT_ID,
# AUTH_CLIENT_SECRET) live only on the server, in /etc/quranweb/<env>.env (mode 600, root), never in
# git. Without the file, or without these variables, sign-in is simply off.
ENV_FILE="${ENV_FILE:-/etc/quranweb/$ENVIRONMENT.env}"
if sudo test -f "$ENV_FILE"; then
  DATA_ARGS+=(--env-file "$ENV_FILE")
fi

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

# Keep the previous image under its own tag so we can roll back if the deploy fails. Remembering only its ID was not
# enough: once the build moved the tag and the old container was removed, the image could be deleted before the
# rollback (QA, 2026-11-19: "No such image"). The tag is replaced at every deploy, so it costs one image.
PREVIOUS=""
if sudo docker image inspect "$IMAGE" >/dev/null 2>&1; then
  PREVIOUS="$IMAGE-previous"
  sudo docker tag "$IMAGE" "$PREVIOUS"
fi

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

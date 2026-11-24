#!/usr/bin/env bash
# Deploy QA or production from the server itself, without GitHub Actions. It runs scripts/deploy.sh
# (the same script the workflows send over SSH) on this machine.
#
#   scripts/deploy-local.sh <qa|prod> [branch-or-commit]     (default: master)
#
# The branch is resolved to a commit on GitHub first, so what is deployed is what is pushed, not
# what is in this checkout. This checkout only supplies scripts/deploy.sh: keep it on the commit
# you want the script from (normally an up-to-date master).
#
# The workflows get four values from GitHub variables and secrets. Here they come from an optional
# file, ~/.config/quranweb/deploy-<qa|prod>.env, with mode 600 (never in git):
#   PRIVACY_CONTACT_NAME=...
#   PRIVACY_CONTACT_EMAIL=...
#   QF_CLIENT_ID=...
#   QF_CLIENT_SECRET=...
# Without them the deploy still works, but the privacy page says the contact is not set up and
# the Quran Foundation tafsir is read through the unauthenticated API.
set -euo pipefail

ENVIRONMENT="${1:?usage: deploy-local.sh <qa|prod> [branch-or-commit]}"
REF="${2:-master}"
REPO="https://github.com/udienz/quranweb.git"

case "$ENVIRONMENT" in
  qa | prod) ;;
  *) echo "environment must be qa or prod" >&2; exit 2 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# A branch name becomes its commit; anything else (a commit or tag) is passed on as it is.
SHA="$(git ls-remote "$REPO" "refs/heads/$REF" | cut -f1)"
SHA="${SHA:-$REF}"

if [ "$ENVIRONMENT" = prod ]; then
  printf 'Deploy %s to PRODUCTION? Type "prod" to continue: ' "$SHA"
  read -r answer
  [ "$answer" = prod ] || { echo "cancelled" >&2; exit 1; }
fi

CONFIG="$HOME/.config/quranweb/deploy-$ENVIRONMENT.env"
if [ -f "$CONFIG" ]; then
  if [ "$(stat -c '%a' "$CONFIG")" != 600 ]; then
    echo "$CONFIG must have mode 600" >&2
    exit 2
  fi
  # Read NAME=value lines as they are, so a value with spaces or quotes is not run as shell code.
  while IFS='=' read -r key value; do
    case "$key" in
      PRIVACY_CONTACT_NAME | PRIVACY_CONTACT_EMAIL | QF_CLIENT_ID | QF_CLIENT_SECRET) export "$key=$value" ;;
    esac
  done < "$CONFIG"
fi

b64() { printf '%s' "${1:-}" | base64 -w0; }

echo "deploying $SHA to $ENVIRONMENT"
PRIVACY_CONTACT_NAME_B64="$(b64 "${PRIVACY_CONTACT_NAME:-}")" \
PRIVACY_CONTACT_EMAIL_B64="$(b64 "${PRIVACY_CONTACT_EMAIL:-}")" \
QF_CLIENT_ID_B64="$(b64 "${QF_CLIENT_ID:-}")" \
QF_CLIENT_SECRET_B64="$(b64 "${QF_CLIENT_SECRET:-}")" \
  bash "$SCRIPT_DIR/deploy.sh" "$ENVIRONMENT" "$SHA" </dev/null

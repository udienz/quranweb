#!/usr/bin/env bash
# Deploy quranweb ke server QA (quranweb-qa.udienz.web.id).
# Dijalankan DI SERVER, dipanggil dari .github/workflows/deploy-qa.yml:
#   ssh server 'bash -s' < scripts/deploy-qa.sh <git-sha>
# nginx + certbot di host sudah meneruskan domain ke 127.0.0.1:3000.
set -euo pipefail

SHA="${1:?usage: deploy-qa.sh <git-sha>}"
DIR="${DEPLOY_DIR:-$HOME/deploy/quranweb}"
REPO="https://github.com/udienz/quranweb.git"

if [ ! -d "$DIR/.git" ]; then
  mkdir -p "$(dirname "$DIR")"
  git clone "$REPO" "$DIR"
fi
cd "$DIR"
git fetch origin
git checkout --force --detach "$SHA"

sudo docker build -t quranweb:qa .
sudo docker rm -f quranweb-qa >/dev/null 2>&1 || true
sudo docker run -d --name quranweb-qa --restart unless-stopped \
  -p 127.0.0.1:3000:3000 quranweb:qa >/dev/null

# Tunggu app siap, gagal kalau tidak merespons 200.
for i in $(seq 1 20); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/)" = "200" ]; then
    echo "deploy OK: $SHA"
    sudo docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done
echo "deploy GAGAL: app tidak merespons" >&2
sudo docker logs --tail 30 quranweb-qa >&2
exit 1

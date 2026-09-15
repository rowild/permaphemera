#!/usr/bin/env bash
# Build the static frontend for permaphemera.at and rsync it to the Hetzner host.
#
#   pnpm run deploy:hetzner            build + upload
#   pnpm run deploy:hetzner -- --skip-build   upload the existing .output/public
#
# The Directus URL is baked into the build. On permaphemera.at Directus is reached
# same-origin under /cms/ (nginx proxies it to the container), so the build must
# use that URL and never localhost.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${HETZNER_HOST:-rowild@138.199.205.241}"
KEY="${HETZNER_KEY:-$HOME/.ssh/id_hetzner}"
REMOTE_DIR="${HETZNER_REMOTE_DIR:-/srv/sites/permaphemera.at/html}"
export NUXT_PUBLIC_DIRECTUS_URL="${NUXT_PUBLIC_DIRECTUS_URL_PROD:-https://permaphemera.at/cms}"

case "$NUXT_PUBLIC_DIRECTUS_URL" in
  http://localhost*|http://127.*) echo "Refusing to deploy a build that points at $NUXT_PUBLIC_DIRECTUS_URL" >&2; exit 1 ;;
esac

if [[ "${1:-}" != "--skip-build" ]]; then
  echo "[deploy] building with NUXT_PUBLIC_DIRECTUS_URL=$NUXT_PUBLIC_DIRECTUS_URL"
  pnpm exec nuxt generate
fi

[[ -f .output/public/index.html ]] || { echo ".output/public/index.html is missing" >&2; exit 1; }

echo "[deploy] rsync .output/public -> $HOST:$REMOTE_DIR"
rsync -az --delete -e "ssh -i $KEY -o BatchMode=yes" .output/public/ "$HOST:$REMOTE_DIR/"
echo "[deploy] done"

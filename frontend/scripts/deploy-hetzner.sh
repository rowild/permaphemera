#!/usr/bin/env bash
# Build the static frontend for permaphemera.at and rsync it to the Hetzner host.
#
#   pnpm run deploy:hetzner                      build + upload
#   pnpm run deploy:hetzner -- --skip-build      upload the existing .output/public
#   pnpm run deploy:hetzner -- --tours-dry-run   list what the tour sync would upload
#                                                and delete; no build, no change
#
# After the upload it empties Cloudflare's cache (needs CLOUDFLARE_PURGE_TOKEN and
# CLOUDFLARE_ZONE_ID in .env.deploy.local; without them it warns and skips).
#
# The Directus URL is baked into the build. On permaphemera.at Directus is reached
# same-origin under /cms/ (nginx proxies it to the container), so the build must
# use that URL and never localhost.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${HETZNER_HOST:-rowild@138.199.205.241}"
KEY="${HETZNER_KEY:-$HOME/.ssh/id_hetzner}"
REMOTE_DIR="${HETZNER_REMOTE_DIR:-/srv/sites/permaphemera.at/html}"
SEO_REFRESH_DIR="$(dirname "$REMOTE_DIR")/seo-refresh"
export NUXT_PUBLIC_DIRECTUS_URL="${NUXT_PUBLIC_DIRECTUS_URL_PROD:-https://permaphemera.at/cms}"

SKIP_BUILD=0
TOURS_DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    --tours-dry-run) TOURS_DRY_RUN=1 ;;
    --) ;; # pnpm may pass its separator through
    *) echo "Unknown option $arg" >&2; exit 1 ;;
  esac
done

# The 360° tours are not in git (frontend/.gitignore: public/media/tours/), so a
# fresh checkout has none or only some. They are therefore synced apart from the
# build, ONE TOUR AT A TIME: each tour folder here is mirrored into its own folder
# on the server, so a file this copy no longer has (an old picture after a
# re-export) is deleted there too. Never one rsync over the whole tours folder
# with --delete: that would wipe every live tour this checkout lacks. A tour that
# exists only on the server is left alone, and a local folder without tour.json
# is skipped, so half a copy can never prune a whole tour. --delete-after removes
# old files only once the new ones are in place: no visitor meets a half-replaced
# tour.
sync_tours() {
  local dry="$1" dir id
  local flags=(-az --delete-after --itemize-changes)
  [[ "$dry" == 1 ]] && flags+=(--dry-run)
  for dir in public/media/tours/*/; do
    [[ -d "$dir" ]] || continue
    id="$(basename "$dir")"
    if [[ ! -f "${dir}tour.json" ]]; then
      echo "[deploy]   $id: no tour.json here, skipped"
      continue
    fi
    rsync "${flags[@]}" -e "ssh -i $KEY -o BatchMode=yes" "$dir" "$HOST:$REMOTE_DIR/media/tours/$id/" \
      | awk -v id="$id" -v dry="$dry" '
          /^\*deleting/ { sub(/^\*deleting +/, ""); print "[deploy]   " id ": " (dry ? "would delete " : "deleted ") $0; deleted++; next }
          /^[<>]f/ { uploaded++ }
          END { printf "[deploy]   %s: %d %s, %d %s\n", id, uploaded, (dry ? "to upload" : "uploaded"), deleted, (dry ? "to delete" : "deleted") }'
  done
}

if [[ "$TOURS_DRY_RUN" == 1 ]]; then
  [[ -d public/media/tours ]] || { echo "[deploy] no local tours folder; nothing to compare"; exit 0; }
  echo "[deploy] tour sync, dry run — nothing is uploaded or deleted"
  sync_tours 1
  exit 0
fi

case "$NUXT_PUBLIC_DIRECTUS_URL" in
  http://localhost*|http://127.*) echo "Refusing to deploy a build that points at $NUXT_PUBLIC_DIRECTUS_URL" >&2; exit 1 ;;
esac

if [[ "$SKIP_BUILD" != 1 ]]; then
  echo "[deploy] building with NUXT_PUBLIC_DIRECTUS_URL=$NUXT_PUBLIC_DIRECTUS_URL"
  pnpm exec nuxt generate
fi

[[ -f .output/public/index.html ]] || { echo ".output/public/index.html is missing" >&2; exit 1; }

# One static HTML per route with its SEO head, plus sitemap.xml (docs/superpowers/specs/2026-10-24-seo-design.md).
# Fresh on every deploy, also with --skip-build, so newly published records get theirs.
echo "[deploy] SEO snapshots"
node scripts/seo-snapshot.mjs

echo "[deploy] rsync .output/public -> $HOST:$REMOTE_DIR (tours excluded)"
rsync -az --delete --exclude '/media/tours/' -e "ssh -i $KEY -o BatchMode=yes" .output/public/ "$HOST:$REMOTE_DIR/"
if [[ -d public/media/tours ]]; then
  echo "[deploy] rsync tours (each tour mirrored into its own folder)"
  sync_tours 0
else
  echo "[deploy] no local tours folder; the tours on the server stay as they are"
fi

# The server rewrites the SEO snapshots every night with the same code (scripts/server/seo-refresh.sh),
# so an exhibition's tour sentence changes on its day. Copy that code next to the site (outside
# html/) and make sure the cron line exists.
echo "[deploy] nightly SEO refresh: code to $SEO_REFRESH_DIR, cron 00:15"
bundle=.output/seo-refresh
rm -rf "$bundle" && mkdir -p "$bundle"
for file in scripts/seo-snapshot.mjs scripts/lib/seo-snapshot.mjs scripts/lib/archive-source.mjs \
  shared/seo.mjs shared/archive-schema.mjs shared/tour-access.mjs i18n/locales/de.json i18n/locales/en.json; do
  mkdir -p "$bundle/$(dirname "$file")" && cp "$file" "$bundle/$file"
done
cp scripts/server/seo-refresh.sh "$bundle/seo-refresh.sh"
rsync -az --delete -e "ssh -i $KEY -o BatchMode=yes" "$bundle/" "$HOST:$SEO_REFRESH_DIR/"
ssh -i "$KEY" -o BatchMode=yes "$HOST" "crontab -l 2>/dev/null | grep -qF '$SEO_REFRESH_DIR/seo-refresh.sh' || { crontab -l 2>/dev/null; echo '15 0 * * * sh $SEO_REFRESH_DIR/seo-refresh.sh'; } | crontab -"

# Cloudflare keeps static files for up to 4 hours, so a file replaced under
# the same name (tour-viewer.js, a re-graded panorama) would stay old. Empty
# its cache now that everything is uploaded (scripts/purge-cloudflare.mjs).
node scripts/purge-cloudflare.mjs
echo "[deploy] done"

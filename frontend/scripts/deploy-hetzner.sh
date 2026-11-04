#!/usr/bin/env bash
# Build the static frontend for permaphemera.at and rsync it to the Hetzner host.
#
#   pnpm run deploy:hetzner                      build + upload the site and EVERY tour
#   pnpm run deploy:hetzner -- --skip-build      upload the existing .output/public
#   pnpm run deploy:hetzner -- --tours-dry-run   list what the tour sync would upload
#                                                and delete; no build, no change
#   pnpm run deploy:hetzner -- --site-only       the site, no tour (Update viewer)
#   pnpm run deploy:hetzner -- --tours a,b       the site and ONLY these tours (Publish)
#   pnpm run deploy:hetzner -- --tours a,b --no-site
#                                                only these tours, then the cache purge
#                                                (the Tour Editor's upload list)
#   pnpm run deploy:hetzner -- … --plan          print what would happen; change nothing
#   pnpm run deploy:hetzner -- … --skip-verify   build without the tests and checks first,
#                                                and upload without the browser tests
#                                                (an emergency only; they run by default
#                                                before every site upload since 2026-11-04)
#
# The three modes exist since 2026-10-29: a viewer update or one published tour
# used to check and push every tour copy here, one connection per tour — slow
# with many tours, and an old or half-copied local copy went live with it.
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
NEWS_REPORT_DIR="$(dirname "$REMOTE_DIR")/news-report"
export NUXT_PUBLIC_DIRECTUS_URL="${NUXT_PUBLIC_DIRECTUS_URL_PROD:-https://permaphemera.at/cms}"

SKIP_BUILD=0
SKIP_VERIFY=0
TOURS_DRY_RUN=0
SITE=1              # build, site rsync, SEO; --no-site skips it
TOURS_MODE=all      # all | none (--site-only) | list (--tours a,b)
TOUR_IDS=()
PLAN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build) SKIP_BUILD=1 ;;
    --skip-verify) SKIP_VERIFY=1 ;;
    --tours-dry-run) TOURS_DRY_RUN=1 ;;
    --site-only) TOURS_MODE=none ;;
    --no-site) SITE=0 ;;
    --tours)
      shift
      [[ $# -gt 0 && -n "$1" ]] || { echo "--tours needs a comma-separated list of tour ids" >&2; exit 1; }
      IFS=',' read -r -a TOUR_IDS <<<"$1"
      TOURS_MODE=list ;;
    --plan) PLAN=1 ;;
    --) ;; # pnpm may pass its separator through
    *) echo "Unknown option $1" >&2; exit 1 ;;
  esac
  shift
done

if [[ "$TOURS_MODE" == none && "$SITE" == 0 ]]; then
  echo "--site-only and --no-site together would upload nothing" >&2; exit 1
fi
if [[ "$SITE" == 0 && "$TOURS_MODE" != list ]]; then
  echo "--no-site needs --tours: name the tours to upload" >&2; exit 1
fi
# A tour id is a folder name made web-safe by the editor; anything else is refused,
# and a named tour must have been copied here (a tour.json in its folder).
if [[ "$TOURS_MODE" == list ]]; then
  for id in "${TOUR_IDS[@]}"; do
    [[ "$id" =~ ^[a-z0-9_-]+$ ]] || { echo "Not a tour id: $id" >&2; exit 1; }
    [[ -f "public/media/tours/$id/tour.json" ]] || { echo "$id is not copied into public/media/tours/ (no tour.json there)" >&2; exit 1; }
  done
fi

if [[ "$PLAN" == 1 ]]; then
  echo "[deploy] plan — site: $([[ $SITE == 1 ]] && echo "build and upload" || echo "left as it is")"
  case "$TOURS_MODE" in
    all) echo "[deploy] plan — tours: every tour in public/media/tours/" ;;
    none) echo "[deploy] plan — tours: none" ;;
    list) echo "[deploy] plan — tours: ${TOUR_IDS[*]}" ;;
  esac
  exit 0
fi

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
# The tour folders to sync: the named ones with --tours, else every one.
tour_dirs() {
  local id dir
  if [[ "$TOURS_MODE" == list ]]; then
    for id in "${TOUR_IDS[@]}"; do echo "public/media/tours/$id/"; done
  else
    for dir in public/media/tours/*/; do echo "$dir"; done
  fi
}

sync_tours() {
  local dry="$1" dir id
  local flags=(-az --delete-after --itemize-changes)
  [[ "$dry" == 1 ]] && flags+=(--dry-run)
  while IFS= read -r dir; do
    [[ -d "$dir" ]] || continue
    id="$(basename "$dir")"
    if [[ ! -f "${dir}tour.json" ]]; then
      echo "[deploy]   $id: no tour.json here, skipped"
      continue
    fi
    # </dev/null: ssh would otherwise read this loop's own input and swallow
    # the tour names after the first.
    rsync "${flags[@]}" -e "ssh -i $KEY -o BatchMode=yes" "$dir" "$HOST:$REMOTE_DIR/media/tours/$id/" </dev/null \
      | awk -v id="$id" -v dry="$dry" '
          /^\*deleting/ { sub(/^\*deleting +/, ""); print "[deploy]   " id ": " (dry ? "would delete " : "deleted ") $0; deleted++; next }
          /^[<>]f/ { uploaded++ }
          END { printf "[deploy]   %s: %d %s, %d %s\n", id, uploaded, (dry ? "to upload" : "uploaded"), deleted, (dry ? "to delete" : "deleted") }'
  done < <(tour_dirs)
}

if [[ "$TOURS_DRY_RUN" == 1 ]]; then
  [[ -d public/media/tours ]] || { echo "[deploy] no local tours folder; nothing to compare"; exit 0; }
  echo "[deploy] tour sync, dry run — nothing is uploaded or deleted"
  sync_tours 1
  exit 0
fi

if [[ "$SITE" == 1 ]]; then
  case "$NUXT_PUBLIC_DIRECTUS_URL" in
    http://localhost*|http://127.*) echo "Refusing to deploy a build that points at $NUXT_PUBLIC_DIRECTUS_URL" >&2; exit 1 ;;
  esac

  # Nothing goes live that fails a test or a check (plans/2026-11-04__nuxt-optimisation-audit.md, phase 4).
  if [[ "$SKIP_BUILD" != 1 && "$SKIP_VERIFY" != 1 ]]; then
    echo "[deploy] verify: tests, offline checks, types, then the checks against Directus"
    pnpm -s verify
    pnpm -s verify:live
  fi

  if [[ "$SKIP_BUILD" != 1 ]]; then
    echo "[deploy] building with NUXT_PUBLIC_DIRECTUS_URL=$NUXT_PUBLIC_DIRECTUS_URL"
    pnpm exec nuxt generate
  fi

  [[ -f .output/public/index.html ]] || { echo ".output/public/index.html is missing" >&2; exit 1; }

  # One static HTML per route with its SEO head, plus sitemap.xml (docs/superpowers/specs/2026-10-24-seo-design.md).
  # Fresh on every deploy, also with --skip-build, so newly published records get theirs.
  echo "[deploy] SEO snapshots"
  node scripts/seo-snapshot.mjs

  # The browser tests (test/e2e) open the built pages at three screen widths, with the live data.
  if [[ "$SKIP_VERIFY" != 1 ]]; then
    echo "[deploy] browser tests against .output/public (desktop, tablet, phone)"
    pkill -f "serve --single --no-clipboard -l 4993" 2>/dev/null || true
    pnpm -s test:e2e
  fi

  echo "[deploy] rsync .output/public -> $HOST:$REMOTE_DIR (tours excluded)"
  rsync -az --delete --exclude '/media/tours/' -e "ssh -i $KEY -o BatchMode=yes" .output/public/ "$HOST:$REMOTE_DIR/"
else
  echo "[deploy] site: left as it is (--no-site)"
fi

if [[ "$TOURS_MODE" == none ]]; then
  echo "[deploy] tours: none (--site-only); the tours on the server stay as they are"
else
  if [[ -d public/media/tours ]]; then
    echo "[deploy] rsync tours (each tour mirrored into its own folder)"
    sync_tours 0
  else
    echo "[deploy] no local tours folder; the tours on the server stay as they are"
  fi
fi

if [[ "$SITE" == 1 ]]; then
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
  # The monthly news report for the owner (scripts/server/news-report.sh): code next to the site,
  # settings and state in news-report-data/ (never touched by a deploy), cron on the 1st at 08:00.
  echo "[deploy] monthly news report: code to $NEWS_REPORT_DIR, cron 1st of the month 08:00"
  bundle=.output/news-report
  rm -rf "$bundle" && mkdir -p "$bundle"
  for file in scripts/news-report.mjs scripts/lib/news-report.mjs scripts/lib/archive-source.mjs \
    shared/seo.mjs shared/archive-schema.mjs shared/tour-access.mjs; do
    mkdir -p "$bundle/$(dirname "$file")" && cp "$file" "$bundle/$file"
  done
  cp scripts/server/news-report.sh "$bundle/news-report.sh"
  rsync -az --delete -e "ssh -i $KEY -o BatchMode=yes" "$bundle/" "$HOST:$NEWS_REPORT_DIR/"
  ssh -i "$KEY" -o BatchMode=yes "$HOST" "mkdir -p '$NEWS_REPORT_DIR-data' && chmod 700 '$NEWS_REPORT_DIR-data' && crontab -l 2>/dev/null | grep -qF '$NEWS_REPORT_DIR/news-report.sh' || { crontab -l 2>/dev/null; echo '0 8 1 * * sh $NEWS_REPORT_DIR/news-report.sh'; } | crontab -"
  # The job only logs; say here when its last night went wrong.
  last_run="$(ssh -i "$KEY" -o BatchMode=yes "$HOST" "tail -n 20 '$(dirname "$REMOTE_DIR")/seo-refresh.log' 2>/dev/null | awk '/^== [0-9]/ { block = \"\" } { block = block \$0 \"\\n\" } END { printf \"%s\", block }'")"
  if grep -qE 'failed|problems' <<<"$last_run"; then
    echo "[deploy] WARNING: the last nightly SEO refresh failed (/srv/sites/permaphemera.at/seo-refresh.log):" >&2
    echo "$last_run" >&2
  fi
fi

# Cloudflare keeps static files for up to 4 hours, so a file replaced under
# the same name (tour-viewer.js, a re-graded panorama) would stay old. Empty
# its cache now that everything is uploaded (scripts/purge-cloudflare.mjs).
node scripts/purge-cloudflare.mjs
echo "[deploy] done"

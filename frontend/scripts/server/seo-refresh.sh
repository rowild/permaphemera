#!/bin/sh
# Runs every night at 00:15 (server time, Europe/Vienna) on the Hetzner host; scripts/deploy-hetzner.sh
# copies it with the snapshot code to /srv/sites/permaphemera.at/seo-refresh/ and adds the cron line.
#
# It runs the deploy's SEO snapshot step (scripts/seo-snapshot.mjs) again on the live folder, so an
# exhibition's tour sentence ("360° tour from 29 October.", "… in preparation.", "… online.")
# changes on its day without a deploy, and records published since the last deploy get their
# snapshot. Only changed files are rewritten. The host has no Node, so it runs in a container.
# Pages and sitemap.xml are not cached by Cloudflare (cf-cache-status: DYNAMIC): no purge needed.
#
# Log: /srv/sites/permaphemera.at/seo-refresh.log (last 400 lines). By hand: sh <this file>
set -u
CODE=$(cd "$(dirname "$0")" && pwd)
SITE=$(dirname "$CODE")
LOG="$SITE/seo-refresh.log"
{
  echo "== $(date -Iseconds)"
  docker run --rm --user "$(id -u):$(id -g)" \
    -e DIRECTUS_URL=https://permaphemera.at/cms -e SEO_OUTPUT_DIR=/site \
    -v "$CODE:/app:ro" -v "$SITE/html:/site" -w /app \
    node:24.11.1-alpine node scripts/seo-snapshot.mjs \
    || echo "== failed with exit code $?"
} >> "$LOG" 2>&1
tail -n 400 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"

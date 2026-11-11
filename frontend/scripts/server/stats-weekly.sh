#!/bin/sh
# Runs every Monday at 05:30 (server time, Europe/Vienna) on the Hetzner host;
# scripts/deploy-hetzner.sh copies it with the job code to /srv/sites/permaphemera.at/stats-weekly/
# and adds the cron line. Plan: plans/2026-11-11__umami-weekly-sums.md.
#
# Umami deletes PERMAPHEMERA's visit details after 36 months (directus/hetzner/
# umami-retention-permaphemera.sh). Before that, this job keeps weekly sums for good in Directus
# (pp_stats_weekly): per record, town, page, visitor country and city, referrer and device.
#   1. asks Directus where to start (the last stored week; the first run starts 2026-10-19),
#   2. exports those complete weeks from Umami (read-only SQL, stats-weekly.sql),
#   3. sums them in the node container and writes the missing rows, 4. deletes the export.
#
# Settings live outside the code folder (a deploy replaces that folder):
#   /srv/sites/permaphemera.at/stats-weekly-data/directus.env   DIRECTUS_TOKEN of the user
#                                                              "Statistics job" (mode 600)
#   /srv/sites/permaphemera.at/stats-weekly.log                 the log (last 400 lines)
# By hand: sh <this file>
set -u
CODE=$(cd "$(dirname "$0")" && pwd)
SITE=$(dirname "$CODE")
DATA="$SITE/stats-weekly-data"
LOG="$SITE/stats-weekly.log"
UMAMI_WEBSITE=d7a5053b-b94e-4fbc-9b6f-78e1b388742c
DIRECTUS_URL=https://permaphemera.project-backends.info

node_job() {
  docker run --rm --user "$(id -u):$(id -g)" \
    -e DIRECTUS_URL="$DIRECTUS_URL" -e DIRECTUS_TOKEN="$DIRECTUS_TOKEN" \
    -v "$CODE:/app:ro" -v "$DATA:/data" -w /app \
    node:24.11.1-alpine node scripts/stats-weekly.mjs "$@"
}

{
  echo "== $(date -Iseconds)"
  if [ ! -f "$DATA/directus.env" ]; then
    echo "== failed: $DATA/directus.env is missing"
  else
    . "$DATA/directus.env"
    if ! SINCE=$(node_job --next-week); then
      echo "== failed: Directus could not say where to start"
    elif ! docker exec -i umami-db-1 sh -c 'psql -X -q -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v site="$1" -v since="$2"' _ "$UMAMI_WEBSITE" "$SINCE" \
        < "$CODE/scripts/server/stats-weekly.sql" > "$DATA/umami.jsonl"; then
      echo "== failed: the Umami export from $SINCE did not work"
    else
      echo "== export from $SINCE: $(wc -l < "$DATA/umami.jsonl") lines"
      node_job --input /data/umami.jsonl || echo "== failed: the sums could not be written (exit $?)"
    fi
    rm -f "$DATA/umami.jsonl"
  fi
} >> "$LOG" 2>&1
tail -n 400 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"

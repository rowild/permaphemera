#!/bin/sh
# Runs on the 1st of each month at 08:00 (server time, Europe/Vienna) on the Hetzner host;
# scripts/deploy-hetzner.sh copies it with the report code to /srv/sites/permaphemera.at/news-report/
# and adds the cron line. Plan: plans/2026-11-04__news-system.md §7.
#
# Builds the monthly news report (scripts/news-report.mjs, in the node container: the host has no
# Node) and sends it by SMTP with curl. The state of the last report moves forward only after the
# mail went out, so a failed send repeats the same report next time.
#
# Settings and state live outside the code folder (a deploy replaces that folder):
#   /srv/sites/permaphemera.at/news-report-data/mail.env   SMTP_URL (smtp://<host>:587: Hetzner
#                                                          blocks outgoing 465), SMTP_USER, SMTP_PASS,
#                                                          NEWS_REPORT_FROM, NEWS_REPORT_TO
#   /srv/sites/permaphemera.at/news-report-data/state.json the last report's state
#   /srv/sites/permaphemera.at/news-report.log             the log (last 400 lines)
# By hand: sh <this file>
set -u
CODE=$(cd "$(dirname "$0")" && pwd)
SITE=$(dirname "$CODE")
DATA="$SITE/news-report-data"
LOG="$SITE/news-report.log"
{
  echo "== $(date -Iseconds)"
  if [ ! -f "$DATA/mail.env" ]; then
    echo "== failed: $DATA/mail.env is missing"
  else
    . "$DATA/mail.env"
    if [ -z "${SMTP_PASS:-}" ] || [ "$SMTP_PASS" = "replace-me" ]; then
      echo "== failed: SMTP_PASS in $DATA/mail.env is not set"
    elif docker run --rm --user "$(id -u):$(id -g)" \
        -e DIRECTUS_URL=https://permaphemera.at/cms -e NEWS_REPORT_STATE=/data/state.json \
        -e NEWS_REPORT_FROM="$NEWS_REPORT_FROM" -e NEWS_REPORT_TO="$NEWS_REPORT_TO" \
        -v "$CODE:/app:ro" -v "$DATA:/data" -w /app \
        node:24.11.1-alpine node scripts/news-report.mjs --mail /data/mail.eml; then
      if curl --silent --show-error --ssl-reqd --connect-timeout 20 --max-time 90 --url "$SMTP_URL" --user "$SMTP_USER:$SMTP_PASS" \
          --mail-from "$NEWS_REPORT_FROM" --mail-rcpt "$NEWS_REPORT_TO" --upload-file "$DATA/mail.eml"; then
        mv "$DATA/state.json.pending" "$DATA/state.json"
        echo "== sent to $NEWS_REPORT_TO"
      else
        echo "== failed: curl could not send the mail (exit $?)"
      fi
    else
      echo "== failed: the report could not be built (exit $?)"
    fi
    rm -f "$DATA/mail.eml" "$DATA/state.json.pending"
  fi
} >> "$LOG" 2>&1
tail -n 400 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"

#!/usr/bin/env bash
# Copies the newsletter endpoint extension to the PERMAPHEMERA Directus on the project-backends
# server, restarts Directus (production has no EXTENSIONS_AUTO_RELOAD) and checks the endpoint.
# Safe to run again; it never deletes data. The NEWSLETTER_* variables must be in
# directus/.env.remote and on the server (bash hetzner/install-remote.sh copies that file).
#   bash directus/hetzner/install-extension.sh            # copy, restart, check
#   bash directus/hetzner/install-extension.sh --dry-run  # show what would be copied
# Plan: plans/2026-11-07__newsletter.md (phase 8, launch).
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${PB_HOST:-rowild@138.199.205.241}"
KEY="${PB_KEY:-$HOME/.ssh/id_hetzner}"
STACK="/srv/stacks/permaphemera.project-backends.info"
NAME="permaphemera-newsletter"
DRY=""
[[ "${1:-}" == "--dry-run" ]] && DRY="--dry-run"

node --test "extensions/$NAME/lib.test.mjs" >/dev/null || { echo "extension tests fail; nothing copied"; exit 1; }

echo "Copying extensions/$NAME → $HOST:$STACK/extensions/$NAME ${DRY:+(dry run)}"
rsync -av $DRY --exclude '*.test.mjs' -e "ssh -i $KEY -o BatchMode=yes" "extensions/$NAME/" "$HOST:$STACK/extensions/$NAME/"
[[ -n "$DRY" ]] && exit 0

ssh -i "$KEY" -o BatchMode=yes "$HOST" "cd $STACK/app && docker compose restart directus"

echo -n "waiting for Directus"
for _ in $(seq 1 45); do
  if curl -fsS -o /dev/null "https://permaphemera.project-backends.info/server/health"; then echo " ok"; break; fi
  echo -n "."; sleep 2
done

# A request with the bot field filled: the endpoint answers without calling Brevo.
ANSWER=$(curl -sS -X POST "https://permaphemera.at/cms/newsletter/subscribe" \
  -H 'content-type: application/json' -H 'origin: https://permaphemera.at' \
  -d '{"website":"install-check","startedAt":0}')
echo "endpoint answers: $ANSWER"
case "$ANSWER" in
  *'"state":"pending"'*)
    echo "ok: the endpoint is loaded and configured"
    # The weekly Brevo key check (Brevo switches a key off after 90 days without use).
    scp -q -i "$KEY" hetzner/brevo-keepalive.sh "$HOST:$STACK/brevo-keepalive.sh"
    ssh -i "$KEY" -o BatchMode=yes "$HOST" "chmod 755 $STACK/brevo-keepalive.sh && \
      (crontab -l 2>/dev/null | grep -v 'brevo-keepalive.sh'; echo '23 4 * * 1 $STACK/brevo-keepalive.sh') | crontab - && \
      $STACK/brevo-keepalive.sh; tail -n 1 $STACK/brevo-keepalive.log"
    ;;
  *'"error":"unavailable"'*) echo "loaded, but the NEWSLETTER_* variables are missing on the server"; exit 1 ;;
  *) echo "unexpected answer; check: ssh $HOST 'cd $STACK/app && docker compose logs --tail 50 directus'"; exit 1 ;;
esac

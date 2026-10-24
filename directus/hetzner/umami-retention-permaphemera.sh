#!/bin/sh
# Deletes PERMAPHEMERA visit data older than 36 months from the self-hosted Umami
# (owner's decision, 2026-10-24; the privacy policy states this period).
# Only the website d7a5053b-…; the other websites on this Umami instance are not touched.
# Installed on the Hetzner host as
#   /srv/stacks/umami.project-backends.info/umami-retention-permaphemera.sh
# and run nightly by the crontab of user rowild:
#   17 3 * * * /srv/stacks/umami.project-backends.info/umami-retention-permaphemera.sh >> /srv/stacks/umami.project-backends.info/umami-retention-permaphemera.log 2>&1
set -eu

WEBSITE=d7a5053b-b94e-4fbc-9b6f-78e1b388742c
KEEP="36 months"

echo "$(date -Is) deleting PERMAPHEMERA Umami data older than $KEEP"
docker exec -i umami-db-1 sh -c 'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<SQL
BEGIN;
DELETE FROM event_data     WHERE website_id = '$WEBSITE' AND created_at < now() - interval '$KEEP';
DELETE FROM session_data   WHERE website_id = '$WEBSITE' AND created_at < now() - interval '$KEEP';
DELETE FROM revenue        WHERE website_id = '$WEBSITE' AND created_at < now() - interval '$KEEP';
DELETE FROM heatmap_event  WHERE website_id = '$WEBSITE' AND created_at < now() - interval '$KEEP';
DELETE FROM session_replay WHERE website_id = '$WEBSITE' AND created_at < now() - interval '$KEEP';
DELETE FROM session_link   WHERE website_id = '$WEBSITE' AND created_at < now() - interval '$KEEP';
DELETE FROM website_event  WHERE website_id = '$WEBSITE' AND created_at < now() - interval '$KEEP';
-- A session goes once it is old and none of its page views is left.
DELETE FROM session s      WHERE s.website_id = '$WEBSITE' AND s.created_at < now() - interval '$KEEP'
  AND NOT EXISTS (SELECT 1 FROM website_event e WHERE e.session_id = s.session_id);
COMMIT;
SQL
echo "$(date -Is) done"

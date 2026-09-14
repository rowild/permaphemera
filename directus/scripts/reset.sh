#!/usr/bin/env bash
# Wipes the local SQLite database and rebuilds everything from the scripts.
# Never touches uploads/. Refuses to run without --yes.
#   bash scripts/reset.sh --yes
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${1:-}" != "--yes" ]]; then
  echo "This deletes database/data.db and rebuilds the schema and seeds."
  echo "Run again with --yes to proceed."
  exit 1
fi

docker compose down
rm -f database/data.db database/data.db-wal database/data.db-shm
docker compose up -d

echo -n "waiting for Directus"
for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null http://localhost:8077/server/health; then echo " ok"; break; fi
  echo -n "."; sleep 2
done
curl -fsS -o /dev/null http://localhost:8077/server/health || { echo "Directus did not come up"; exit 1; }

node scripts/create-schema.mjs
node scripts/seed.mjs
node scripts/apply-settings.mjs
node scripts/check-conventions.mjs
node scripts/snapshot.mjs
echo "reset complete"

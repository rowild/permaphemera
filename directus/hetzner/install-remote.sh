#!/usr/bin/env bash
# Installs or updates the PERMAPHEMERA Directus stack on the project-backends server.
# Safe to run again: it copies the compose file and env, (re)starts the containers,
# adds the nginx map line once, and waits for health. It never deletes data.
#   bash directus/hetzner/install-remote.sh
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${PB_HOST:-rowild@138.199.205.241}"
KEY="${PB_KEY:-$HOME/.ssh/id_hetzner}"
NAME="permaphemera.project-backends.info"
STACK="/srv/stacks/$NAME"
ENV_FILE="${DIRECTUS_ENV_FILE:-.env.remote}"

[[ -f "$ENV_FILE" ]] || { echo "$ENV_FILE is missing; copy hetzner/.env.example and fill it in"; exit 1; }
PORT=$(grep '^DIRECTUS_PORT=' "$ENV_FILE" | cut -d= -f2)
[[ -n "$PORT" ]] || { echo "DIRECTUS_PORT missing in $ENV_FILE"; exit 1; }

SSH=(ssh -i "$KEY" -o BatchMode=yes "$HOST")

echo "Preparing $STACK on $HOST …"
"${SSH[@]}" "mkdir -p $STACK/app $STACK/data/uploads $STACK/data/database $STACK/data/redis $STACK/extensions"
scp -q -i "$KEY" hetzner/docker-compose.yml "$HOST:$STACK/app/docker-compose.yml"
scp -q -i "$KEY" "$ENV_FILE" "$HOST:$STACK/app/.env"
"${SSH[@]}" "chmod 600 $STACK/app/.env && cd $STACK/app && docker compose up -d --remove-orphans"

echo "nginx map …"
"${SSH[@]}" "grep -q '$NAME' /etc/nginx/conf.d/project-backends-upstreams.conf || sudo -n sed -i 's|^\(  mami.project-backends.info.*\)|  $NAME   http://127.0.0.1:$PORT;\n\1|' /etc/nginx/conf.d/project-backends-upstreams.conf; grep -n '$NAME' /etc/nginx/conf.d/project-backends-upstreams.conf; sudo -n nginx -t && sudo -n systemctl reload nginx"

echo -n "waiting for https://$NAME/server/health"
for _ in $(seq 1 45); do
  if curl -fsS -o /dev/null "https://$NAME/server/health"; then echo " ok"; exit 0; fi
  echo -n "."; sleep 2
done
echo " not healthy yet; check: ssh $HOST 'cd $STACK/app && docker compose logs --tail 50 directus'"; exit 1

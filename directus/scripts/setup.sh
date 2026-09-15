#!/usr/bin/env bash
# The one entry point. Reports what exists, asks before each step, never deletes content.
#   bash scripts/setup.sh                # step by step, with questions
#   bash scripts/setup.sh --yes          # every step, no questions
#   bash scripts/setup.sh --status       # report only
#   bash scripts/setup.sh --from <dir>   # also import content from <dir> (an export, or frontend/app/data)
#   bash scripts/setup.sh --reset-permissions   # delete and recreate the public read rules (configuration, not content)
#
# Order without --from: Directus, schema, seeds, permissions, settings, content.
# Order with --from:    Directus, schema, permissions, content, seeds, settings.
#   (content import must run before seeds on a fresh instance, so seed.mjs's roles and
#   menus don't get created with new ids ahead of the backup's own rows of the same
#   slug/key; import.mjs ensures the languages rows itself, so nothing else has to
#   precede it.)
#
# DIRECTUS_URL overrides the instance to talk to (default http://localhost:8077).
set -euo pipefail
cd "$(dirname "$0")/.."

URL="${DIRECTUS_URL:-http://localhost:8077}"

YES=false; STATUS=false; FROM=""; RESET_PERMS=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) YES=true ;;
    --status) STATUS=true ;;
    --from) FROM="$2"; shift ;;
    --reset-permissions) RESET_PERMS=true ;;
    *) echo "unknown option $1"; exit 1 ;;
  esac
  shift
done

[[ -f .env ]] || { echo "directus/.env is missing. cp .env.example .env and fill in the values."; exit 1; }

ask() { # ask "question" → 0 = yes
  $STATUS && return 1
  $YES && return 0
  read -r -p "$1 [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]]
}

health() { curl -fsS -o /dev/null "$URL/server/health"; }

# 1. Directus
if health; then
  echo "Directus: running on $URL"
else
  echo "Directus: not running$( [[ -f database/data.db ]] && echo ' (database exists)' || echo ' (no database yet: first start creates it from .env)')"
  if ask "Start it with docker compose?"; then
    docker compose up -d
    for _ in $(seq 1 60); do health && break; sleep 2; done
    health || { echo "Directus did not come up"; exit 1; }
    echo "Directus: running"
  else
    exit 0
  fi
fi

# 2. Schema
echo; echo "Schema:"; node scripts/check-conventions.mjs 2>/dev/null | tail -1 || echo "  conventions check failed or collections missing"
schema_status=0
node -e "
import('./scripts/build.mjs').then(async ({ buildAll }) => {
  const { loadEnv, login } = await import('./scripts/lib.mjs')
  const { api } = await login(loadEnv())
  const live = new Set((await api('GET', '/collections')).map((c) => c.collection))
  const want = buildAll().collections.map((c) => c.collection)
  const missing = want.filter((n) => !live.has(n))
  console.log('  ' + (want.length - missing.length) + ' of ' + want.length + ' collections exist' + (missing.length ? ', missing: ' + missing.join(', ') : ''))
  process.exit(missing.length ? 10 : 0)
})" || schema_status=$?
[[ $schema_status -eq 10 ]] && { ask "Add the missing collections?" && node scripts/create-schema.mjs; }

step_seeds() {
  echo; echo "Seeds:"; node scripts/seed.mjs --status 2>/dev/null || true
  if ask "Add missing languages, roles and menus?"; then node scripts/seed.mjs; fi
}

step_permissions() {
  echo; echo "Permissions:"
  node --input-type=module -e "
import { loadEnv, login } from './scripts/lib.mjs'
const { api } = await login(loadEnv())
const p = (await api('GET', '/policies?filter[name][_eq]=\$t:public_label&fields=id'))[0]?.id
const rules = await api('GET', '/permissions?filter[policy][_eq]=' + p + '&filter[action][_eq]=read&limit=-1&fields=collection')
console.log('  ' + rules.length + ' public read rules')"
  if $RESET_PERMS; then
    if ask "Delete and recreate the public read rules?"; then node scripts/permissions.mjs --reset; fi
  else
    if ask "Add missing public read rules?"; then node scripts/permissions.mjs; fi
  fi
}

step_settings() {
  echo; echo "Settings:"
  curl -s "$URL/server/info" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const p=JSON.parse(d).data.project;console.log('  name: '+p.project_name+' · colour: '+p.project_color+' · logo: '+(p.project_logo?'set':'missing'))})"
  if ask "Apply project settings and branding?"; then node scripts/apply-settings.mjs; fi
}

step_content() {
  echo; echo "Content:"
  node --input-type=module -e "
import { loadEnv, login } from './scripts/lib.mjs'
const { api } = await login(loadEnv())
for (const c of ['pp_locations','pp_venues','pp_persons','pp_exhibitions','pp_sponsors','pp_navigation_items']) {
  try {
    const n = (await api('GET', '/items/' + c + '?aggregate[count]=id'))[0].count.id
    console.log('  ' + c + ': ' + n)
  } catch (e) {
    console.log('  ' + c + ': not created yet')
  }
}" || true
  if [[ -n "$FROM" ]]; then
    if ask "Import content from $FROM?"; then node scripts/import.mjs --from "$FROM"; fi
  fi
}

if [[ -n "$FROM" ]]; then
  # 3. Permissions, 4. Content (import), 5. Seeds, 6. Settings
  step_permissions
  step_content
  step_seeds
  step_settings
else
  # 3. Seeds, 4. Permissions, 5. Settings, 6. Content
  step_seeds
  step_permissions
  step_settings
  step_content
fi

echo; echo "setup finished"

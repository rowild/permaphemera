# PERMAPHEMERA Directus on the project-backends server

The production Directus runs on Robert's Hetzner server ("project-backends",
`rowild@138.199.205.241`, key `~/.ssh/id_hetzner`) as one stack among the
others, at `/srv/stacks/permaphemera.project-backends.info/`:

```
app/docker-compose.yml   ← hetzner/docker-compose.yml from this repo
app/.env                 ← directus/.env.remote from this Mac (git-ignored)
data/database/           SQLite
data/uploads/            files
data/redis/              cache
extensions/              custom extensions (none yet)
```

The host nginx maps `permaphemera.project-backends.info` to the stack's port
(`DIRECTUS_PORT`, 8060) in `/etc/nginx/conf.d/project-backends-upstreams.conf`.
DNS and the wildcard certificate are shared by every stack; nothing to do there.

**Warning:** `128.140.38.54` (key `hetzner-spittal-robert`) is the Chorwettbewerb
Spittal server, a client project. PERMAPHEMERA never goes there.

## Commands

```bash
cp hetzner/.env.example .env.remote        # once; fill in the secrets
bash hetzner/install-remote.sh             # copy compose + env, (re)start, nginx map, health

# every script in scripts/ can target the remote instance:
DIRECTUS_ENV_FILE=.env.remote node scripts/create-schema.mjs
DIRECTUS_ENV_FILE=.env.remote node scripts/permissions.mjs
DIRECTUS_ENV_FILE=.env.remote node scripts/apply-settings.mjs
DIRECTUS_ENV_FILE=.env.remote node scripts/import.mjs --from ../_BU/directus-data
DIRECTUS_ENV_FILE=.env.remote node scripts/export.mjs --to ../_BU/directus-data-remote
DIRECTUS_ENV_FILE=.env.remote node scripts/check-conventions.mjs
DIRECTUS_ENV_FILE=.env.remote bash scripts/setup.sh --status
```

The frontend reads the remote instance when `NUXT_PUBLIC_DIRECTUS_URL` in
`frontend/.env` is `https://permaphemera.project-backends.info` (restart
`pnpm dev` after changing it). `CORS_ORIGIN` on the server already allows
`http://localhost:4991`, `http://localhost:3000` and `https://permaphemera.at`.

## Going live under permaphemera.at (planned)

When the domain is ready: the site's nginx block on the same server forwards
`permaphemera.at/cms/` to this container, so browsers only ever talk to
`permaphemera.at` (some institutional networks block third-party hosts). The
site is then built with `NUXT_PUBLIC_DIRECTUS_URL=https://permaphemera.at/cms`.
Editors keep using `permaphemera.project-backends.info`.

## Backups

`DIRECTUS_ENV_FILE=.env.remote node scripts/export.mjs --to ../_BU/directus-data-remote`
pulls records and files to this Mac. The server keeps no automatic backup yet.

Content history: first load on 2026-09-15 from `_BU/directus-data`, the export of
the local instance that had been imported from the frontend JSON.

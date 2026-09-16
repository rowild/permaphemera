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

## The public site: permaphemera.at (since 2026-09-16)

Cloudflare holds the DNS zone and proxies the traffic (orange cloud, SSL mode Full strict)
to the Hetzner host. There, nginx serves the static frontend and forwards `/cms/` to the
Directus container on the same origin, so institutional networks never see a second host.

- nginx: `/etc/nginx/sites-available/permaphemera.at` — port 80 answers the ACME check and
  redirects; port 443 serves `/srv/sites/permaphemera.at/html`, proxies `/cms/` →
  `127.0.0.1:8060/` (prefix stripped), caches `/_nuxt/` for a year, and falls back to
  `/200.html` for the SPA. `www` redirects to the apex.
- Certificate: Let's Encrypt via `certbot certonly --webroot -w /var/www/letsencrypt`,
  cert name `permaphemera.at`. Renewal runs by certbot's timer through port 80.
  (The Cloudflare token on the host only covers project-backends.info, so DNS-01 is not
  an option for this zone.)
- Deploy the frontend: `cd frontend && pnpm run deploy:hetzner` builds with
  `NUXT_PUBLIC_DIRECTUS_URL=https://permaphemera.at/cms` and rsyncs `.output/public`.
- The Directus admin stays at https://permaphemera.project-backends.info; `PUBLIC_URL` is
  unchanged. `/cms/` exists for the site's reads (items, assets, server).
- Mail for permaphemera.at stays at all-inkl: MX, SPF, DMARC and DKIM were copied into the
  Cloudflare zone. The wildcard `*` CNAME to kasserver is DNS-only.

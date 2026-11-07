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
extensions/              custom extensions: permaphemera-newsletter (bash hetzner/install-extension.sh)
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
bash hetzner/install-extension.sh          # copy the newsletter endpoint, restart, check it answers

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

## Under permaphemera.at (live since 2026-09-16)

The site's nginx block on the same server forwards `permaphemera.at/cms/` to
this container, so browsers only ever talk to `permaphemera.at` (some
institutional networks block third-party hosts). The site is built with
`NUXT_PUBLIC_DIRECTUS_URL=https://permaphemera.at/cms`. Editors keep using
`permaphemera.project-backends.info`. Details below, under *The public site*.

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
  Since 2026-11-04 (AI protection, `plans/2026-11-04__ai-image-protection.md`) every response
  carries `X-Robots-Tag: noai, noimageai` and `tdm-reservation: 1` (`add_header … always` in
  `location /cms/` and `location /`; `/_nuxt/` has its own `add_header` and holds only code).
  Backup of the config before that change: `permaphemera.at.bak-2026-11-04-ai` next to it.
  Since 2026-11-04 old gallery links `/locations/` and `/locations/<slug>/` (also under
  `/en/`) answer `301` to `/venues/…/` (two `location ~ ^(/en)?/locations…` blocks before
  `location /`; the browser app does the same in `pages/locations/[...slug].vue`). Backup:
  `permaphemera.at.bak-2026-11-04-locations`.
- Monthly news report (since 2026-11-04, `frontend/scripts/server/news-report.sh`): code in
  `/srv/sites/permaphemera.at/news-report/` (replaced by every deploy), settings and state in
  `/srv/sites/permaphemera.at/news-report-data/` (`mail.env`: `SMTP_URL`
  `smtp://w00c8d25.kasserver.com:587` (STARTTLS; Hetzner blocks outgoing port 465), `SMTP_USER`, `SMTP_PASS`, `NEWS_REPORT_FROM`,
  `NEWS_REPORT_TO`; `state.json`; never touched by a deploy, mode 700), log
  `/srv/sites/permaphemera.at/news-report.log`, cron of `rowild` `0 8 1 * *`. By hand:
  `sh /srv/sites/permaphemera.at/news-report/news-report.sh`.
- Certificate: Let's Encrypt via `certbot certonly --webroot -w /var/www/letsencrypt`,
  cert name `permaphemera.at`. Renewal runs by certbot's timer through port 80.
  (The Cloudflare token on the host only covers project-backends.info, so DNS-01 is not
  an option for this zone.)
- Deploy the frontend: `cd frontend && pnpm run deploy:hetzner` builds with
  `NUXT_PUBLIC_DIRECTUS_URL=https://permaphemera.at/cms` and rsyncs `.output/public`
  (tours excluded), then mirrors each local tour into its own folder under `media/tours/`
  (old files of that tour are removed; a tour that exists only on the server is kept).
- The Directus admin stays at https://permaphemera.project-backends.info; `PUBLIC_URL` is
  unchanged. `/cms/` exists for the site's reads (items, assets, server).
- Mail for permaphemera.at stays at all-inkl: MX, SPF, DMARC and DKIM were copied into the
  Cloudflare zone. The wildcard `*` CNAME to kasserver is DNS-only.
- Umami (umami.project-backends.info, stack `/srv/stacks/umami.project-backends.info`)
  serves several websites. PERMAPHEMERA's visit data is deleted after 36 months by
  `umami-retention-permaphemera.sh` (in this folder; a copy sits in the stack folder),
  run nightly at 03:17 from the crontab of `rowild`, log next to it. It touches only
  website `d7a5053b-…`; the privacy policy states the period.
- Newsletter Brevo key check (from the newsletter launch on): `brevo-keepalive.sh` (in this
  folder; `install-extension.sh` copies it to the stack folder and adds the cron line of
  `rowild` `23 4 * * 1`). It calls Brevo's `GET /account` once a week from inside the Directus
  container, because Brevo switches an API key off after 90 days without use. When it fails
  it mails `NEWS_REPORT_TO` with the news report's `mail.env`. Log
  `/srv/stacks/permaphemera.project-backends.info/brevo-keepalive.log`.

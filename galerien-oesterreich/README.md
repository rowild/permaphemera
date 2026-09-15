# Galerien in Österreich

A static directory of 657 researched galleries and art venues across all
nine Austrian states — 430 currently active, 227 historical or unclear. It
ships as a single-page dashboard (filters, statistics, and an interactive
map) with no backend: all data is bundled at build time from `src/data.ts`
and `src/austriaData.json`.

This was ported from a ChatGPT "Sites" (vinext/Cloudflare) project to a
plain static Vite build. The former ChatGPT-hosted version at
`galerien-kaernten.rowild.chatgpt.site` is retired.

## Contacting galleries

Each gallery card can show a salutation (`gallery.salutation`, e.g. "Sehr
geehrter Herr Klavora") under "Ansprechperson" when a source provided one.
The card's e-mail link pre-fills a "PERMAPHEMERA – Einladung" subject and
opens the body with that salutation (or "Sehr geehrte Damen und Herren"
when none is known). A "CSV exportieren" button in the directory toolbar
downloads the currently filtered galleries as a `;`-separated,
UTF-8-with-BOM `gvoe-export-YYYY-MM-DD.csv`.

## Reconciling against source files

`scripts/reconcile.mjs` cross-checks `carinthiaGalleries` in `src/data.ts`
against the Excel contact sheet, the HTML "explorer" data set and a plain
text note, fills in null contact fields, flags conflicts, and appends
unmatched source rows as new entries. Run it with:

```bash
node scripts/reconcile.mjs --sources <dir>   # dry run, writes docs/reconcile-*.md
node scripts/reconcile.mjs --sources <dir> --apply   # also updates src/data.ts
```

The 2026-09-15 run's sources (the xlsx, the explorer HTML, the text note,
the original `galerien-oesterreich-website-source.zip`, and the Kunstverein
Velden flyer) were moved out of `_Material/_Galerien Verzeichnis/` into
`_BU/galerien-verzeichnis-sources-2026-09-15/` on 2026-09-15, so `--sources`
now needs to point there to reproduce that run.

## Commands

```bash
nvm use            # Node 24, see .nvmrc
pnpm install
pnpm dev            # local dev server
pnpm build           # production build into dist/
pnpm check           # tsc --noEmit
pnpm preview         # serve the production build locally
pnpm run deploy:dry-run  # build + show the all-inkl upload/delete plan, no upload
pnpm run deploy          # build + upload to the live all-inkl host
```

Note: use `pnpm run deploy` (and `pnpm run deploy:dry-run`), not the bare
`pnpm deploy` — pnpm reserves that exact word for its own workspace-deploy
command and refuses to run a project script of the same name.

## Deploy

Deploys go to `gvoe.rowild.at` via SFTP (all-inkl), using
`scripts/deploy-all-inkl.sh` (lftp mirror, `--delete`, dry-run supported).

- Host: `rowild.at`, user `ssh-w00c8d25`
- Remote dir: `/www/htdocs/w00c8d25/gvoe.rowild.at`
- Key: `~/.ssh/id_ed25519_rowild_openssh` (OpenSSH format, authorized on the
  all-inkl account; password auth is disabled)

Override any of these with `GVOE_DEPLOY_USER`, `GVOE_DEPLOY_HOST`,
`GVOE_DEPLOY_REMOTE_DIR`, `GVOE_DEPLOY_KEY`, `GVOE_DEPLOY_LOCAL_DIR`. Run
`pnpm run deploy:dry-run` first — it prints the planned upload/delete list
without touching the remote host.

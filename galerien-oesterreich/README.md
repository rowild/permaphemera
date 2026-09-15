# Galerien in Österreich

A static directory of 641 researched galleries and art venues across all
nine Austrian states — 414 currently active, 227 historical or unclear. It
ships as a single-page dashboard (filters, statistics, and an interactive
map) with no backend: all data is bundled at build time from `src/data.ts`
and `src/austriaData.json`.

This was ported from a ChatGPT "Sites" (vinext/Cloudflare) project to a
plain static Vite build. The former ChatGPT-hosted version at
`galerien-kaernten.rowild.chatgpt.site` is retired.

## Commands

```bash
nvm use            # Node 24, see .nvmrc
pnpm install
pnpm dev            # local dev server
pnpm build           # production build into dist/
pnpm check           # tsc --noEmit
pnpm preview         # serve the production build locally
pnpm deploy:dry-run  # build + show the all-inkl upload/delete plan, no upload
pnpm deploy          # build + upload to the live all-inkl host
```

## Deploy

Deploys go to `gvoe.rowild.at` via SFTP (all-inkl), using
`scripts/deploy-all-inkl.sh` (lftp mirror, `--delete`, dry-run supported).

- Host: `rowild.at`, user `ssh-w00c8d25`
- Remote dir: `/www/htdocs/w00c8d25/gvoe.rowild.at`
- Key: `~/.ssh/id_ed25519_rowild_openssh` (OpenSSH format, authorized on the
  all-inkl account; password auth is disabled)

Override any of these with `GVOE_DEPLOY_USER`, `GVOE_DEPLOY_HOST`,
`GVOE_DEPLOY_REMOTE_DIR`, `GVOE_DEPLOY_KEY`, `GVOE_DEPLOY_LOCAL_DIR`. Run
`pnpm deploy:dry-run` first — it prints the planned upload/delete list
without touching the remote host.

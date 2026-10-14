# Backlog

Work that is agreed but parked for later. Newest first.

## Directus: delete the `status` field on the four relation tables

Added 2026-10-14.

Since 2026-10-14 relation rows have no status of their own (`statusless: true` in
`directus/scripts/schema.mjs`); a row is shown when every record it connects is published. The
`status` field still exists in production on these four collections:

- `pp_exhibition_participations`
- `pp_exhibition_organisers`
- `pp_organisation_memberships`
- `pp_organisation_venue_relations`

All their rows are set to `published`, and the site and the public rules ignore the field, so
nothing is hidden or broken in the meantime.

Steps:

1. Back up: `cd directus && DIRECTUS_ENV_FILE=.env.remote node scripts/export.mjs --to ../_BU/<dated-name>`.
2. Delete the four `status` fields in the admin app (Settings → Data Model). The MCP cannot delete.
3. `DIRECTUS_ENV_FILE=.env.remote node scripts/snapshot.mjs`.
4. `DIRECTUS_ENV_FILE=.env.remote node scripts/check-conventions.mjs` — it must no longer report
   "relation table still carries status".
5. `cd frontend && pnpm check:data`.

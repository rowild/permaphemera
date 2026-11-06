# Markus Saueregger: curator of the stARTup gallery

Date: 2026-11-06. Owner's request: research Markus Saueregger and add him as the curator of the
stARTup gallery (`startup-gallery-koetschach-mauthen`). He is **not** an artist.

## Jobs

1. New person `markus-saueregger` (draft), role `curator` only, no `artist` role.
2. A persons–venues row to the stARTup gallery with `relation: curator` (shows "Kurator:in" on the
   gallery page once the person is published).
3. SEO texts for the person: `directus/seo/2026-11-06-markus-saueregger.json`.

Not done: no participation row in the exhibition "Walther Preiml – Sehnsucht". No source says he
curated that exhibition by name (see worklog).

## Files

- `2026-11-06__markus-saueregger-curator/worklog.md`: sources, facts, decisions, gaps.
- `2026-11-06__markus-saueregger-curator/write-records.mjs`: creates the person (safe to run twice).

Run from `directus/`:

```sh
DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-06__markus-saueregger-curator/write-records.mjs
DIRECTUS_ENV_FILE=.env.remote node scripts/write-seo.mjs seo/2026-11-06-markus-saueregger.json --dry-run
```

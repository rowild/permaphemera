---
name: gallery-exhibition
description: Create or update a PERMAPHEMERA gallery (venue), town, organisation, artist or exhibition in the production Directus. Use when asked to add a gallery or Galerie, add or update an exhibition or Ausstellung, record a Lange Nacht der Museen presentation, refresh a venue's running and announced exhibitions, or work from a sources.txt in _360_GALLERIES_AND_TOURS/collection/.
---

# Gallery and exhibition records

The full procedure is `docs/how-to-gallery-and-exhibition.md` at the repository root.
Read it completely before the first write. It holds the rules, field conventions, stable ids,
the image and upload workflow, payload examples and the verification step.

Non-negotiables, in short:

- The `permaphemera-directus` MCP and the admin app write to **production**.
- Search before creating (venues, towns, organisations, persons by last name, links by URL).
- New records (venue, town, person, organisation, exhibition) are `draft`. Relation rows have no
  status; links are created `published`. Only published data leaves Directus.
- Venue photos only from Wikimedia Commons; exhibition images are press images with a © note,
  else the placeholder. Upload with `directus/scripts/upload-files.mjs`.
- The plain fields hold English and must equal the `en` translation; always write `en` and `de`.
- Every website, domain or social handle is a link record (`website_url` or a `pp_websites` row),
  never text. Venues: own website in `website_url`, social profiles in `websites` (3 links shown).
- Say "exhibition", never "show".
- Finish with `pnpm check:data` in `frontend/` and a report: created, changed live, conflicts
  between sources, gaps.

# Person, sponsor and organisation pages — design

Date: 2026-10-14 · Status: approved in conversation, awaiting written-spec review

## Goal

Every person in the archive (artists, curators, board members, press …) and every sponsor gets
its own detail page in the current PERMAPHEMERA design; organisation pages get a photo. Person
names become links wherever they appear. Pages carry a photo and short factual texts researched
on the web. All page texts inform and guide; no metaphors.

## Decisions taken with the owner

| Topic | Decision |
|---|---|
| Photo source | Press photos straight away: the person's or organisation's own website, then their social media. Every photo carries a © note. No Wikimedia search first. |
| Person URL | `/persons/<slug>/` for everyone (EN `/en/persons/<slug>/`). The Artists list stays artists only. |
| Sponsors | Build `/sponsors/<slug>/` now; pages stay invisible until a sponsor is published. |
| Going live | Photos and bios are written straight into Directus (published persons show them at once); the owner gets a source list to spot-check. |
| Approach | Build first (fields + pages work with archive data alone), then research and fill. |
| Visibility | Unchanged rule from 2026-10-14: only published data is shown or delivered; relation rows have no status. |

## 1. Data model (Directus, `directus/scripts/schema.mjs`)

Additive only; `create-schema.mjs` then `permissions.mjs` against production.

**`pp_persons`** — new fields:

| Field | Type | Translated | Note |
|---|---|---|---|
| `image` | file (image) | – | Press portrait |
| `image_alt` | string | yes | |
| `image_caption` | string | yes | Credit line under the photo: `<what> · Foto: <holder>` |
| `lede` | string | yes | One line under the name |
| `about` → `about_html` | JSON array of paragraphs; since 2026-10-15 WYSIWYG HTML (owner decision) | yes | Bio, 2–4 sentences per language, ends with the source domain |
| `born` | string | – | Free text, e.g. `1970, Schärding` |
| `based_in` | string | yes | e.g. `Wien` / `Vienna` |

The note "Nothing else, by decision of 2026-09-14" is replaced by a note describing the page.
This creates `pp_translations__persons`; its public rule comes from `public-rules.mjs`.

**`pp_organisations`** — new fields: `image` (file), `image_alt` (translated), `image_caption`
(translated). `logo` stays.

**`pp_sponsors`** — no new fields (title, slug, website_url, logo, description).

Same commit, per root `AGENTS.md`: `frontend/shared/archive-schema.mjs` (`TRANSLATED` gains
`pp_persons`; `FILE_FIELDS` gains `pp_persons.image`, `pp_organisations.image`),
`frontend/app/types/content.ts`, `_Plans/exhibitions-plan.md` §2.

## 2. Pages

### 2.1 Person page `app/pages/persons/[slug].vue`

Structure follows `organisations/[slug].vue`; the photo block follows `venues/[slug].vue`.

1. **Hero, left column**
   - Breadcrumb: `Archive / Artists / <name>` for persons with the artist role, else `Archive / <name>`.
   - Eyebrow: the person's roles in the archive, e.g. `Artist · Curator` (from `pp_mm__persons_roles`).
   - H1: display name. (Changed by the owner on 2026-10-14: no link under the name.)
   - Lede.
   - Fact rows (`ArchiveMetadataRow`): Born · Lives in · Member of (organisations + function,
     linked) · Galleries (`pp_mm__persons_venues`, linked) · Links: the main link (own website,
     else first social profile) on the first line, all further links on the next line; new tab.
   - Below the fact rows, in the same column (beside the photo on desktop): the About block (§3).
2. **Hero, right column — photo** with `FIG. I` caption (`image_caption`).
   Fallback: the image of the person's newest exhibition in the archive, captioned
   "From the exhibition <title>". No image at all → no photo block.
3. **About** — heading `About <name>` / `Über <name>`; bio paragraphs. Without bio:
   "There is no biography of <name> in the archive yet. The exhibitions below show <name>'s work
   in the archive."
4. **Exhibitions** — heading `Exhibitions with <name> in the archive`; `ExhibitionCard` grid,
   each with a role label (Artist / Curator), newest first. Empty: "No exhibition with <name> is
   in the archive yet."
5. **Statements** — heading `<name> in their own words`; each statement with its exhibition
   link. Only when statements exist.
6. SEO: title `<name> · <roles> · PERMAPHEMERA`; description from lede or a factual fallback.

Header active key: `artists` for artists, else none.

### 2.2 Sponsor page `app/pages/sponsors/[slug].vue`

Hero: breadcrumb `Archive / <name>`, eyebrow `Sponsor`, H1 name, website link, logo, description.
Section `Supported by <name>`: exhibitions (cards), galleries, persons, towns — each list only
when non-empty. Empty state: "<name> supports PERMAPHEMERA; no supported record is in the archive
yet."

### 2.3 Organisation page `app/pages/organisations/[slug].vue`

Adds the photo block (top of the right column, with caption) and turns member names into links
to `/persons/<slug>/`.

### 2.4 Names become links

| Place | Change |
|---|---|
| Exhibition page | Hero artist line, "Artists" row, curators row, statement author → `/persons/<slug>/` |
| Artists list (`ArtistDirectoryEntry`) | Name → person page; the "i" button keeps opening the quick preview window |
| Artist window (`ArtistExhibitionModal`) | Name heading → person page |
| Organisation page | Member names |
| Landing artist list | Name → person page |
| Exhibition cards | Unchanged (the card is one link) |

`scripts/check-artist-directory-modal.mjs` is updated to the new name behaviour.

### 2.5 Resolvers

New pure utils with unit tests: `resolvePersons` (roles, records by role, memberships, venues,
statements, links, image fallback) and `resolveSponsors`. Both follow the visibility rule: drop
anything unpublished or missing, never throw. `useArchiveData()` exposes `persons` and `sponsors`.

### 2.6 Texts

All new UI strings in `i18n/locales/de.json` and `en.json`. They name what the section shows or
what the reader can do. Examples: eyebrow `Artist`, heading `Exhibitions with Inés Urach in the
archive`, empty states as above. No metaphors.

## 3. Content research

- Persons (80: 64 published, 16 draft) and organisations (6) are researched by parallel helpers
  in batches of about ten. Per entry: press photo (own website, then social media), bio DE + EN
  (2–4 sentences: born, lives in, medium, training, main activity), `born`, `based_in`, missing
  home link.
- Only facts with a source are written; uncertain facts are left out and listed.
- Photos are uploaded with `directus/scripts/upload-files.mjs` into `media/persons/<slug>` and
  `media/organisations/<slug>`; description `© <holder>. Press photo from <site>; reuse needs the
  consent of <holder>.`
- Links are created `published`.
- The 8 demo sponsors get no content.
- Deliverable: `docs/content/2026-10-person-organisation-sources.md` — one entry per person and
  organisation: photo file, bio, facts, source URLs, open questions.

## 4. Verification and rollout

1. Unit tests for the new resolvers; `pnpm test`, `check:types`, all `check:*` scripts.
2. `frontend-qa-checklist` on a person, a sponsor and an organisation page (desktop + mobile).
3. Order: schema → permissions → frontend deploy → research and fill → `check:data` → source list.
4. The how-to (`docs/how-to-gallery-and-exhibition.md`) gains person and organisation fields.

## Out of scope

Persons index page (`/persons/`), sponsor list page, editing existing metaphorical headings on
other pages, real sponsor data.

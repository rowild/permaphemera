# Organisations: associations, federations and institutions as their own records

Date: 2026-09-23. Status: built the same day (steps 1–4); step 5 (logos row, sponsor merge) deferred. Cross-cutting (Directus + frontend), so it lives at the repository root.

## Problem

The archive has only two kinds of actors: venues (buildings) and persons (artists, curators). Real life has a third: the association that runs a gallery, presents an exhibition or organises a sale. Today that third kind has no home.

- **BV Kärnten** (Berufsvereinigung bildender Künstler Österreichs, Landesverband Kärnten) runs the BV Galerie, organises the flea market of September 2026 and has a board (Margaretha Maria Bauer, Eva Asaad, Peter Türk, …). It is stored as a *person* with the display name "BV Kärnten", because every exhibition record needs one artist participation. The artist directory then treats it as a name and inverts it to "Kärnten, BV" unless a hard-coded exception list in `frontend/app/utils/artistNames.ts` says otherwise.
- **Kunstverein Velden** presents "Spannungsfelder und Perspektiven" at the Europahaus and is not recorded at all; only its five members are.
- **ARS CARINTHIA – Kunst & Handwerk** presents "Dialog" at the Stadtgalerie and exists only as a website link.
- Four more "persons" are in fact organisations or collectives: 7th Spittaler Comicfestival, Austriatoon, Lebenshilfe Spittal, Raqs Media Collective. Owner's decision of 2026-09-23: Austriatoon is an association (organisation); Raqs Media Collective is an artist collective and stays a person; the festival and Lebenshilfe Spittal are organisations.

Two rules follow from this. An organisation is never an artist. An organisation's name is one string, shown exactly as written, never split, never inverted, and filed under its first letter.

## Decision

Add a main collection `organisations` (Directus table `pp_organisations`, following `naming.mjs`) and link it to venues, exhibitions and persons with junction tables. Persons stay people. Venues stay buildings.

### 1. The collection

| field | type | note |
|---|---|---|
| `status`, `sort`, audit | as every main collection | |
| `title` | string, required | The name, verbatim: "BV Kärnten". No first/last split exists. |
| `slug` | string, required, unique | |
| `kind` | dropdown: `association`, `federation`, `institution`, `collective`, `company`, `initiative` (allowOther) | Verein, Landesverband, Institution, Kollektiv, Firma, Initiative. Drives wording only. |
| `short_title` | string, translated, optional | e.g. "BV Kärnten" when `title` is the long official form. Shown where space is short. |
| `logo` | file (image) | Optional. |
| `logo_alt` | string, translated | |
| `founded` | string, optional | Free text: "November 1949". |
| `address` | string, optional | Seat, when it is not a venue (Kunstverein Velden: Villa Rehblick, Elisabethpromenade 2, 9220 Velden). |
| `location` | M2O → locations | The town of the seat. |
| `lede` | string, translated | One line. |
| `about` | JSON array of paragraphs, translated | |
| `description` | text, translated | |

Sections in the admin form: Title (status, title, short_title, slug, kind), Seat (address, location, founded), Media (logo, logo_alt), Relations (venues, exhibitions, members, websites), Content (lede, about, description).

### 2. The relations

All three are many-to-many junctions in the existing `junctions` list of `schema.mjs`. The two that carry a role get an extra column on the junction, which `naming.mjs` already allows (`sortedFrom` plus named extra fields, as the participations table shows).

| relation | junction | extra columns | meaning | examples |
|---|---|---|---|---|
| organisations ↔ venues | `pp_mm__organisations_venues` | `relation` dropdown: `runs`, `seat`, `exhibits_at` | The organisation runs the building, has its seat there, or exhibits there as a guest, on the venue's invitation. A guest neither runs the house nor sits there. | BV Kärnten *runs* BV Galerie Kärnten; Kunstverein Velden *exhibits at* Europahaus |
| organisations ↔ exhibitions | `pp_mm__exhibitions_organisations` | `role` dropdown: `organiser`, `presenter`, `cooperation`, `supporter` | Who put the record on | Kunstverein Velden *presents* Spannungsfelder; BV Kärnten *organises* the flea market; ARS CARINTHIA *organises* Dialog, Stadtgalerie Klagenfurt is the *cooperation* partner (a venue, not an organisation, so that stays in the text) |
| organisations ↔ persons | `pp_mm__organisations_persons` | `function` string, translated; `sort` | Board and staff, membership when it matters | Bauer: "Vizepräsidentin, Galerieleitung"; Asaad: "Pressesprecherin"; Türk: "Präsident"; the five Velden artists: "Mitglied" |
| organisations ↔ websites | `pp_mm__organisations_websites` | – | Links, like persons and exhibitions have them | bv-kaernten.at, kunstverein-velden.at |
| organisations ↔ sponsors | not now | | An organisation can also be a sponsor; that is a later merge question, see Deferred | |

### 3. Rules the checks enforce

- **An exhibition needs an artist participation *or* an organiser.** `frontend/scripts/check-data-integrity.mjs` today demands one artist per exhibition; the flea market is the case that breaks it. New rule: at least one artist participation, or at least one organisations link with role `organiser` or `presenter`.
- **No organisation among persons.** A check lists persons whose first and last name are both empty and whose display name matches no role of `artist`/`curator` use; the list must be empty once the four collectives above are migrated. Genuine artist collectives stay persons: Raqs Media Collective is one. The persons collection gets a boolean `is_collective` so the artist directory keeps such a name verbatim by data, not by a hard-coded slug list.
- **Names are verbatim.** `artistNames.ts` loses its `organizationSlugs` list: organisations no longer reach the artist directory, and collectives carry `is_collective`. The letter of an organisation or collective in any index is the first letter of `title`. "Kunstverein Velden" is always the full name; `short_title` is for a shorter official form, never for cutting a name.

### 4. What the site shows

1. **Exhibition page:** a facts row "Organised by" / "Presented by" (label follows the junction role) with the organisation name linking to its own page, next to the existing Artist / participants row. Both rows appear whenever both exist, on every exhibition, not only Velden. Card metadata does not change.
2. **Venue page:** a facts row "Run by" (or "Seat of", per relation) under the address. The about text of BV Galerie then loses the board paragraph, because the data carries it.
3. **Person entries** in the artist directory and the exhibition modal: one line "Vizepräsidentin, BV Kärnten" when a function exists. Nothing else changes for artists.
4. **Organisation directory and pages.** A directory at `/organisations/` (locale-neutral route like `/venues/`; German label "Vereine & Institutionen", English "Organisations") lists every published organisation in one alphabetical column: name, kind, seat, count of records. Each entry opens `/organisations/<slug>/` with lede, about, seat and address, the venues it runs or exhibits at, its people with functions, the exhibitions and events it organised or presented, and its links. The navigation records in Directus (`pp_navigation_items`, main menu and footer "Explore") get one entry each; the header component reads them as it does today.
5. **Frontend loader:** `frontend/shared/archive-schema.mjs` gets `organisations`, `organisationsVenues`, `organisationsExhibitions`, `organisationsPersons`, `organisationsWebsites`; `FILE_FIELDS.pp_organisations = ['logo']`; `TRANSLATED` gets `pp_organisations` and the persons junction. `app/types/content.ts` gets `OrganisationRecord` and the junction rows. `useArchiveData()` resolves the joins; components receive resolved fields, never junction rows.

### 5. Data migration (server Directus, with a backup first)

1. Create organisations: BV Kärnten (association; seat = BV Galerie; runs BV Galerie), Kunstverein Velden (association; address Villa Rehblick; uses Europahaus), ARS CARINTHIA – Kunst & Handwerk (initiative).
2. Link exhibitions: flea market ← BV Kärnten (organiser); Spannungsfelder ← Kunstverein Velden (presenter); Dialog ← ARS CARINTHIA (organiser).
3. Link persons: Bauer, Asaad, Türk → BV Kärnten with functions; Zellot, Zikulnig, Mohl, Scheikl, Campidell → Kunstverein Velden ("Mitglied"); Hösel → ARS CARINTHIA.
4. Delete the person "BV Kärnten" and its participation; remove `bv-kaernten` from `artistNames.ts`.
5. Move 7th Spittaler Comicfestival, Austriatoon and Lebenshilfe Spittal to organisations (their participations become organiser links); mark Raqs Media Collective `is_collective` and keep it a person.
6. Run `check:data`, `check:artists`, `check:i18n`; deploy.

### 6. Order of work (one commit each)

1. Schema: `directus/scripts/schema.mjs` (entity + four junctions), `naming.mjs` if a junction needs an extra named column it cannot derive, `create-schema.mjs` on local and server, `snapshot.mjs`, `_Plans/exhibitions-plan.md` §2, `frontend/shared/archive-schema.mjs`, `app/types/content.ts`.
2. Loader and resolvers: `useArchiveData()`, `resolveExhibitions.ts` (organisers), `resolveVenues.ts` (operators), artist directory (functions).
3. Site: exhibition facts row, venue facts row, person function line, the organisation directory and detail route with their navigation entries; strings in both locales; checks updated (integrity rule, artist-directory rule, a `check:organisations` route script like `check:directories`).
4. Data migration on the server, then delete the stopgap person and the slug list entry.
5. Later: organisation route, logos in a partners row, merge with sponsors.

## Deferred

- **Sponsors vs organisations.** A sponsor is an organisation in a supporting role. Merging the two collections is the cleaner end state, but the sponsor strip and its logo handling exist and work; merge after organisations are in use.
- **Venues that are also organisations.** Stadtgalerie Klagenfurt is a building and an institution. Keep it a venue; when its institutional side is needed (it cooperates on Dialog), that becomes an organisations record linked to the venue with relation `runs`.
- **Person functions over time.** Board roles change. The junction stores the current function; history is out of scope.

## Decisions of 2026-09-23

1. Austriatoon is an association; Raqs Media Collective is an artist collective and stays a person (`is_collective`).
2. Artists and organisation both appear, in two rows, on every exhibition where both exist.
3. An organisation directory with detail pages is wanted from the first step.
4. A guest relation to venues exists (`exhibits_at`): Kunstverein Velden exhibits at the Europahaus on the house's invitation and neither runs it nor has its seat there.

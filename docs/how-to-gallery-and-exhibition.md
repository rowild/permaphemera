# How to create or update a gallery (venue) and its exhibitions

For people and AI agents. Written 2026-10-14 from a real run (Europahaus, Galerie im
Schloss Porcia, Galerie Palais Fugger, stARTup gallery, Stadtgalerie programme).
Data model background: `_Plans/exhibitions-plan.md` §2. Project map: `PROJECT_INFO.md`.

Words: say **exhibition** (German *Ausstellung*), never "show". A sale or festival night is
`kind: event`.

---

## 0. Rules before you touch anything

- **Directus is production.** The MCP server `permaphemera-directus` (user level, in
  `~/.claude.json`) and the admin app <https://permaphemera.project-backends.info> both write
  to the live database. A `published` change is on <https://permaphemera.at> at once, no deploy.
- **Status lives on records, never on relations.** New venues, towns, persons, organisations
  and exhibitions start as `draft`; the owner publishes them. Relation rows (artist/curator rows,
  organisers, memberships, venue relations) have **no status** (removed 2026-10-14): a relation
  shows when every record it connects is published. Links (`pp_websites`) keep a status and are
  created as `published`; a link shows when its owner is published.
- **Only published data leaves Directus.** The public API delivers published records only, and a
  relation row only when all its ends are published (`directus/scripts/public-rules.mjs`). The
  frontend filters again. In the admin app drafts stay visible everywhere, so you can link them.
- **Published records:** wrong or out-of-date text may be fixed in place (it goes live).
- **Never delete** without the owner's written OK. The MCP has deletes switched off; the owner
  deletes in the admin app. Make a backup first
  (`DIRECTUS_ENV_FILE=.env.remote node scripts/export.mjs --to ../_BU/<dated-name>`), and
  afterwards compare against it. **Never archive** a town that a published
  venue uses: the site looks towns up by id and throws if one is missing.
- **Records, not schema.** Adding rows is fine. A new *field* or *collection* is a schema change:
  see root `AGENTS.md` ("Data model") — `directus/scripts/schema.mjs` and friends, same commit.
- **Avoid duplicates.** Search first (§2). Persons have no `title` field: query
  `first_name`, `last_name`, `display_name`.

---

## 1. Inputs

Per gallery the owner keeps a folder in
`/Users/robertwildling/Desktop/_WWW/_360_GALLERIES_AND_TOURS/collection/<venue-folder>/`:

- `sources.txt` (sometimes `untitled.txt`, or inside `_BU/`): links to the venue, the ORF
  "Lange Nacht der Museen" page, press, and the exhibitions to record.
- PDFs: invitation (*Einladung*) and poster (*Plakat*). They are the **primary source** for
  title, artists, curator, dates, vernissage and opening hours.
- 360° photos (`building_NN/…`) if the exhibition was photographed. Their date tells you
  whether a tour will exist.

**Source priority:** invitation/poster PDF → official venue or artist site → ORF Lange Nacht page
and booklet → tourism portals (kaernten.at, woerthersee.com) → press (meinbezirk, krone).
Write down every conflict (spelling, dates, hours) and report it; do not silently pick one.

---

## 2. Check what already exists

Run these reads first (MCP `items` → `read`):

| What | Collection | Filter idea |
|---|---|---|
| Venue | `pp_venues` | `title` `_icontains` a key word; list all with `slug`, `archive_number` |
| Town | `pp_locations` | `title` / `slug` |
| Verein, institution | `pp_organisations` | `title` `_icontains` |
| Artists, curators | `pp_persons` | `last_name` `_icontains` (check spelling variants: Sylvia/Silvia) |
| Exhibitions at the venue | `pp_exhibitions` | `primary_venue.slug` `_eq`, plus organiser filter |
| Links | `pp_websites` | `url` — reuse an existing row instead of a second one |

Stable ids you will need (production):

| Thing | id |
|---|---|
| role `artist` | `37b28cb2-e0ba-4081-b51b-836149de0a06` |
| role `curator` | `68b75859-8a9b-4bc8-aa98-8c6577c18fb3` |
| placeholder exhibition image | `76dbe630-c514-4983-ab42-be301a834a04` |
| placeholder venue image | `f2d3d3ea-5097-46c0-8577-0f405d6c677d` |
| town Klagenfurt am Wörthersee | `2e1e264b-ab44-48ff-9f0f-03f613f7865c` |
| town Spittal an der Drau | `25d62040-9525-4923-9efe-7a48a09d447c` |

Read one finished record of each kind as a blueprint before writing, e.g. venue
`europahaus-klagenfurt` or `galerie-im-schloss-porcia-spittal-drau`, exhibition
`epische-gemaelde` or `armin-guerino-durch-die-zeit`.

---

## 3. Images and PDFs

### Venue image: Wikimedia Commons only

Copyright: never take a venue photo from the venue's or a tourism site.

1. Find a photo of the building on Commons (search the building, the street address, or the
   *Liste der denkmalgeschützten Objekte in <Ort>*). Prefer CC BY, CC BY-SA, CC0, public domain.
   No photo of the building? Use the town centre nearby and say so in the caption.
2. Commons serves only fixed thumbnail widths now (…1280, 1920, 3840). A `/3000px-` URL returns
   HTTP 400. Download the 3840 version and scale it:
   ```sh
   curl -sfL -A "PERMAPHEMERA-archive/1.0 (https://permaphemera.at)" -o big.jpg \
     "https://upload.wikimedia.org/wikipedia/commons/thumb/<a>/<ab>/<File>.jpg/3840px-<File>.jpg"
   sips -Z 3000 big.jpg --out <venue-slug>-<what>.jpg
   ```
   If the original is narrower than 3000 px, use the original.
3. Use the same file for `image` and `hero_image`.

### Exhibition image: press image with a © note

Use the official press or invitation image (artist, venue or organiser site; the ORF Lange Nacht
page; the invitation PDF). Prefer a picture of the work over a poster with text. If there is
none, use the placeholder image and say "image to follow" in the alt text.

An exhibition with the placeholder image (or no image) does not show anywhere on the site:
not in the exhibition lists, not on the venue, person or artist pages, and its own page answers
"not found". It appears as soon as it gets a real image. So look for a real image first.

### Person and organisation photo: press photo with a © note

A person's photo is a portrait, not an artwork. Look in this order: the person's own website
(about, bio, press page), then their public Instagram or Facebook profile, then an official gallery,
organiser or museum page. An organisation's photo shows its building, an event it ran or its
members — never the logo. Folders: `media/persons/<slug>` and `media/organisations/<slug>`.
File description: `© <holder>. Press photo from <site>; reuse needs the consent of <holder>.`
Without a photo the person page shows the image of the person's newest exhibition instead.

To take an image out of a local PDF: `qlmanage -t -s 2000 -o <dir> <file.pdf>` or
`sips -s format png <file.pdf> --out page.png`, then convert to JPG.

### Upload with the script (not the MCP file import)

Some earlier imports (e.g. the Europahaus photos) sit in Directus as `application/octet-stream`
without width and height, most likely from importing by URL. Use the project script instead: it
sends the right type, so Directus reads the size, sets the credit line, and reuses a file with
the same folder and name:

```sh
cd "/Users/robertwildling/Desktop/_WWW/_WEBSITE PERMAPHEMERA/directus"
DIRECTUS_ENV_FILE=.env.remote node scripts/upload-files.mjs manifest.json
```

```json
[
  { "key": "venue", "url": "https://…/3840px-….jpg", "filename": "palais-fugger-theaterplatz-5-klagenfurt.jpg",
    "folderPath": "media/galerie-palais-fugger-klagenfurt",
    "title": "Palais Fugger, Theaterplatz 5, Klagenfurt",
    "description": "Foto: Johann Jaritz, CC BY-SA 4.0, via Wikimedia Commons. Source: https://commons.wikimedia.org/wiki/File:….jpg. Scaled to 3000 px from the original." },
  { "key": "work", "localPath": "/path/to/endzeit.jpg", "filename": "ingrid-proeller-endzeit-2022.jpg",
    "folderPath": "media/galerie-im-schloss-porcia-spittal-drau",
    "title": "Ingrid Pröller, Endzeit, 2022",
    "description": "© Ingrid Pröller. Image from the invitation of the Galerie im Schloss Porcia (2026); reuse needs the consent of the artist and the gallery." },
  { "key": "pdf", "localPath": "/path/to/Einladung.pdf", "filename": "einladung-ingrid-proeller-epische-gemaelde-2026.pdf",
    "folderPath": "media/galerie-im-schloss-porcia-spittal-drau",
    "title": "Invitation: Ingrid Pröller – Epische Gemälde (Galerie im Schloss Porcia, 2026)",
    "description": "Source: Galerie im Schloss Porcia / Kulturamt Spittal an der Drau. Reuse needs the consent of the gallery." }
]
```

Conventions:

| Field | Venue photo | Press image | Invitation PDF |
|---|---|---|---|
| folder | `media/<venue-slug>` | `media/<venue-slug>` | `media/<venue-slug>` |
| filename | `<building>-<street>-<town>.jpg` | `<artist>-<work>-<year>.jpg` | `einladung-<artist>-<title>-<year>.pdf` |
| title | building, address, town | Artist, Work, year, technique | `Invitation: <Artist> – <Title> (<Venue>, <year>)` |
| description | `Foto: <Author>, <Licence>, via Wikimedia Commons. Source: <file page>. Scaled to 3000 px from the original.` | `© <holder>. Press image from <site>; reuse needs the consent of <artist and/or venue>.` | `Source: <site or body>. Reuse needs the consent of <…>.` |

Look at every image before you upload it (open a small preview).

---

## 4. Town (`pp_locations`), only if missing

`title` (official name), `slug` (`koetschach-mauthen`), `postal_code`, `state` `Carinthia`,
`country` `Austria`, `latitude` / `longitude` (town centre, 4 decimals), `description` and
`translations` en + de (one sentence). Status `draft`; publish it together with its venue (a
published venue in a draft town does not show).

---

## 5. Venue (`pp_venues`)

| Field | Rule |
|---|---|
| `title` | The name the venue uses ("Galerie im Schloss Porcia", "stARTup gallery") |
| `slug` | `<name>-<town>`, lowercase, umlauts as ae/oe/ue/ss: `galerie-palais-fugger-klagenfurt` |
| `type` | `gallery`, `museum`, `kunsthalle`, `art_cafe`, `open_air`, `forum` (a cultural centre like the Europahaus is `forum`) |
| `location` | town id |
| `part_of` | parent venue for a space run by another venue (Alpen-Adria-Galerie → Stadtgalerie) |
| `archive_number` | next free two-digit number (read the highest first; 36 was the last on 2026-10-14) |
| `address` | `Street No, PLZ Town, Austria` |
| `latitude`, `longitude` | the building (OpenStreetMap / Denkmalliste), 5 decimals |
| `coordinate_label` | DMS: `46° 47′ 52″ N · 13° 29′ 45″ E` |
| `website_url` | the venue's own website only. None, or offline? Leave it empty. |
| `websites` | further links, usually social profiles (Instagram, Facebook), as `pp_websites` rows with `kind: social`, in order. The venue page shows at most 3 links: `website_url` first, then these. Without own website the first social profile leads. |
| `image`, `hero_image` | the Commons photo; `image_alt`, `hero_image_alt` in English |
| `image_caption` | `<what> · Foto: <Author> (<Licence>)` |
| `lede` | one line |
| `about_html` | WYSIWYG text, 1–2 paragraphs: building, history, who runs it, opening hours. Paragraphs, bold, italic and lists only; no links (they go into link records). Via the API write HTML: `<p>…</p><p>…</p>` |
| `description` | one sentence |
| `translations` | `en` and `de` with `lede`, `about_html`, `description`, `image_caption`, `coordinate_label` |

The plain fields hold the **English** text and must equal the `en` translation word for word
(`pnpm check:data` tests this).

Who runs the venue: a Verein or institution → `pp_organisation_venue_relations`
(`runs` / `seat` / `exhibits_at`). A city department running its own gallery (Stadtgalerie,
Galerie Porcia) gets no organisation record; name it in `about_html`. A person the venue represents
(e.g. Harald Scheicher at the Galerie Palais Fugger) → `pp_mm__persons_venues`.

---

## 6. Organisation (`pp_organisations`), only when a body puts on the exhibition

`title` verbatim, `slug`, `kind` (`association` = Verein, `federation`, `institution`,
`collective`, `company`, `initiative`), `location`, `address`, `founded`, `lede`, `about_html` (WYSIWYG),
`description`, `image` + `image_alt` + `image_caption` (photo, see §3), translations. Link it to the exhibition in `pp_exhibition_organisers` with
`role`: `organiser` (put it on), `presenter` (shows it as its own programme), `cooperation`,
`supporter`. Do not add umbrella events (ORF Lange Nacht) or a frame without organising role
(Triennale IV Kärnten) as organisers; name them in the text and add their link.

---

## 7. Persons (`pp_persons`)

- Search first (§2). Spelling from the most official source; note variants in the report.
- `first_name`, `last_name`, `middle_initial` ("K."), `display_name` only for pseudonyms or
  collectives (`is_collective`). `slug` = `first-last` without accents (`ines-urach`).
- `roles`: `[{ "roles_id": <artist or curator id> }]`. An existing person in a new role gets a
  new `pp_mm__persons_roles` row.
- Personal website or Instagram → nested `websites` with `kind` `website` / `social`, status
  `published`. The artist window shows **one** link right under the name: the first `website`, else
  the first link. The person page lists all links in its Links row, that main link first on its own line. Put the own website first. Check that the URL loads (`curl -sIL -o /dev/null -w '%{http_code}' <url>`);
  a dead link is worse than none.
- Every published person has a page at `/persons/<slug>/` (English `/en/persons/<slug>/`). It shows:
  `image` (portrait, see §3) with `image_alt` and `image_caption` (`<Name> · Foto: <holder>`),
  `lede` (one line), `about_html` (WYSIWYG biography, the last sentence names the source:
  `Quelle: <domain>.`), `born` (`1970, Schärding`), `based_in` (`Wien` / `Vienna`), the roles, the
  links, the memberships, the galleries and every published exhibition with the person.
  Translated: `based_in`, `image_alt`, `image_caption`, `lede`, `about_html` — write `en` and `de`; the
  plain fields hold English. Only facts with a source; no metaphors, no praise words.

---

## 8. Exhibition (`pp_exhibitions`)

| Field | Rule |
|---|---|
| `title` | as on the invitation; Stadtgalerie style `Artist – Title`, else the title |
| `slug` | title slug (`epische-gemaelde`), add artist/venue/year if needed |
| `kind` | `exhibition` or `event` |
| `primary_venue` | venue id; travelling exhibitions add `further_venues` |
| `start_date` / `end_date` | first and last **public** day of the run. The vernissage evening goes into `vernissage`, not into `start_date`. One-night presentations: same date twice. |
| `date_range` | EN `12 September–24 October 2026`, DE `12. September–24. Oktober 2026` (Austrian `Jänner`) |
| `opening_hours`, `vernissage`, `medium` | short text, EN on the record, DE in the translation |
| `admission` | the price as the source states it (`€ 5, reduced € 3`), EN and DE. Leave it empty only when admission is free: the site then shows "Free admission" / "Eintritt frei". Unknown admission: ask, or leave empty and report it |
| `image`, `image_alt` | §3; alt ends with `(© holder)` |
| `source_pdf` | the invitation PDF file id, if there is one |
| `summary` | one line |
| `description` | 60–130 words, own words, neutral archive tone, ends with `Source: <domains>` (DE `Quelle: …`) |
| `participations` | nested rows `{ person, role, sort }` (no status); artists in the order of the invitation, curator first |
| `websites` | `[{ "websites_id": <existing id> }]` or a nested new link with en/de titles |
| `translations` | `en` and `de`: `title`, `summary`, `description`, `date_range`, `opening_hours`, `vernissage`, `admission`, `medium`, `image_alt` |

### Tour fields

| Situation | `tour_status` | `tour_available_from` | Text |
|---|---|---|---|
| Photographed or will be photographed | `available` | day after `end_date` | Before that date the site shows the date. Add to summary: "The 360° tour will be available here from <date>." |
| Photographed, date passed, files not yet published | `available` | as above | Site shows "being prepared". Text: "PERMAPHEMERA recorded the exhibition as a 360° tour, which is being prepared for publication here." |
| Tour published | `available` | as above | `pnpm tour:publish <id>` sets `tour` (see `PROJECT_INFO.md` §3) |
| Not photographed | `unavailable` | empty | no tour sentence |
| Rights holder forbids it | `restricted` | empty | |

Announcements start the summary with "Announcement:" and the description with
"Announcement. This exhibition has not opened yet." **Remove both once the exhibition opens.**

### Minimal create payload (MCP `items` → `create`, collection `pp_exhibitions`)

```json
[{ "status": "draft", "kind": "exhibition", "title": "…", "slug": "…",
   "primary_venue": "<venue id>", "start_date": "2026-09-12", "end_date": "2026-10-24",
   "date_range": "12 September–24 October 2026", "opening_hours": "…", "vernissage": "…",
   "medium": "…", "image": "<file id>", "image_alt": "… (© …)", "source_pdf": "<file id>",
   "tour_status": "available", "tour_available_from": "2026-10-25",
   "summary": "…", "description": "… Source: …",
   "translations": [
     { "languages_code": "en", "title": "…", "date_range": "…", "opening_hours": "…", "vernissage": "…",
       "medium": "…", "image_alt": "…", "summary": "…", "description": "…" },
     { "languages_code": "de", "title": "…", "date_range": "…", "opening_hours": "…", "vernissage": "…",
       "medium": "…", "image_alt": "…", "summary": "…", "description": "… Quelle: …" } ],
   "participations": [ { "person": "<person id>", "role": "<artist role id>", "sort": 1 } ],
   "websites": [ { "websites_id": "<website id>", "sort": 1 } ] }]
```

Update a translation by its id: `"translations": { "update": [ { "id": 37, "description": "…" } ] }`.
Get the ids with a read of `pp_translations__exhibitions` filtered by `exhibitions_id`.

---

## 8a. Links are always link records, never text

Never write a URL, a domain or a handle ("@galeriepalaisfugger") into `about_html`, `description`
or any other text: the site cannot click it. Every external address goes into a link field
(`website_url`) or a `pp_websites` row (venue, person, organisation, exhibition). The site
opens all of them in a new tab. Known platforms show their name ("Instagram", "Facebook"),
a website its host name ("galerie3.com").

---

## 9. Updating an existing gallery or exhibition

Check each running and announced exhibition against the newest invitation/press PDF:

- Stale wording: "Announcement" / "has not opened yet" after the opening date.
- Dates: `start_date` must be the first public day, not the vernissage day.
- Title additions (Grabmayr → "Franz Grabmayr – Alles Farbe").
- Missing artists and curators (DIALOG had 1 of 15 artists, no curator).
- Dead links (`arminguerino.at` did not resolve; the invitation said `guerino.at`).
- New announced exhibitions on the venue's preview page (*Ausstellungsvorschau*): create them
  with the placeholder image and a short "Title and further details have not been published
  yet" text.

Update the record field **and** its `en` translation together.

---

## 10. Verify and hand over

1. Read every new or changed record back (MCP read with the fields you wrote).
2. Run the data check against production:
   ```sh
   cd "/Users/robertwildling/Desktop/_WWW/_WEBSITE PERMAPHEMERA/frontend" && nvm use && pnpm check:data
   ```
3. Report to the owner: what was created (admin links), what was changed live, every conflict
   between sources, and what is still missing (image, run dates, curator).
4. The owner checks the drafts in the admin app and publishes the records: town, venue,
   persons, organisations, exhibition. Relations and links need no publishing; they appear as
   soon as the records they connect are published.

---

## Lessons from 2026-10-14

- Europahaus, Kunstverein Velden and its exhibition already existed: always search first.
- "eventuell 7 Künstler:innen" meant *maybe*; every source named 5. Record what sources show.
- Spellings differ between sources (Sylvia/Silvia Campidell, Walther/Walter Preiml):
  prefer the artist's own invitation or website, flag the rest.
- A venue may have no website (Galerie Palais Fugger: Instagram only) or a dead one
  (startupgallery.at): leave `website_url` empty and add the social profile to the venue's
  `websites`.
- One-night Lange Nacht presentations are exhibitions with `start_date` = `end_date`, unless a
  source shows a longer run (Walther Preiml "Sehnsucht" ran to 31 December).

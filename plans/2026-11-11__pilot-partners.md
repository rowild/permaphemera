# Pilot partners (and later sponsors): plan (2026-11-11)

Status: **plan only**, nothing built. Owner's request (2026-11-11): galleries that trusted the
project from the beginning get a special status ("pilot partnership"): their logo shown, free
360° shoots always, and more. They need their own place on the website and a clear link to it
from the start page. The same concept is to work for sponsors later.

---

## 1. What a pilot partner is

A **pilot partner** is a gallery (venue) or the body that runs it (organisation) that took part
before the archive was public and lets its exhibitions be photographed.

The status is a **record of fact** ("partner since June 2026"), not a ranking. Text rules apply
(`docs/text-rules.md`): no praise words ("trusted", "outstanding"), no "we". Facts only: since
when, how many tours, what the partnership includes.

Wording proposal (owner to choose, §8 Q1):

| | German | English |
|---|---|---|
| Name of the status | Pilotpartner | Pilot partner |
| Line under the page title | Galerien, die seit Beginn mit PermaPhemera arbeiten | Galleries working with PermaPhemera since the start |
| Badge on a gallery | Pilotpartner seit Juni 2026 | Pilot partner since June 2026 |

What the partnership includes (owner's list, kept in one place, shown on the partner page):

- the gallery's logo on the partner page, its gallery page and its exhibition pages;
- free 360° shoots of its exhibitions, without limit in time (owner, 2026-11-11);
- a link to its own website in every place it appears;
- (to decide) first in line for new features, a mention in the newsletter when a tour of the
  gallery goes online, a printed certificate / window sticker "Pilotpartner von PermaPhemera".

Candidates from the data (galleries with tours online today, 2026-11-11): Parkschlössl Spittal
(9 tours), Theatergalerie Klagenfurt (2), Europahaus Klagenfurt (2), Galerie im Schloss Porcia,
Galerie im Stiegenhaus, BV Galerie Kärnten, Studiogalerie im Stadthaus, Living Studio,
Wallnerhaus, stARTup gallery (1 each). The owner decides who is a pilot partner; a gallery shows
as one only with its written consent to the logo use.

## 2. Data model

One new collection that serves pilot partners now and sponsors later, instead of fields spread
over venues, organisations and sponsors.

```
pp_partnerships                       (one row = one partnership)
├─ status          draft | published   (only published rows show)
├─ kind            pilot | sponsor | supporter          (dropdown; sponsors later)
├─ venue           → pp_venues        ┐ exactly one of the three is set
├─ organisation    → pp_organisations ├ (a gallery, the Verein behind it,
├─ sponsor         → pp_sponsors      ┘  or a sponsor)
├─ since           date               (shown as "since June 2026")
├─ logo            file (optional: overrides the linked record's logo)
├─ logo_alt        translated
├─ statement       WYSIWYG, translated (a sentence by the partner, optional, with source)
├─ consent_note    text, internal (when and how the logo consent was given; never shown)
└─ sort            integer (order on the partner page)
```

- Venues get no logo field: the logo comes from the partnership row, or from the organisation
  that runs the venue (`pp_organisations.logo` exists, filled for kultur.im.puls since today).
- What a partnership includes is the same for all pilot partners: one text in a singleton
  (`pp_partnership_page`: intro, benefits list, "become a partner" text, all translated), not
  per row.
- `pnpm check:data` gets three rules: exactly one link per row; a published row needs a
  published record behind it; a published pilot row needs a logo (own or via organisation).

Schema change: `directus/scripts/schema.mjs`, `frontend/app/types/content.ts`,
`docs/exhibitions-plan.md` §2 in the same commit (root `AGENTS.md`, "Data model").

## 3. Places on the website

### 3.1 The partner page `/partners/` (German `/partners/` too, as all paths)

```
┌──────────────────────────────────────────────────────────────────────┐
│ PARTNER ───────                                                       │
│ Pilotpartner                                                          │
│ Galerien, die seit Beginn mit PermaPhemera arbeiten.                  │
├──────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │   [LOGO]     │ │   [LOGO]     │ │   [LOGO]     │ │   [LOGO]     │ │
│ │ Parkschlössl │ │ Galerie im   │ │ Europahaus   │ │ Theater-     │ │
│ │ Spittal      │ │ Stiegenhaus  │ │ Klagenfurt   │ │ galerie      │ │
│ │ seit 06/2026 │ │ seit 09/2026 │ │ seit 10/2026 │ │ seit 11/2026 │ │
│ │ 9 Rundgänge →│ │ 1 Rundgang  →│ │ 2 Rundgänge →│ │ 2 Rundgänge →│ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
├──────────────────────────────────────────────────────────────────────┤
│ Was die Partnerschaft umfasst            │ Partner werden            │
│ • Logo auf Partner-, Galerie- und        │ Text + Kontakt-Link       │
│   Ausstellungsseiten                     │ (/contact/)               │
│ • kostenlose 360°-Aufnahmen, unbefristet │                           │
│ • …                                      │                           │
├──────────────────────────────────────────────────────────────────────┤
│ FÖRDERNDE ─────  (later, same cards, kind = sponsor)                  │
└──────────────────────────────────────────────────────────────────────┘
```

- One card component for every partnership row (`PartnerCard`): logo, name, town, "since",
  number of tours online (from `newestOnlineTours`), link to the gallery page. Sponsors later use
  the same card with their own link.
- Order: `sort`, then `since`.
- Navigation: footer group "Information" gets "Partner"; the page is in the sitemap and has its
  own SEO texts.

### 3.2 The clear link on the start page

A slim band right after the first section ("Soeben bewahrt") and before "Aus dem Archiv": the
partners' logos in one row, with the link. It sits where every visitor passes, but below the
tours, which stay the start page's main content.

```
HERO
┌─ 360°-RUNDGÄNGE · Soeben bewahrt ─────────────┬─ AKTUELLES ─┐
│ [tour] [tour]                                 │ news        │
│ [tour] [tour]      Alle Ausstellungen ansehen →│ news        │
│ Aktuelle Ausstellungen  [ ][ ][ ][ ][ ] →      │             │
│ Kommende Ausstellungen  [ ][ ][ ][ ][ ] →      │             │
└───────────────────────────────────────────────┴─────────────┘
┌─ PILOTPARTNER ───────────────────────────────────────────────┐   ← new band
│ [logo] [logo] [logo] [logo] [logo] [logo]   Alle Pilotpartner →│
└──────────────────────────────────────────────────────────────┘
AUSSTELLUNGEN · Aus dem Archiv
RÄUME · Galerien in Österreich
…
FOOTER: Fördernde & Partner:innen (sponsor row, as today)
```

- Logos in one colour (the site's ink, `opacity` like the sponsor row), full colour on hover;
  each logo links to its gallery page; on phones the row scrolls sideways (the same slider as
  the small exhibition rows).
- Fewer than three pilot partners published: the band shows the names as text instead of logos
  (a band of one logo looks empty). None published: no band.

### 3.3 Where a pilot partner shows elsewhere

| Place | What changes |
|---|---|
| Gallery page `/venues/<slug>/` | Badge under the title "Pilotpartner seit Juni 2026" (link to `/partners/`), logo beside the facts |
| Galleries overview `/venues/` | Small badge on the card; filter "Pilotpartner" next to the countries |
| Exhibition page of a partner gallery | Logo small beside the gallery name in the facts box |
| Footer | Link "Partner" in "Information"; the sponsor row stays for sponsors |
| Newsletter (later) | "Neu online" items of partner galleries carry the badge |

### 3.4 Sponsors (later, same concept)

The footer row "Fördernde & Partner:innen" already shows sponsors (`pp_sponsors`, 8 drafts with
logos). With `pp_partnerships.kind = sponsor` they get the same card on `/partners/` (own
section "Fördernde") and keep their footer row. Sponsor tiers, if wanted, become a dropdown on
the partnership row; the page groups by tier.

## 4. Order of work (when the owner says go)

1. Schema: `pp_partnerships` + singleton `pp_partnership_page` (draft rows only), check:data rules.
2. Resolver `resolvePartnerships` + unit tests; `PartnerCard` + component test.
3. Page `/partners/` (texts de/en, SEO), footer link, sitemap.
4. Start page band; gallery page badge and logo; overview badge and filter.
5. Data: the owner's list of pilot partners, logos (from the galleries, with consent), "since"
   dates (first tour or first contact, owner decides).
6. Browser tests (band visible with ≥ 3 logos, badge links to `/partners/`, phone scroll),
   release.

## 5. Questions for the owner (before building)

1. **Name:** "Pilotpartner" (proposal), "Galerie der ersten Stunde" or another?
2. **Who:** which galleries are pilot partners now, and does the status end (e.g. after the
   first year), or stay for good?
3. **Since when:** the day of the first shoot, the first tour online, or the day the
   partnership was agreed?
4. **Benefits:** confirm the list in §1 (logo, free shoots for good, link) and decide the
   optional ones.
5. **Consent:** a short written logo consent per gallery (a one-paragraph email is enough);
   should the site wait for it (proposal: yes, `consent_note` must be filled to publish)?
6. **Sponsors:** keep the footer row as the sponsors' place and add the `/partners/` section,
   or move sponsors fully to `/partners/`?

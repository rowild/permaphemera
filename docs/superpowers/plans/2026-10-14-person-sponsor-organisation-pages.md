# Person, Sponsor and Organisation Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Give every person and sponsor a detail page, add a photo to organisation pages, link person names site-wide, and fill photos and short bios from web research.

**Architecture:** Additive Directus fields (persons, organisations) feed two new pure resolvers (`resolvePersons`, `resolveSponsors`) exposed by `useArchiveData()`. Two new Nuxt pages reuse the organisation page structure and the venue figure. Research runs last, in parallel batches, and writes through the MCP and `upload-files.mjs`.

**Tech Stack:** Nuxt 4 (static SPA), Vue 3, Tailwind v4, vitest, Directus 11 (SQLite), Node 24 (`frontend/.nvmrc`), pnpm.

**Spec:** `docs/superpowers/specs/2026-10-14-person-sponsor-organisation-pages-design.md`

## Global Constraints

- Run frontend commands in `frontend/` after `source ~/.nvm/nvm.sh && nvm use`.
- Directus admin scripts run in `directus/` with `DIRECTUS_ENV_FILE=.env.remote` (production). Back up first: `node scripts/export.mjs --to ../_BU/<dated-name>`.
- Schema changes go through `directus/scripts/schema.mjs` + `create-schema.mjs` (additive), then `permissions.mjs`, then `snapshot.mjs`. Same change set: `frontend/shared/archive-schema.mjs`, `frontend/app/types/content.ts`, `_Plans/exhibitions-plan.md` §2.
- Visibility: only published records render; relation rows have no status; resolvers drop missing/unpublished ends and never throw.
- Tailwind: no bracketed font sizes, no `<style>` blocks, structural markers keep inner spaces (`[ person-hero ]`); run `pnpm check:tailwind`.
- Every UI string in both `i18n/locales/en.json` and `de.json`; run `pnpm check:i18n`.
- Wording: "exhibition", never "show". Texts inform or guide; no metaphors.
- External links: `target="_blank" rel="noreferrer"`.
- No git commits unless the owner asks (the owner closes out with `fin-patch`).
- Deploy only with `pnpm deploy:hetzner` after all checks pass.

## Review Focus

1. A published person with no role, no record, no bio and no photo → page renders all empty states, no image block, no crash (test in Task 3).
2. A person whose only exhibition is a draft → no records, no fallback image (test in Task 3).
3. A collective or pseudonym (`display_name`, empty first/last name) → name shown exactly as written on the page and in links (test in Task 3).
4. A curator or board member without the artist role → breadcrumb without "Artists", eyebrow shows the role, header has no active item (test in Task 3 for `isArtist`; template in Task 6).
5. Unknown slug on `/persons/x/` or `/sponsors/x/` → 404 page, not a blank page (check in Task 9).

---

### Task 1: Directus fields for persons and organisations

**Files:**
- Modify: `directus/scripts/schema.mjs` (entities `persons`, `organisations`)
- Modify: `directus/scripts/build.test.mjs` (expected collection list)
- Modify: `frontend/shared/archive-schema.mjs` (`TRANSLATED`, `FILE_FIELDS`)
- Modify: `frontend/app/types/content.ts` (`PersonRecord`, `OrganisationRecord`)
- Modify: `_Plans/exhibitions-plan.md` §2 (persons and organisations field lists)

**Interfaces:**
- Produces: `PersonRecord` gains `image: string | null`, `image_alt: string | null`, `image_caption: string | null`, `lede: string | null`, `about: string[] | null`, `born: string | null`, `based_in: string | null`, `translations: TranslationEntry[]`. `OrganisationRecord` gains `image: string | null`, `image_alt: string | null`, `image_caption: string | null`.

- [x] **Step 1: Update the expected collections test (fails first)**

In `directus/scripts/build.test.mjs` change the test name `'the expected 38 prefixed collections exist'` to `'the expected 39 prefixed collections exist'` and insert `'pp_translations__persons',` after `'pp_translations__organisations',` in the expected array.

- [x] **Step 2: Run it**

Run: `cd directus && node --test scripts/build.test.mjs`
Expected: FAIL (39 expected, 38 built).

- [x] **Step 3: Add the fields in `schema.mjs`**

Replace the `persons` entity `note`, `fields` and `layout` with:

```js
    note: 'People and collectives: artists, curators, board members, press. Each published person has a page at /persons/<slug>/ with photo, intro line, biography, facts, links, memberships and exhibitions.',
    fields: [
      str('first_name', { width: 'half' }),
      str('last_name', { width: 'half' }),
      str('middle_initial', { width: 'half' }),
      str('display_name', { width: 'full', note: 'Pseudonym or collective name. Shown instead of first + last when set.' }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
      bool('is_collective', { width: 'half', note: 'An artist collective (e.g. Raqs Media Collective): the site shows display_name exactly as written and never inverts it to "Family, Given". Associations and institutions are not persons; they belong in organisations.' }),
      str('born', { width: 'half', note: 'Free text, e.g. "1970, Schärding".' }),
      str('based_in', { width: 'half', translated: true, note: 'Where the person lives and works, e.g. "Wien" / "Vienna".' }),
      file('image', { image: true, note: 'Press portrait. Credit goes into image_caption.' }),
      str('image_alt', { width: 'half', translated: true }),
      str('image_caption', { translated: true, note: 'Credit line under the photo: "<what> · Foto: <holder>".' }),
      str('lede', { translated: true, note: 'One line under the name on the person page.' }),
      jsonArray('about', { translated: true, note: 'Biography: JSON array of paragraph strings; the last one names the source.' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'first_name', 'last_name', 'middle_initial', 'display_name', 'slug', 'is_collective', 'roles']),
      section('facts', 'Facts', ['born', 'based_in']),
      section('media', 'Photo', ['image', 'image_alt', 'image_caption']),
      section('text', 'Text', ['lede', 'about']),
      section('links', 'Links', ['websites']),
      section('relations', 'Relations', ['participations', 'memberships', 'venues', 'sponsors']),
    ],
```

In the `organisations` entity add after `str('logo_alt', …)`:

```js
      file('image', { image: true, note: 'Press photo of the organisation. Credit goes into image_caption.' }),
      str('image_alt', { width: 'half', translated: true }),
      str('image_caption', { translated: true, note: 'Credit line under the photo.' }),
```

and change its layout line `section('media', 'Media', ['logo', 'logo_alt']),` to `section('media', 'Media', ['logo', 'logo_alt', 'image', 'image_alt', 'image_caption']),`. Set `export const SCHEMA_VERSION = '2026-10-14.3'`.

- [x] **Step 4: Run all schema tests**

Run: `cd directus && node --test scripts/*.test.mjs`
Expected: PASS (24 or more, 0 fail).

- [x] **Step 5: Frontend data contract**

In `frontend/shared/archive-schema.mjs`: add `'pp_persons'` to `TRANSLATED`; set `FILE_FIELDS.pp_persons = ['image']` and `FILE_FIELDS.pp_organisations = ['logo', 'image']`.

In `frontend/app/types/content.ts` extend:

```ts
export interface PersonRecord {
  id: string
  slug: string
  first_name: string
  last_name: string
  middle_initial: string | null
  /** Pseudonym or collective name; shown instead of first + last when set. */
  display_name: string | null
  /** An artist collective: display_name is shown exactly as written, never inverted to "Family, Given". */
  is_collective: boolean
  born?: string | null
  based_in?: string | null
  image?: string | null
  image_alt?: string | null
  image_caption?: string | null
  lede?: string | null
  about?: string[] | null
  status: ContentStatus
  sort: number
  translations?: TranslationEntry[]
}
```

and add to `OrganisationRecord`: `image?: string | null`, `image_alt?: string | null`, `image_caption?: string | null`. (Optional, so existing test fixtures stay valid.)

- [x] **Step 6: Document the fields**

In `_Plans/exhibitions-plan.md` §2, append to the `pp_persons` field list: `born`, `based_in` (translated), `image` (file), `image_alt`, `image_caption` (translated), `lede` (translated), `about` (translated JSON paragraphs) — added 2026-10-14 for the person page. Append `image`, `image_alt`, `image_caption` (translated) to the `pp_organisations` list.

- [x] **Step 7: Apply to production**

```bash
cd directus
DIRECTUS_ENV_FILE=.env.remote node scripts/export.mjs --to ../_BU/directus-data-remote-2026-10-14-pre-person-fields
DIRECTUS_ENV_FILE=.env.remote node scripts/create-schema.mjs
DIRECTUS_ENV_FILE=.env.remote node scripts/permissions.mjs
DIRECTUS_ENV_FILE=.env.remote node scripts/snapshot.mjs
```
Expected: `+ pp_translations__persons`, new fields on `pp_persons` and `pp_organisations`, `+ pp_translations__persons` public rule.

- [x] **Step 8: Verify**

Run: `cd frontend && pnpm -s test && pnpm -s check:data`
Expected: all tests pass; `Data integrity OK`.

---

### Task 2: Person slugs on exhibition credits

**Files:**
- Modify: `frontend/app/utils/resolveExhibitions.ts` (`ResolvedExhibitionArtist`, `toCredit`, statements)
- Test: `frontend/test/unit/resolveExhibitions.spec.ts`

**Interfaces:**
- Produces: `ResolvedExhibitionArtist.slug: string`; each `ResolvedExhibition.statements[i].artist_slug: string`.

- [x] **Step 1: Update tests (fail first)**

In the test `'exposes each linked artist with its links, the exhibition links and the venue website'` add `slug: 'sylvia-campidell'` and `slug: 'judith-maria-kulle'` to the two expected artist objects. In `'attaches statements in sort order, localized, and drops empty ones'` change the `toMatchObject` to `{ artist: 'Sylvia Campidell', artist_slug: 'sylvia-campidell', prompt: 'How did you approach the room?', text: 'Words about the room' }`.

- [x] **Step 2: Run**

Run: `cd frontend && pnpm -s vitest run test/unit/resolveExhibitions.spec.ts`
Expected: FAIL (missing `slug`, `artist_slug`).

- [x] **Step 3: Implement**

```ts
export interface ResolvedExhibitionArtist {
  id: string
  slug: string
  name: string
  /** The first link of kind "website", or the first link at all. */
  website_url?: string
  websites: ResolvedLink[]
}
```

Add `artist_slug: string` to `ResolvedStatement` (after `artist: string`). In `toCredit` return `{ id: person.id, slug: person.slug, name: displayPersonName(person), website_url: primary?.url, websites: links }`. In the statements `flatMap` add `artist_slug: person.slug` next to `artist: displayPersonName(person)`.

- [x] **Step 4: Run**

Run: `pnpm -s vitest run test/unit/resolveExhibitions.spec.ts`
Expected: PASS.

---

### Task 3: `resolvePersons`

**Files:**
- Create: `frontend/app/utils/resolvePersons.ts`
- Test: `frontend/test/unit/resolvePersons.spec.ts`

**Interfaces:**
- Consumes: `linksThrough`, `linkLabel` (`app/utils/externalLinks.ts`), `displayPersonName`, `ResolvedExhibition`, `ResolvedLink` (`app/utils/resolveExhibitions.ts`), `isVisible`, `pickTranslation`.
- Produces:

```ts
export interface PersonRole { slug: string, title: string }
export interface PersonRecordLink { role: string, exhibition: ResolvedExhibition }
export interface PersonStatement { id: string, prompt?: string, text: string, exhibitionSlug: string, exhibitionTitle: string }
export interface PersonImage { src: string, alt: string, caption?: string, fromExhibition?: string }
export interface ResolvedPerson {
  id: string
  slug: string
  name: string
  roles: PersonRole[]
  isArtist: boolean
  lede?: string
  about?: string[]
  born?: string
  basedIn?: string
  image?: PersonImage
  home?: { url: string, label: string }
  links: ResolvedLink[]
  memberships: ArtistMembership[]
  venues: { slug: string, name: string }[]
  records: PersonRecordLink[]
  statements: PersonStatement[]
}
export interface PersonSources {
  persons: PersonRecord[]
  roles: RoleRecord[]
  personRoles: PersonRoleLink[]
  participations: ParticipationRecord[]
  exhibitions: ResolvedExhibition[]
  statements: ExhibitionStatement[]
  memberships: OrganisationMembershipRecord[]
  organisations: OrganisationRecord[]
  venues: VenueRecord[]
  personsVenues: JunctionRow[]
  websites: WebsiteRecord[]
  personsWebsites: JunctionRow[]
  locale: string
}
export const resolvePersons: (sources: PersonSources) => ResolvedPerson[]
```

- [x] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { resolvePersons, type PersonSources } from '~/utils/resolvePersons'

const person = (id: string, extra: Record<string, unknown> = {}) => ({
  id, slug: id, first_name: 'Ina', last_name: id, middle_initial: null, display_name: null,
  is_collective: false, status: 'published' as const, sort: 0, translations: [], ...extra
})
const roles = [
  { id: 'r-artist', slug: 'artist', title: 'Artist', status: 'published' as const, sort: 1, translations: [{ languages_code: 'de', title: 'Künstler:in' }] },
  { id: 'r-curator', slug: 'curator', title: 'Curator', status: 'published' as const, sort: 2, translations: [] }
]
const exhibition = (id: string, start: string, image = `/img/${id}.jpg`) => ({
  id, slug: id, title: `Title ${id}`, start_date: start, image, image_alt: `Alt ${id}`
}) as never

const base = (overrides: Partial<PersonSources> = {}): PersonSources => ({
  persons: [person('urach', {
    image: '/img/urach.jpg', image_alt: 'Portrait', image_caption: 'Inés Urach · Foto: Inés Urach',
    born: '1970, Klagenfurt', based_in: 'Klagenfurt', lede: 'Painter.', about: ['Bio.'],
    translations: [
      { languages_code: 'en', based_in: 'Klagenfurt', lede: 'Painter.', about: ['Bio.'], image_alt: 'Portrait', image_caption: 'Inés Urach · Foto: Inés Urach' },
      { languages_code: 'de', based_in: 'Klagenfurt', lede: 'Malerin.', about: ['Biografie.'], image_alt: 'Porträt', image_caption: 'Inés Urach · Foto: Inés Urach' }
    ]
  })],
  roles,
  personRoles: [{ id: 1, persons_id: 'urach', roles_id: 'r-artist', sort: 0 }],
  participations: [
    { id: 'p1', exhibition: 'e-old', person: 'urach', role: 'r-artist', sort: 0 },
    { id: 'p2', exhibition: 'e-new', person: 'urach', role: 'r-curator', sort: 0 },
    { id: 'p3', exhibition: 'e-draft', person: 'urach', role: 'r-artist', sort: 0 }
  ],
  exhibitions: [exhibition('e-old', '2025-01-01'), exhibition('e-new', '2026-10-03')],
  statements: [],
  memberships: [],
  organisations: [],
  venues: [],
  personsVenues: [],
  websites: [
    { id: 'w-ig', title: 'Instagram', url: 'https://www.instagram.com/urach/', kind: 'social', status: 'published' as const, sort: 0, translations: [] },
    { id: 'w-home', title: 'inesurach.at', url: 'https://www.inesurach.at/', kind: 'website', status: 'published' as const, sort: 0, translations: [] }
  ],
  personsWebsites: [
    { id: 1, persons_id: 'urach', websites_id: 'w-ig', sort: 1 },
    { id: 2, persons_id: 'urach', websites_id: 'w-home', sort: 2 }
  ],
  locale: 'en',
  ...overrides
})

describe('resolvePersons', () => {
  it('builds the page model: roles, facts, home link, records newest first with their role', () => {
    const [p] = resolvePersons(base())
    expect(p).toMatchObject({ slug: 'urach', isArtist: true, born: '1970, Klagenfurt', basedIn: 'Klagenfurt', lede: 'Painter.', about: ['Bio.'] })
    expect(p!.roles).toEqual([{ slug: 'artist', title: 'Artist' }])
    expect(p!.home).toEqual({ url: 'https://www.inesurach.at/', label: 'inesurach.at' })
    expect(p!.records.map((r) => [r.exhibition.id, r.role])).toEqual([['e-new', 'curator'], ['e-old', 'artist']])
    expect(p!.image).toEqual({ src: '/img/urach.jpg', alt: 'Portrait', caption: 'Inés Urach · Foto: Inés Urach' })
  })

  it('uses the German texts and role titles in German', () => {
    const [p] = resolvePersons(base({ locale: 'de' }))
    expect(p).toMatchObject({ lede: 'Malerin.', about: ['Biografie.'] })
    expect(p!.roles).toEqual([{ slug: 'artist', title: 'Künstler:in' }])
  })

  it('falls back to the image of the newest exhibition when there is no photo', () => {
    const [p] = resolvePersons(base({ persons: [person('urach')] }))
    expect(p!.image).toEqual({ src: '/img/e-new.jpg', alt: 'Alt e-new', fromExhibition: 'Title e-new' })
  })

  it('renders an empty person: no role, record, bio, photo or link', () => {
    const [p] = resolvePersons(base({ persons: [person('nobody')], personRoles: [], participations: [], personsWebsites: [] }))
    expect(p).toMatchObject({ slug: 'nobody', isArtist: false, roles: [], records: [], links: [], statements: [] })
    expect(p!.image).toBeUndefined()
    expect(p!.home).toBeUndefined()
    expect(p!.about).toBeUndefined()
  })

  it('has no records and no fallback image when the only exhibition is unpublished', () => {
    const [p] = resolvePersons(base({ persons: [person('urach')], exhibitions: [] }))
    expect(p!.records).toEqual([])
    expect(p!.image).toBeUndefined()
  })

  it('shows a collective by its display name exactly as written', () => {
    const [p] = resolvePersons(base({ persons: [person('raqs', { first_name: '', last_name: '', display_name: 'Raqs Media Collective', is_collective: true })] }))
    expect(p!.name).toBe('Raqs Media Collective')
  })

  it('uses the plain fields when a person has no translation rows', () => {
    const [p] = resolvePersons(base({ persons: [person('urach', { lede: 'Painter.', based_in: 'Vienna' })] }))
    expect(p).toMatchObject({ lede: 'Painter.', basedIn: 'Vienna' })
  })

  it('drops unpublished persons', () => {
    expect(resolvePersons(base({ persons: [person('urach', { status: 'draft' })] }))).toEqual([])
  })
})
```

- [x] **Step 2: Run**

Run: `pnpm -s vitest run test/unit/resolvePersons.spec.ts`
Expected: FAIL (module not found).

- [x] **Step 3: Implement `app/utils/resolvePersons.ts`**

```ts
import type {
  ArtistMembership, ExhibitionStatement, JunctionRow, OrganisationMembershipRecord, OrganisationRecord,
  ParticipationRecord, PersonRecord, PersonRoleLink, RoleRecord, VenueRecord, WebsiteRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { linkLabel, linksThrough } from '~/utils/externalLinks'
import { pickTranslation } from '~/utils/pickTranslation'
import type { ResolvedExhibition, ResolvedLink } from '~/utils/resolveExhibitions'
import { displayPersonName } from '~/utils/resolveExhibitions'

export interface PersonRole { slug: string, title: string }
export interface PersonRecordLink { role: string, exhibition: ResolvedExhibition }
export interface PersonStatement { id: string, prompt?: string, text: string, exhibitionSlug: string, exhibitionTitle: string }
export interface PersonImage { src: string, alt: string, caption?: string, fromExhibition?: string }

/** One person as the person page shows them. Relations are resolved; anything unpublished drops out. */
export interface ResolvedPerson {
  id: string
  slug: string
  name: string
  roles: PersonRole[]
  isArtist: boolean
  lede?: string
  about?: string[]
  born?: string
  basedIn?: string
  /** The own photo, else the image of the newest exhibition in the archive. */
  image?: PersonImage
  /** The external home: own website, else the first link. */
  home?: { url: string, label: string }
  links: ResolvedLink[]
  memberships: ArtistMembership[]
  venues: { slug: string, name: string }[]
  /** Exhibitions with this person, newest first, each with the person's role there. */
  records: PersonRecordLink[]
  statements: PersonStatement[]
}

export interface PersonSources {
  persons: PersonRecord[]
  roles: RoleRecord[]
  personRoles: PersonRoleLink[]
  participations: ParticipationRecord[]
  exhibitions: ResolvedExhibition[]
  statements: ExhibitionStatement[]
  memberships: OrganisationMembershipRecord[]
  organisations: OrganisationRecord[]
  venues: VenueRecord[]
  personsVenues: JunctionRow[]
  websites: WebsiteRecord[]
  personsWebsites: JunctionRow[]
  locale: string
}

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort

export const resolvePersons = (s: PersonSources): ResolvedPerson[] => {
  const roleById = new Map(s.roles.filter(isVisible).map((role) => [role.id, role]))
  const exhibitionById = new Map(s.exhibitions.map((exhibition) => [exhibition.id, exhibition]))
  const organisationById = new Map(s.organisations.filter(isVisible).map((organisation) => [organisation.id, organisation]))
  const venueById = new Map(s.venues.filter(isVisible).map((venue) => [venue.id, venue]))
  const websiteById = new Map(s.websites.filter(isVisible).map((site) => [site.id, site]))

  return s.persons.filter(isVisible).map((person) => {
    const text = pickTranslation({ ...person, translations: person.translations ?? [] }, s.locale)

    const roles = s.personRoles.filter((row) => row.persons_id === person.id).sort(bySort).flatMap((row) => {
      const role = roleById.get(row.roles_id)
      if (!role) return []
      const words = pickTranslation(role, s.locale)
      return [{ slug: role.slug, title: (words.title as string) || role.title }]
    })

    const records = s.participations.filter((row) => row.person === person.id).flatMap((row) => {
      const exhibition = exhibitionById.get(row.exhibition)
      const role = roleById.get(row.role)
      return exhibition && role ? [{ role: role.slug, exhibition }] : []
    }).sort((a, b) => b.exhibition.start_date.localeCompare(a.exhibition.start_date))

    const links = linksThrough(websiteById, s.personsWebsites, 'persons_id', person.id, s.locale)
    const homeLink = links.find((link) => link.kind === 'website') ?? links[0]

    const memberships = s.memberships.filter((row) => row.person === person.id).sort(bySort).flatMap((row) => {
      const organisation = organisationById.get(row.organisation)
      if (!organisation) return []
      const words = pickTranslation(row, s.locale)
      return [{ slug: organisation.slug, title: organisation.title, function: (words.function as string) || row.function || undefined }]
    })

    const venues = s.personsVenues.filter((row) => row.persons_id === person.id).sort(bySort).flatMap((row) => {
      const venue = venueById.get(String(row.venues_id))
      return venue ? [{ slug: venue.slug, name: venue.title }] : []
    })

    const statements = s.statements.filter((row) => isVisible(row) && row.person === person.id).sort(bySort).flatMap((row) => {
      const exhibition = exhibitionById.get(row.exhibition)
      const words = pickTranslation(row, s.locale)
      const said = (words.statement as string) || ''
      return exhibition && said
        ? [{ id: row.id, prompt: (words.prompt as string) || undefined, text: said, exhibitionSlug: exhibition.slug, exhibitionTitle: exhibition.title }]
        : []
    })

    // pickTranslation returns translated fields only; the plain fields (English) are the fallback.
    const word = (field: 'lede' | 'based_in' | 'image_alt' | 'image_caption') => (text[field] as string) || person[field] || undefined
    const about = (text.about as string[] | undefined) ?? person.about ?? undefined

    const newestWithImage = records.find((record) => record.exhibition.image)?.exhibition
    const image: PersonImage | undefined = person.image
      ? { src: person.image, alt: word('image_alt') || displayPersonName(person), caption: word('image_caption') }
      : newestWithImage
        ? { src: newestWithImage.image, alt: newestWithImage.image_alt || newestWithImage.title, fromExhibition: newestWithImage.title }
        : undefined

    return {
      id: person.id,
      slug: person.slug,
      name: displayPersonName(person),
      roles,
      isArtist: roles.some((role) => role.slug === 'artist'),
      lede: word('lede'),
      about: about?.length ? about : undefined,
      born: person.born || undefined,
      basedIn: word('based_in'),
      image,
      home: homeLink ? { url: homeLink.url, label: linkLabel(homeLink) } : undefined,
      links,
      memberships,
      venues,
      records,
      statements
    }
  })
}
```

Note: `toEqual` ignores properties that are `undefined`, so `caption: undefined` in the fallback image is fine.

- [x] **Step 4: Run**

Run: `pnpm -s vitest run test/unit/resolvePersons.spec.ts`
Expected: PASS (8 tests).

---

### Task 4: `resolveSponsors`

**Files:**
- Create: `frontend/app/utils/resolveSponsors.ts`
- Test: `frontend/test/unit/resolveSponsors.spec.ts`

**Interfaces:**
- Produces:

```ts
export interface ResolvedSponsor {
  id: string
  slug: string
  title: string
  website_url?: string
  logo?: string
  description?: string
  exhibitions: ResolvedExhibition[]
  venues: { slug: string, name: string }[]
  persons: { slug: string, name: string }[]
  towns: string[]
}
export interface SponsorSources {
  sponsors: SponsorRecord[]
  exhibitions: ResolvedExhibition[]
  venues: VenueRecord[]
  persons: PersonRecord[]
  locations: LocationRecord[]
  exhibitionsSponsors: JunctionRow[]
  sponsorsVenues: JunctionRow[]
  personsSponsors: JunctionRow[]
  locationsSponsors: JunctionRow[]
  locale: string
}
export const resolveSponsors: (sources: SponsorSources) => ResolvedSponsor[]
```

- [x] **Step 1: Failing test**

```ts
import { describe, expect, it } from 'vitest'
import { resolveSponsors, type SponsorSources } from '~/utils/resolveSponsors'

const sponsor = (status: 'draft' | 'published' = 'published') => ({
  id: 's1', slug: 'kaernten-kultur', title: 'Land Kärnten Kultur', website_url: 'https://www.kulturchannel.at/', logo: '/img/logo.svg',
  description: 'Cultural department.', status, sort: 0, translations: [{ languages_code: 'de', description: 'Kulturabteilung.' }]
})
const base = (overrides: Partial<SponsorSources> = {}): SponsorSources => ({
  sponsors: [sponsor()],
  exhibitions: [{ id: 'e1', slug: 'e1', title: 'E1', start_date: '2026-01-01' }] as never,
  venues: [{ id: 'v1', slug: 'v1', title: 'Venue 1', status: 'published' }, { id: 'v2', slug: 'v2', title: 'Draft venue', status: 'draft' }] as never,
  persons: [{ id: 'p1', slug: 'p1', first_name: 'Ina', last_name: 'Rainer', middle_initial: null, display_name: null, is_collective: false, status: 'published', sort: 0 }] as never,
  locations: [{ id: 'l1', title: 'Klagenfurt am Wörthersee', status: 'published' }] as never,
  exhibitionsSponsors: [{ id: 1, exhibitions_id: 'e1', sponsors_id: 's1', sort: 0 }, { id: 2, exhibitions_id: 'e-gone', sponsors_id: 's1', sort: 1 }],
  sponsorsVenues: [{ id: 1, sponsors_id: 's1', venues_id: 'v1', sort: 0 }, { id: 2, sponsors_id: 's1', venues_id: 'v2', sort: 1 }],
  personsSponsors: [{ id: 1, persons_id: 'p1', sponsors_id: 's1', sort: 0 }],
  locationsSponsors: [{ id: 1, locations_id: 'l1', sponsors_id: 's1', sort: 0 }],
  locale: 'en',
  ...overrides
})

describe('resolveSponsors', () => {
  it('lists what a sponsor supports, dropping missing or unpublished records', () => {
    const [s] = resolveSponsors(base())
    expect(s).toMatchObject({ slug: 'kaernten-kultur', title: 'Land Kärnten Kultur', description: 'Cultural department.' })
    expect(s!.exhibitions.map((e) => e.id)).toEqual(['e1'])
    expect(s!.venues).toEqual([{ slug: 'v1', name: 'Venue 1' }])
    expect(s!.persons).toEqual([{ slug: 'p1', name: 'Ina Rainer' }])
    expect(s!.towns).toEqual(['Klagenfurt am Wörthersee'])
  })

  it('uses the German description', () => {
    expect(resolveSponsors(base({ locale: 'de' }))[0]!.description).toBe('Kulturabteilung.')
  })

  it('drops unpublished sponsors', () => {
    expect(resolveSponsors(base({ sponsors: [sponsor('draft')] }))).toEqual([])
  })
})
```

- [x] **Step 2: Run** — `pnpm -s vitest run test/unit/resolveSponsors.spec.ts` → FAIL (module not found).

- [x] **Step 3: Implement `app/utils/resolveSponsors.ts`**

```ts
import type { JunctionRow, LocationRecord, PersonRecord, SponsorRecord, VenueRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import { displayPersonName } from '~/utils/resolveExhibitions'

/** A sponsor as its page shows it: what it supports, published records only. */
export interface ResolvedSponsor {
  id: string
  slug: string
  title: string
  website_url?: string
  logo?: string
  description?: string
  exhibitions: ResolvedExhibition[]
  venues: { slug: string, name: string }[]
  persons: { slug: string, name: string }[]
  towns: string[]
}

export interface SponsorSources {
  sponsors: SponsorRecord[]
  exhibitions: ResolvedExhibition[]
  venues: VenueRecord[]
  persons: PersonRecord[]
  locations: LocationRecord[]
  exhibitionsSponsors: JunctionRow[]
  sponsorsVenues: JunctionRow[]
  personsSponsors: JunctionRow[]
  locationsSponsors: JunctionRow[]
  locale: string
}

const linked = <T>(rows: JunctionRow[], sponsorId: string, column: string, byId: Map<string, T>): T[] => rows
  .filter((row) => row.sponsors_id === sponsorId)
  .sort((a, b) => a.sort - b.sort)
  .flatMap((row) => {
    const item = byId.get(String(row[column]))
    return item ? [item] : []
  })

export const resolveSponsors = (s: SponsorSources): ResolvedSponsor[] => {
  const exhibitionById = new Map(s.exhibitions.map((exhibition) => [exhibition.id, exhibition]))
  const venueById = new Map(s.venues.filter(isVisible).map((venue) => [venue.id, { slug: venue.slug, name: venue.title }]))
  const personById = new Map(s.persons.filter(isVisible).map((person) => [person.id, { slug: person.slug, name: displayPersonName(person) }]))
  const townById = new Map(s.locations.filter(isVisible).map((location) => [location.id, location.title]))

  return s.sponsors.filter(isVisible).map((sponsor) => {
    const text = pickTranslation(sponsor, s.locale)
    return {
      id: sponsor.id,
      slug: sponsor.slug,
      title: sponsor.title,
      website_url: sponsor.website_url || undefined,
      logo: sponsor.logo || undefined,
      description: (text.description as string) || sponsor.description || undefined,
      exhibitions: linked(s.exhibitionsSponsors, sponsor.id, 'exhibitions_id', exhibitionById),
      venues: linked(s.sponsorsVenues, sponsor.id, 'venues_id', venueById),
      persons: linked(s.personsSponsors, sponsor.id, 'persons_id', personById),
      towns: linked(s.locationsSponsors, sponsor.id, 'locations_id', townById)
    }
  })
}
```

- [x] **Step 4: Run** — `pnpm -s vitest run test/unit/resolveSponsors.spec.ts` → PASS (3 tests).

---

### Task 5: Wire resolvers into `useArchiveData` and organisation images

**Files:**
- Modify: `frontend/app/composables/useArchiveData.ts`
- Modify: `frontend/app/utils/resolveOrganisations.ts` (`ResolvedOrganisation`, return object)

**Interfaces:**
- Consumes: `resolvePersons` (Task 3), `resolveSponsors` (Task 4).
- Produces: `useArchiveData()` returns `persons: ComputedRef<ResolvedPerson[]>` and `sponsorPages: ComputedRef<ResolvedSponsor[]>` (existing `sponsors` stays for the footer strip). `ResolvedOrganisation` gains `image?: string`, `image_alt?: string`, `image_caption?: string`.

- [x] **Step 1: Organisation image fields**

In `ResolvedOrganisation` add after `logo_alt?: string`:
```ts
  image?: string
  image_alt?: string
  image_caption?: string
```
In the returned object add after `logo_alt`:
```ts
      image: organisation.image ?? undefined,
      image_alt: (text.image_alt as string) || organisation.image_alt || undefined,
      image_caption: (text.image_caption as string) || organisation.image_caption || undefined,
```

- [x] **Step 2: Expose persons and sponsor pages**

In `useArchiveData.ts` add imports `import { resolvePersons } from '~/utils/resolvePersons'` and `import { resolveSponsors } from '~/utils/resolveSponsors'`, then before `return`:

```ts
  const personsForLocale = computed(() => resolvePersons({
    persons: archive.persons,
    roles: archive.roles,
    personRoles: archive.personRoles,
    participations: archive.participations,
    exhibitions: exhibitionsForLocale.value,
    statements: archive.statements,
    memberships: archive.organisationMemberships,
    organisations: archive.organisations,
    venues: archive.venues,
    personsVenues: archive.personsVenues,
    websites: archive.websites,
    personsWebsites: archive.personsWebsites,
    locale: locale.value
  }))

  const sponsorPagesForLocale = computed(() => resolveSponsors({
    sponsors: archive.sponsors,
    exhibitions: exhibitionsForLocale.value,
    venues: archive.venues,
    persons: archive.persons,
    locations: archive.locations,
    exhibitionsSponsors: archive.exhibitionsSponsors,
    sponsorsVenues: archive.sponsorsVenues,
    personsSponsors: archive.personsSponsors,
    locationsSponsors: archive.locationsSponsors,
    locale: locale.value
  }))
```
and add `persons: personsForLocale,` and `sponsorPages: sponsorPagesForLocale,` to the returned object.

- [x] **Step 3: Verify** — `pnpm -s test && pnpm -s check:types` → all pass, no type errors.

---

### Task 6: Person page

**Files:**
- Create: `frontend/app/pages/persons/[slug].vue`
- Modify: `frontend/i18n/locales/en.json`, `frontend/i18n/locales/de.json` (new top-level `persons` block)

**Interfaces:**
- Consumes: `useArchiveData().persons` (Task 5), `ExhibitionCard`, `ArchiveMetadataRow`, `ArchiveFramedImage`, `ArchiveBreadcrumb`, `ArchiveTextLink`, `ArchiveExhibitionsDivider`, `ArchiveHeader`, `ArchiveFooter`, `ArchivePageChrome`.

- [x] **Step 1: i18n — add to `en.json` (top level, after `organisations`)**

```json
  "persons": {
    "notFound": "Person not found",
    "seoDescription": "{name} in the PERMAPHEMERA archive: exhibitions, roles, links and biography.",
    "fallbackLede": "{name} is recorded in the archive as {roles}.",
    "born": "Born",
    "basedIn": "Lives in",
    "memberOf": "Member of",
    "galleries": "Gallery | Galleries",
    "links": "Link | Links",
    "fromExhibition": "From the exhibition “{title}”",
    "aboutTitle": "About {name}",
    "noBio": "There is no biography of {name} in the archive yet. The exhibitions below show {name}'s work in the archive.",
    "noBioNoRecords": "There is no biography of {name} in the archive yet.",
    "recordsEyebrow": "In the archive",
    "recordsTitle": "Exhibitions with {name} in the archive",
    "noRecords": "No exhibition with {name} is in the archive yet.",
    "statementsTitle": "{name} in their own words",
    "statementOn": "On the exhibition",
    "roleLabels": { "artist": "Artist", "curator": "Curator", "press": "Press", "board": "Board member" }
  },
```

`de.json`:

```json
  "persons": {
    "notFound": "Person nicht gefunden",
    "seoDescription": "{name} im PERMAPHEMERA-Archiv: Ausstellungen, Rollen, Links und Biografie.",
    "fallbackLede": "{name} ist im Archiv verzeichnet als {roles}.",
    "born": "Geboren",
    "basedIn": "Lebt in",
    "memberOf": "Mitglied bei",
    "galleries": "Galerie | Galerien",
    "links": "Link | Links",
    "fromExhibition": "Aus der Ausstellung „{title}“",
    "aboutTitle": "Über {name}",
    "noBio": "Im Archiv gibt es noch keine Biografie von {name}. Die Ausstellungen unten zeigen die Arbeit von {name} im Archiv.",
    "noBioNoRecords": "Im Archiv gibt es noch keine Biografie von {name}.",
    "recordsEyebrow": "Im Archiv",
    "recordsTitle": "Ausstellungen mit {name} im Archiv",
    "noRecords": "Im Archiv ist noch keine Ausstellung mit {name}.",
    "statementsTitle": "{name} in eigenen Worten",
    "statementOn": "Zur Ausstellung",
    "roleLabels": { "artist": "Künstler:in", "curator": "Kurator:in", "press": "Presse", "board": "Vorstand" }
  },
```

- [x] **Step 2: Create `app/pages/persons/[slug].vue`**

```vue
<script setup lang="ts">
import { Building2, CalendarDays, ExternalLink, Landmark, MapPin } from '@lucide/vue'
import { linkLabel } from '~/utils/externalLinks'

const route = useRoute()
const { persons } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()

const slug = String(route.params.slug ?? '')
const person = computed(() => persons.value.find((item) => item.slug === slug))
if (!person.value) {
  throw createError({ statusCode: 404, statusMessage: t('persons.notFound'), fatal: true })
}

const roleLine = computed(() => person.value!.roles.map((role) => role.title).join(' · '))
// Further links: everything except the home link shown under the name.
const furtherLinks = computed(() => person.value!.links.filter((link) => link.url !== person.value!.home?.url))
const roleLabel = (role: string) => t(`persons.roleLabels.${role}`, role)

useSeoMeta({
  title: () => [person.value?.name, roleLine.value, 'PERMAPHEMERA'].filter(Boolean).join(' · '),
  description: () => person.value?.lede ?? t('persons.seoDescription', { name: person.value?.name })
})
</script>

<template>
  <main v-if="person" class="[ site-shell ] [ person-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader :active="person.isArtist ? 'artists' : undefined" />

    <div id="main-content">
      <section class="[ person-hero ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(22rem,0.9fr)_minmax(24rem,1.1fr)] items-start gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-10" aria-labelledby="person-title">
        <div class="[ person-hero-copy ] relative z-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span>
            <template v-if="person.isArtist"><ArchiveTextLink :to="localePath('/artists/')">{{ $t('artists.breadcrumb') }}</ArchiveTextLink><span aria-hidden="true">/</span></template>
            <span>{{ person.name }}</span>
          </ArchiveBreadcrumb>
          <p v-if="roleLine" class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ roleLine }}</p>
          <h1 id="person-title" class="[ person-hero-title ] m-0 font-display text-hero font-light leading-[0.92] compact:text-5xl compact:leading-none">{{ person.name }}</h1>
          <p v-if="person.home" class="[ person-home-link ] mt-3 mb-0 text-button compact:text-sm">
            <ArchiveTextLink :href="person.home.url" target="_blank" rel="noreferrer">{{ person.home.label }}</ArchiveTextLink>
          </p>
          <p class="[ person-hero-lede ] my-0 mt-[1.6rem] mb-[1.85rem] max-w-136 text-lede leading-[1.42] text-archive-body compact:mt-4 compact:mb-4 compact:text-base compact:leading-normal">{{ person.lede ?? $t('persons.fallbackLede', { name: person.name, roles: roleLine || '—' }) }}</p>

          <dl class="[ person-facts ] m-0">
            <ArchiveMetadataRow v-if="person.born" :label="$t('persons.born')" variant="venue">
              <template #icon><CalendarDays :size="18" aria-hidden="true" /></template>
              {{ person.born }}
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="person.basedIn" :label="$t('persons.basedIn')" variant="venue">
              <template #icon><MapPin :size="19" aria-hidden="true" /></template>
              {{ person.basedIn }}
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="person.memberships.length" :label="$t('persons.memberOf')" variant="venue">
              <template #icon><Landmark :size="18" aria-hidden="true" /></template>
              <template v-for="(membership, index) in person.memberships" :key="membership.slug">
                <template v-if="index"> · </template><template v-if="membership.function">{{ membership.function }}, </template><ArchiveTextLink :to="localePath(`/organisations/${membership.slug}/`)">{{ membership.title }}</ArchiveTextLink>
              </template>
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="person.venues.length" :label="$t('persons.galleries', person.venues.length)" variant="venue">
              <template #icon><Building2 :size="18" aria-hidden="true" /></template>
              <template v-for="(venue, index) in person.venues" :key="venue.slug">
                <template v-if="index">, </template><ArchiveTextLink :to="localePath(`/venues/${venue.slug}/`)">{{ venue.name }}</ArchiveTextLink>
              </template>
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="furtherLinks.length" :label="$t('persons.links', furtherLinks.length)" variant="venue">
              <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
              <template v-for="(link, index) in furtherLinks" :key="link.id">
                <template v-if="index">, </template><ArchiveTextLink :href="link.url" target="_blank" rel="noreferrer" icon-motion="external">{{ linkLabel(link) }}</ArchiveTextLink>
              </template>
            </ArchiveMetadataRow>
          </dl>
        </div>

        <figure v-if="person.image" class="[ person-hero-figure ] archive-venue-hero-artwork relative m-0 pt-[1.1rem] pr-4 pb-10 pl-0 tablet:row-start-1 compact:mx-[-0.45rem] compact:pr-0">
          <ArchiveFramedImage class="[ person-hero-image ] aspect-[0.8] rotate-[0.65deg] tablet:aspect-[1.28] compact:rotate-0" :src="person.image.src" :alt="person.image.alt" />
          <figcaption class="[ person-hero-caption ] mt-[0.9rem] mr-0 mb-0 ml-[1.4rem] flex items-center gap-[0.65rem] text-sm text-archive-muted italic">
            <span class="not-italic tracking-[0.08em] text-archive-red uppercase">{{ $t('venue.figure') }}</span>
            {{ person.image.caption ?? (person.image.fromExhibition ? $t('persons.fromExhibition', { title: person.image.fromExhibition }) : '') }}
          </figcaption>
        </figure>
      </section>

      <section class="[ person-about ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pb-[clamp(2rem,4vw,4rem)] compact:px-4 compact:pb-6" aria-labelledby="person-about-title">
        <h2 id="person-about-title" class="m-0 mb-4 font-display text-h3 font-normal leading-[1.15] compact:text-lg">{{ $t('persons.aboutTitle', { name: person.name }) }}</h2>
        <template v-if="person.about">
          <p v-for="paragraph in person.about" :key="paragraph" class="max-w-176 text-button leading-[1.58] text-archive-body compact:text-base compact:leading-normal">{{ paragraph }}</p>
        </template>
        <p v-else class="m-0 max-w-176 text-button text-archive-muted compact:text-sm">{{ $t(person.records.length ? 'persons.noBio' : 'persons.noBioNoRecords', { name: person.name }) }}</p>
      </section>

      <ArchiveExhibitionsDivider />

      <section v-if="person.records.length" class="[ person-records ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-8" aria-labelledby="person-records-title">
        <div class="[ section-heading ] mb-10 compact:mb-5">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('persons.recordsEyebrow') }}</p>
          <h2 id="person-records-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('persons.recordsTitle', { name: person.name }) }}</h2>
        </div>
        <div class="[ person-records-grid ] grid grid-cols-3 gap-6 tablet:grid-cols-2 compact:grid-cols-1">
          <div v-for="record in person.records" :key="`${record.exhibition.id}-${record.role}`" class="[ person-record ] grid gap-2">
            <p class="m-0 text-xs tracking-widest text-archive-muted uppercase compact:text-3xs">{{ roleLabel(record.role) }}</p>
            <ExhibitionCard :exhibition="record.exhibition" />
          </div>
        </div>
      </section>
      <section v-else class="[ person-records-empty ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(2rem,4vw,4rem)] compact:px-4 compact:py-6">
        <p class="m-0 max-w-176 text-button text-archive-muted compact:text-sm">{{ $t('persons.noRecords', { name: person.name }) }}</p>
      </section>

      <section v-if="person.statements.length" class="[ person-statements ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pb-[clamp(3rem,5vw,5rem)] compact:px-4 compact:pb-8" aria-labelledby="person-statements-title">
        <h2 id="person-statements-title" class="m-0 mb-6 font-display text-h3-sm font-normal compact:mb-4 compact:text-2xl">{{ $t('persons.statementsTitle', { name: person.name }) }}</h2>
        <figure v-for="statement in person.statements" :key="statement.id" class="[ person-statement ] m-0 mb-8 max-w-3xl border-l border-archive-red/42 py-1 pl-6">
          <p v-if="statement.prompt" class="m-0 mb-2 text-sm tracking-[0.04em] text-archive-red">{{ statement.prompt }}</p>
          <blockquote class="m-0 font-display text-xl leading-normal text-archive-ink compact:text-lg">{{ statement.text }}</blockquote>
          <figcaption class="mt-3 text-sm text-archive-muted">{{ $t('persons.statementOn') }} <ArchiveTextLink :to="localePath(`/exhibitions/${statement.exhibitionSlug}/`)">{{ statement.exhibitionTitle }}</ArchiveTextLink></figcaption>
        </figure>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>
```

- [x] **Step 3: Verify**

Run: `pnpm -s check:types && pnpm -s check:tailwind && pnpm -s check:i18n`
Expected: no type errors; Tailwind canonical (if it reports a bracketed value with a canonical equivalent, use the suggested utility); i18n parity passes.

- [x] **Step 4: Look at it locally**

Run `pnpm dev`, open `http://localhost:4991/en/persons/ines-urach/` and `http://localhost:4991/persons/gabriele-ruff/` (curator, no artist breadcrumb), desktop 1440 px and mobile 390 px. Expected: photo or exhibition fallback, facts, records, no horizontal scroll.

---

### Task 7: Sponsor page

**Files:**
- Create: `frontend/app/pages/sponsors/[slug].vue`
- Modify: `frontend/i18n/locales/en.json`, `de.json` (new top-level `sponsorPages` block)

**Interfaces:**
- Consumes: `useArchiveData().sponsorPages` (Task 5).

- [x] **Step 1: i18n**

`en.json`:
```json
  "sponsorPages": {
    "notFound": "Sponsor not found",
    "eyebrow": "Sponsor",
    "website": "Website",
    "supportsTitle": "Supported by {name}",
    "supportsIntro": "These records in the archive are supported by {name}.",
    "exhibitions": "Exhibitions",
    "galleries": "Galleries",
    "persons": "Persons",
    "towns": "Towns",
    "noSupports": "{name} supports PERMAPHEMERA. No supported record is in the archive yet.",
    "seoDescription": "{name} supports PERMAPHEMERA: the supported exhibitions, galleries and persons in the archive."
  },
```
`de.json`:
```json
  "sponsorPages": {
    "notFound": "Sponsor nicht gefunden",
    "eyebrow": "Sponsor",
    "website": "Website",
    "supportsTitle": "Unterstützt von {name}",
    "supportsIntro": "Diese Einträge im Archiv unterstützt {name}.",
    "exhibitions": "Ausstellungen",
    "galleries": "Galerien",
    "persons": "Personen",
    "towns": "Orte",
    "noSupports": "{name} unterstützt PERMAPHEMERA. Im Archiv ist noch kein unterstützter Eintrag.",
    "seoDescription": "{name} unterstützt PERMAPHEMERA: die unterstützten Ausstellungen, Galerien und Personen im Archiv."
  },
```

- [x] **Step 2: Create `app/pages/sponsors/[slug].vue`**

```vue
<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import { hostnameOf } from '~/utils/externalLinks'

const route = useRoute()
const { sponsorPages } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()

const slug = String(route.params.slug ?? '')
const sponsor = computed(() => sponsorPages.value.find((item) => item.slug === slug))
if (!sponsor.value) {
  throw createError({ statusCode: 404, statusMessage: t('sponsorPages.notFound'), fatal: true })
}
const hasSupports = computed(() => Boolean(sponsor.value && (sponsor.value.exhibitions.length || sponsor.value.venues.length || sponsor.value.persons.length || sponsor.value.towns.length)))

useSeoMeta({
  title: () => `${sponsor.value?.title} · ${t('sponsorPages.eyebrow')} · PERMAPHEMERA`,
  description: () => sponsor.value?.description ?? t('sponsorPages.seoDescription', { name: sponsor.value?.title })
})
</script>

<template>
  <main v-if="sponsor" class="[ site-shell ] [ sponsor-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader />

    <div id="main-content">
      <section class="[ sponsor-hero ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(22rem,0.9fr)_minmax(16rem,0.6fr)] items-start gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-10" aria-labelledby="sponsor-title">
        <div class="[ sponsor-hero-copy ] relative z-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ sponsor.title }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('sponsorPages.eyebrow') }}</p>
          <h1 id="sponsor-title" class="m-0 font-display text-hero font-light leading-[0.92] compact:text-5xl compact:leading-none">{{ sponsor.title }}</h1>
          <p v-if="sponsor.description" class="my-0 mt-[1.6rem] mb-[1.85rem] max-w-136 text-lede leading-[1.42] text-archive-body compact:mt-4 compact:mb-4 compact:text-base compact:leading-normal">{{ sponsor.description }}</p>
          <dl class="m-0">
            <ArchiveMetadataRow v-if="sponsor.website_url" :label="$t('sponsorPages.website')" variant="venue">
              <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
              <ArchiveTextLink :href="sponsor.website_url" target="_blank" rel="noreferrer" icon-motion="external">{{ hostnameOf(sponsor.website_url) }}</ArchiveTextLink>
            </ArchiveMetadataRow>
          </dl>
        </div>
        <div v-if="sponsor.logo" class="[ sponsor-logo ] grid place-items-center p-8 tablet:row-start-1 tablet:justify-items-start compact:p-0">
          <img class="max-h-48 w-auto max-w-full object-contain" :src="sponsor.logo" :alt="sponsor.title">
        </div>
      </section>

      <ArchiveExhibitionsDivider />

      <section class="[ sponsor-supports ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-8" aria-labelledby="sponsor-supports-title">
        <h2 id="sponsor-supports-title" class="m-0 mb-3 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('sponsorPages.supportsTitle', { name: sponsor.title }) }}</h2>
        <p class="m-0 mb-8 max-w-176 text-button text-archive-muted compact:text-sm">{{ hasSupports ? $t('sponsorPages.supportsIntro', { name: sponsor.title }) : $t('sponsorPages.noSupports', { name: sponsor.title }) }}</p>
        <div v-if="sponsor.exhibitions.length" class="mb-10">
          <h3 class="m-0 mb-4 font-display text-h3 font-normal compact:text-lg">{{ $t('sponsorPages.exhibitions') }}</h3>
          <div class="grid grid-cols-3 gap-6 tablet:grid-cols-2 compact:grid-cols-1">
            <ExhibitionCard v-for="exhibition in sponsor.exhibitions" :key="exhibition.id" :exhibition="exhibition" />
          </div>
        </div>
        <dl class="m-0 max-w-176">
          <ArchiveMetadataRow v-if="sponsor.venues.length" :label="$t('sponsorPages.galleries')" variant="venue">
            <template v-for="(venue, index) in sponsor.venues" :key="venue.slug"><template v-if="index">, </template><ArchiveTextLink :to="localePath(`/venues/${venue.slug}/`)">{{ venue.name }}</ArchiveTextLink></template>
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="sponsor.persons.length" :label="$t('sponsorPages.persons')" variant="venue">
            <template v-for="(person, index) in sponsor.persons" :key="person.slug"><template v-if="index">, </template><ArchiveTextLink :to="localePath(`/persons/${person.slug}/`)">{{ person.name }}</ArchiveTextLink></template>
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="sponsor.towns.length" :label="$t('sponsorPages.towns')" variant="venue">
            {{ sponsor.towns.join(', ') }}
          </ArchiveMetadataRow>
        </dl>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>
```

- [x] **Step 3: Verify** — `pnpm -s check:types && pnpm -s check:tailwind && pnpm -s check:i18n` → pass. All 8 sponsors are drafts, so `/sponsors/<slug>/` shows the 404 page; that is correct until a sponsor is published.

---

### Task 8: Organisation photo and member links

**Files:**
- Modify: `frontend/app/pages/organisations/[slug].vue` (right column, member list)

- [x] **Step 1: Photo at the top of the right column**

Inside `<div class="[ organisation-about ] …">`, before the about eyebrow `<p>`, insert:

```vue
          <figure v-if="organisation.image" class="[ organisation-figure ] archive-venue-hero-artwork relative m-0 mb-10 pt-[1.1rem] pr-4 pb-6 pl-0 compact:mx-[-0.45rem] compact:mb-6 compact:pr-0">
            <ArchiveFramedImage class="[ organisation-image ] aspect-[1.28] rotate-[0.65deg] compact:rotate-0" :src="organisation.image" :alt="organisation.image_alt ?? organisation.title" />
            <figcaption v-if="organisation.image_caption" class="mt-[0.9rem] mr-0 mb-0 ml-[1.4rem] flex items-center gap-[0.65rem] text-sm text-archive-muted italic">
              <span class="not-italic tracking-[0.08em] text-archive-red uppercase">{{ $t('venue.figure') }}</span>
              {{ organisation.image_caption }}
            </figcaption>
          </figure>
```

- [x] **Step 2: Member names link to person pages**

Replace `<span class="block font-display text-lg leading-tight text-archive-ink compact:text-base">{{ member.name }}</span>` with:

```vue
                <ArchiveTextLink class="font-display text-lg leading-tight compact:text-base" :to="localePath(`/persons/${member.slug}/`)">{{ member.name }}</ArchiveTextLink>
```

- [x] **Step 3: Verify** — `pnpm -s check:types && pnpm -s check:tailwind` → pass; open `http://localhost:4991/organisations/bv-kaernten/`: member names are links.

---

### Task 9: Person names become links site-wide

**Files:**
- Modify: `frontend/app/pages/exhibitions/[slug].vue` (hero artist line, Artists row, new Curators row, statement caption)
- Modify: `frontend/app/components/ArtistDirectoryEntry.vue` (name → link, info keeps modal)
- Modify: `frontend/app/components/ArtistExhibitionModal.vue` (name heading → link)
- Modify: `frontend/scripts/check-artist-directory-modal.mjs`, `frontend/scripts/check-directory-routes.mjs`
- Modify: `frontend/i18n/locales/en.json`, `de.json` (`exhibition.curators`)

**Interfaces:**
- Consumes: `ResolvedExhibitionArtist.slug`, `statements[i].artist_slug` (Task 2).

- [x] **Step 1: Guard checks first (fail)**

The landing page artist list (`LandingArtistGroup.vue`) and the Artists page (`ArtistDirectoryGroup.vue`) both render `ArtistDirectoryEntry`, so this one change covers both lists.

In `check-artist-directory-modal.mjs` delete the line `const nameButton = …` and replace the checks `'artist names open the modal only when routed records exist'`, `'artists without routed records render as strongly muted non-interactive names'`, `'name and info controls expose the same modal relationship'`, `'info controls require at least one routed record'` and `'modal focus returns to the control that opened it'` with:

```js
  ['artist names link to their person page', /<NuxtLink[\s\S]{0,400}artist-name-link[\s\S]{0,400}:to="localePath\(`\/persons\/\$\{props\.artist\.slug\}\/`\)"/.test(entry)],
  ['artists without routed records keep a strongly muted name', /records\.length \? 'text-archive-ink' : 'text-archive-muted opacity-60'/.test(entry)],
  ['the info control exposes the modal relationship', infoButton.includes(':aria-controls="modalId"') && infoButton.includes(':aria-expanded="props.open"')],
  ['info controls require at least one routed record', infoButton.includes('v-if="records.length"') && infoButton.includes('@click="emit(\'toggle\')"')],
  ['modal focus returns to the info control', /infoButtonRef\.value\?\.focus\(\)/.test(entry) && !/nameButtonRef/.test(entry)],
```

In `check-directory-routes.mjs` append:

```js
const personPage = await readFile(new URL('../app/pages/persons/[slug].vue', import.meta.url), 'utf8')
const sponsorPage = await readFile(new URL('../app/pages/sponsors/[slug].vue', import.meta.url), 'utf8')
assert.match(personPage, /createError\(\{ statusCode: 404/, 'An unknown person slug must show the 404 page.')
assert.match(sponsorPage, /createError\(\{ statusCode: 404/, 'An unknown sponsor slug must show the 404 page.')
```
(If the file has no `readFile` import, add `import { readFile } from 'node:fs/promises'` at the top.)

Run: `pnpm -s check:artists` → FAIL (entry still uses the name button).

- [x] **Step 2: Directory entry**

In `ArtistDirectoryEntry.vue` script: add `const localePath = useLocalePath()`; delete `nameButtonRef`, `lastTrigger` and `requestToggle`; replace the `watch` with:

```ts
// Only the info button opens the window now, so focus always returns there.
watch(() => props.open, async (open) => {
  if (!open && wasOpen.value) {
    await nextTick()
    infoButtonRef.value?.focus()
  }
  wasOpen.value = open
})
```

Replace the `<button v-if="records.length" ref="nameButtonRef" …>…</button>` and the `<span v-else …>` with:

```vue
      <NuxtLink
        class="[ artist-name-link ] archive-navigation-link relative text-left font-display text-xl leading-tight no-underline transition-colors duration-150 ease-out hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red compact:text-base"
        :class="records.length ? 'text-archive-ink' : 'text-archive-muted opacity-60'"
        :to="localePath(`/persons/${props.artist.slug}/`)"
      >
        {{ displayName }}
      </NuxtLink>
```

and change the info button's `@click="requestToggle('info')"` to `@click="emit('toggle')"`.

- [x] **Step 3: Modal heading**

In `ArtistExhibitionModal.vue` add `const localePath = useLocalePath()` in the script (if absent) and replace `{{ props.displayName }}` inside the `<h2>` with:

```vue
                <NuxtLink class="text-archive-ink no-underline hover:text-archive-red focus-visible:text-archive-red" :to="localePath(`/persons/${props.artist.slug}/`)">{{ props.displayName }}</NuxtLink>
```

- [x] **Step 4: Exhibition page**

Add i18n `exhibition.curators`: EN `"Curator | Curators"`, DE `"Kurator:in | Kurator:innen"`.

Hero artist line (`[ exhibition-hero-artist ]`): replace `{{ exhibition.artist }}` with
```vue
<template v-for="(artist, index) in exhibition.artists" :key="artist.id"><template v-if="index"> &amp; </template><ArchiveTextLink :to="localePath(`/persons/${artist.slug}/`)" surface="night">{{ artist.name }}</ArchiveTextLink></template>
```
Artists row: replace `{{ exhibition.artist }}` with
```vue
<template v-for="(artist, index) in exhibition.artists" :key="artist.id"><template v-if="index">, </template><ArchiveTextLink :to="localePath(`/persons/${artist.slug}/`)">{{ artist.name }}</ArchiveTextLink></template>
```
After the Artists row add:
```vue
          <ArchiveMetadataRow v-if="exhibition.curators.length" :label="$t('exhibition.curators', exhibition.curators.length)" variant="exhibition">
            <template #icon><Users :size="18" aria-hidden="true" /></template>
            <template v-for="(curator, index) in exhibition.curators" :key="curator.id"><template v-if="index">, </template><ArchiveTextLink :to="localePath(`/persons/${curator.slug}/`)">{{ curator.name }}</ArchiveTextLink></template>
          </ArchiveMetadataRow>
```
Statement caption: replace `— {{ statement.artist }}` with `— <ArchiveTextLink :to="localePath(`/persons/${statement.artist_slug}/`)">{{ statement.artist }}</ArchiveTextLink>`.

- [x] **Step 5: Verify**

Run: `pnpm -s test && pnpm -s check:types && pnpm -s check:artists && pnpm -s check:directories && pnpm -s check:tailwind && pnpm -s check:i18n && pnpm -s check:mobile && pnpm -s check:links`
Expected: all pass.

---

### Task 10: QA and deploy

- [x] **Step 1:** Run the `frontend-qa-checklist` skill on `/persons/ines-urach/`, `/persons/gabriele-ruff/`, `/organisations/bv-kaernten/`, an exhibition page and `/artists/` at 1440 px and 390 px.
- [x] **Step 2:** `pnpm -s check:data && pnpm -s check:public` → OK.
- [x] **Step 3:** `pnpm run deploy:hetzner`; open the same URLs on https://permaphemera.at and confirm names link to person pages.

---

### Task 11: Research and fill (photos, bios, facts)

**Files:**
- Create: `docs/content/2026-10-person-organisation-sources.md`
- Writes: Directus `pp_persons`, `pp_organisations`, files under `media/persons/<slug>` and `media/organisations/<slug>`

- [x] **Step 1: List the targets** — read all persons (`slug, first_name, last_name, display_name, status, roles.roles_id.slug, websites.websites_id.url, participations.exhibition.title`) and all organisations via the MCP; split into batches of 10.

- [x] **Step 2: Dispatch research helpers in parallel (one per batch)** with this brief: "READ-ONLY research for PERMAPHEMERA (Austrian art archive). For each person: (1) a press/portrait photo from the person's own website, else their public social profile (Instagram/Facebook), else an official gallery/organiser page — give the DIRECT image URL, © holder, source page; never Wikimedia-only searching; (2) a factual bio in DE and EN, 2–4 sentences each (born, lives in, medium, training, main activity) in your own words, ending with `Quelle: <domain>` / `Source: <domain>`; (3) `born` as 'YYYY, Town', `based_in` DE/EN; (4) the home website if not listed. Only facts with a source; list uncertain facts separately. Return per person: slug, image_url, image_holder, image_source, alt DE/EN, caption DE/EN in the form '<Name> · Foto: <holder>', lede DE/EN (one line), about DE/EN (array), born, based_in DE/EN, home_url, sources[], open_questions[]." Same brief for organisations (photo of the organisation's building, exhibition or members; no logo as photo).

- [x] **Step 3: Upload photos** — build a manifest (`filename: <slug>.jpg`, `folderPath: media/persons/<slug>` or `media/organisations/<slug>`, `title: '<Name>, portrait'`, `description: '© <holder>. Press photo from <site>; reuse needs the consent of <holder>.'`) and run `cd directus && DIRECTUS_ENV_FILE=.env.remote node scripts/upload-files.mjs <manifest>`. Look at every image before uploading.

- [x] **Step 4: Write records** — MCP `items` → `update` per person: `image`, `image_alt`, `image_caption`, `lede`, `about`, `born`, `based_in` and `translations: { create | update }` for `en` and `de` (the plain fields hold English and equal the `en` translation). Missing home links → nested `websites` with `status: 'published'`.

- [x] **Step 5: Verify** — `cd frontend && pnpm -s check:data` → OK; open 5 random person pages live.

- [x] **Step 6: Source list** — write `docs/content/2026-10-person-organisation-sources.md`: one section per person/organisation with photo file id, bio EN, facts, source URLs, open questions; persons without findings listed under "Nothing found".

---

### Task 12: Docs

**Files:**
- Modify: `docs/how-to-gallery-and-exhibition.md` (§7 Persons, §5/§6 organisation photo)
- Modify: `PROJECT_INFO.md` (§4 Directus table: person page fields) and copy it to the two sibling folders

- [x] **Step 1:** In the how-to §7 add: new person fields (`image`, `image_alt`, `image_caption`, `lede`, `about`, `born`, `based_in`), photo rule (press photo from own website or social media, © note, folder `media/persons/<slug>`), page URL `/persons/<slug>/`. In §6 add the organisation photo fields.
- [x] **Step 2:** Update `PROJECT_INFO.md` §4 table rows for `pp_persons` and `pp_organisations`; copy to `/Users/robertwildling/Desktop/_WWW/_360_GALLERIES_AND_TOURS/PROJECT_INFO.md` and `/Users/robertwildling/Desktop/_WWW/_MacAPP TOUR-VIEWER/PROJECT_INFO.md`; confirm the three hashes match with `shasum`.

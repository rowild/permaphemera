// app/types/content.ts
import type { TourStatus } from '~/utils/tourAccess'

// ---- component-facing shapes (unchanged) -----------------------------------

export interface ArtistRecordLink {
  id: string
  title: string
  venue: string
  city: string
  href: string
}

/** One organisation a person belongs to, with the function shown as one line: "Vizepräsidentin, BV Kärnten". */
export interface ArtistMembership {
  slug: string
  title: string
  function?: string
}

export interface DirectoryArtist {
  id: string
  slug: string
  name: string
  location: string
  years: string
  record_count: number
  displayName: string
  records: ArtistRecordLink[]
  memberships: ArtistMembership[]
  /** The artist's external home: own website, else the first social profile. */
  link?: { url: string, label: string }
  letter: string
}

// ---- raw records: mirror the Directus pp_ collections 1:1 ------------------

export type ContentStatus = 'draft' | 'published' | 'archived'

export type VenueType = 'gallery' | 'museum' | 'kunsthalle' | 'art_cafe' | 'open_air' | 'forum'

export interface TranslationEntry {
  languages_code: string
  [field: string]: string | string[] | null
}

/** pp_locations — the town. */
export interface LocationRecord {
  id: string
  slug: string
  title: string
  postal_code: string
  state: string
  country: string
  latitude: number
  longitude: number
  description: string | null
  status: ContentStatus
  sort: number
  translations: TranslationEntry[]
}

/** pp_venues — the building. `location` → pp_locations.id */
export interface VenueRecord {
  id: string
  slug: string
  location: string
  /** Self M2O: the venue this space belongs to organisationally (Alpen-Adria-Galerie → Stadtgalerie Klagenfurt), or null. */
  part_of: string | null
  title: string
  type: VenueType
  address: string
  website_url: string | null
  latitude: number | null
  longitude: number | null
  image: string
  image_alt: string
  hero_image: string | null
  hero_image_alt: string | null
  /** Set by the loader: the file is a placeholder (`placeholder-…`), not a photo of the venue. */
  image_placeholder?: boolean
  hero_image_placeholder?: boolean
  archive_number: string
  featured: boolean
  description: string | null
  lede: string | null
  /** HTML from the WYSIWYG field. */
  about_html: string | null
  image_caption: string | null
  coordinate_label: string | null
  status: ContentStatus
  sort: number
  translations: TranslationEntry[]
}

/** pp_persons — people and collectives, each with a page at /persons/<slug>/. Links live in pp_websites. */
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
  /** Free text, e.g. "1970, Schärding". */
  born?: string | null
  based_in?: string | null
  /** Press portrait (file URL); the credit is in image_caption. */
  image?: string | null
  image_alt?: string | null
  image_caption?: string | null
  /** One line under the name on the person page. */
  lede?: string | null
  /** Biography paragraphs. */
  /** Biography: HTML from the WYSIWYG field. */
  about_html?: string | null
  status: ContentStatus
  sort: number
  translations?: TranslationEntry[]
}

/** pp_roles — what a person can be: artist, curator, … */
export interface RoleRecord {
  id: string
  slug: string
  title: string
  status: ContentStatus
  sort: number
  translations: TranslationEntry[]
}

/** pp_mm__persons_roles */
export interface PersonRoleLink {
  id: number
  persons_id: string
  roles_id: string
  sort: number
}

/** pp_exhibition_participations — one person in one function in one exhibition. No status: shown when exhibition, person and role are published. */
export interface ParticipationRecord {
  id: string
  exhibition: string
  person: string
  role: string
  sort: number
}

/** pp_exhibitions. `primary_venue` → pp_venues.id */
/** What an exhibitions record is: the site words its pages accordingly. */
export type ExhibitionKind = 'exhibition' | 'event'

export interface ExhibitionRecord {
  id: string
  slug: string
  kind: ExhibitionKind
  primary_venue: string
  start_date: string
  end_date: string
  is_permanent: boolean
  image: string
  /** Set by the loader: the image is a placeholder file (`placeholder-…`). */
  image_placeholder?: boolean
  /** Admission text, translated; empty means free admission. */
  admission?: string | null
  image_alt: string
  title: string
  summary: string | null
  description: string | null
  date_range: string | null
  opening_hours: string
  vernissage: string
  medium: string | null
  source_pdf: string | null
  /** Root-relative folder of the exported 360° tour (`/media/tours/<id>/`), or null while none is published. */
  tour: string | null
  tour_status: TourStatus
  tour_available_from: string | null
  status: ContentStatus
  sort: number
  translations: TranslationEntry[]
}

/** pp_exhibition_statements — one person's words about one show. */
export interface ExhibitionStatement {
  id: string
  exhibition: string
  person: string
  sort: number
  prompt: string | null
  statement: string | null
  status: ContentStatus
  translations: TranslationEntry[]
}

/** pp_sponsors */
export interface SponsorRecord {
  id: string
  slug: string
  title: string
  website_url: string | null
  logo: string | null
  description: string | null
  status: ContentStatus
  sort: number
  translations: TranslationEntry[]
}

/** pp_navigations — one row per menu. */
export interface NavigationRecord {
  id: string
  key: string
  title: string
  status: ContentStatus
  sort: number
}

export type NavigationItemKind = 'route' | 'url' | 'action'

/** pp_navigation_items. `navigation` → pp_navigations.id, `parent` → pp_navigation_items.id */
export interface NavigationItemRecord {
  id: string
  navigation: string
  parent: string | null
  key: string
  title: string
  kind: NavigationItemKind
  path: string | null
  url: string | null
  target: '_self' | '_blank'
  sort: number
  status: ContentStatus
  translations: TranslationEntry[]
}

/** One junction row: integer id plus the two FK columns named <parent>_id and a sort. */
export interface JunctionRow {
  id: number
  sort: number
  [column: string]: string | number
}

/** pp_websites — one external link. Persons and exhibitions reach it through junction rows. */
export type WebsiteKind = 'website' | 'exhibition_page' | 'press' | 'document' | 'social' | (string & {})
export interface WebsiteRecord {
  id: string
  title: string
  url: string
  kind: WebsiteKind
  status: ContentStatus
  sort: number
  translations: TranslationEntry[]
}

export type OrganisationKind = 'association' | 'federation' | 'institution' | 'collective' | 'company' | 'initiative' | (string & {})

/** pp_organisations — associations, federations, institutions. `title` is one verbatim string, never split. `location` → pp_locations.id */
export interface OrganisationRecord {
  id: string
  slug: string
  title: string
  short_title: string | null
  kind: OrganisationKind
  founded: string | null
  address: string | null
  location: string | null
  logo: string | null
  logo_alt: string | null
  /** Press photo of the organisation (file URL); the credit is in image_caption. */
  image?: string | null
  image_alt?: string | null
  image_caption?: string | null
  lede: string | null
  /** HTML from the WYSIWYG field. */
  about_html: string | null
  description: string | null
  status: ContentStatus
  sort: number
  translations: TranslationEntry[]
}

/** pp_organisation_memberships — one person in one function in one organisation. */
export interface OrganisationMembershipRecord {
  id: string
  organisation: string
  person: string
  function: string | null
  sort: number
  translations: TranslationEntry[]
}

export type OrganisationVenueRelation = 'runs' | 'seat' | 'exhibits_at'

/** pp_organisation_venue_relations — how an organisation relates to a building. */
export interface OrganisationVenueRelationRecord {
  id: string
  organisation: string
  venue: string
  relation: OrganisationVenueRelation
  sort: number
}

export type ExhibitionOrganiserRole = 'organiser' | 'presenter' | 'cooperation' | 'supporter'

/** pp_exhibition_organisers — the organisation behind one exhibition or event, in one role. */
export interface ExhibitionOrganiserRecord {
  id: string
  exhibition: string
  organisation: string
  role: ExhibitionOrganiserRole
  sort: number
}

/** Everything the site reads, fetched once from Directus in the JSON item shape. */
export interface ArchiveSnapshot {
  locations: LocationRecord[]
  venues: VenueRecord[]
  persons: PersonRecord[]
  roles: RoleRecord[]
  personRoles: PersonRoleLink[]
  exhibitions: ExhibitionRecord[]
  participations: ParticipationRecord[]
  statements: ExhibitionStatement[]
  sponsors: SponsorRecord[]
  navigations: NavigationRecord[]
  navigationItems: NavigationItemRecord[]
  websites: WebsiteRecord[]
  exhibitionsVenues: JunctionRow[]
  exhibitionsSponsors: JunctionRow[]
  personsVenues: JunctionRow[]
  personsSponsors: JunctionRow[]
  locationsSponsors: JunctionRow[]
  sponsorsVenues: JunctionRow[]
  exhibitionsWebsites: JunctionRow[]
  personsWebsites: JunctionRow[]
  organisations: OrganisationRecord[]
  organisationMemberships: OrganisationMembershipRecord[]
  organisationVenueRelations: OrganisationVenueRelationRecord[]
  exhibitionOrganisers: ExhibitionOrganiserRecord[]
  organisationsWebsites: JunctionRow[]
  venuesWebsites: JunctionRow[]
}

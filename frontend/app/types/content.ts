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

export interface DirectoryArtist {
  id: string
  slug: string
  name: string
  location: string
  years: string
  record_count: number
  displayName: string
  records: ArtistRecordLink[]
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
  archive_number: string
  featured: boolean
  description: string | null
  lede: string | null
  about: string[] | null
  image_caption: string | null
  coordinate_label: string | null
  status: ContentStatus
  sort: number
  translations: TranslationEntry[]
}

/** pp_persons — people and collectives. No translations, no biography (owner decision 2026-09-14). Links live in pp_websites. */
export interface PersonRecord {
  id: string
  slug: string
  first_name: string
  last_name: string
  middle_initial: string | null
  /** Pseudonym or collective name; shown instead of first + last when set. */
  display_name: string | null
  status: ContentStatus
  sort: number
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

/** pp_exhibition_participations — one person in one function on one show. */
export interface ParticipationRecord {
  id: string
  exhibition: string
  person: string
  role: string
  sort: number
  status: ContentStatus
}

/** pp_exhibitions. `primary_venue` → pp_venues.id */
export interface ExhibitionRecord {
  id: string
  slug: string
  primary_venue: string
  start_date: string
  end_date: string
  is_permanent: boolean
  image: string
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
}

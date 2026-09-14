import type { TourStatus } from '~/utils/tourAccess'

export interface LocationTranslation {
  languages_code: string
  description: string
}

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

export interface Sponsor {
  id: string
  name: string
}

export type ContentStatus = 'draft' | 'published'

export type VenueType = 'gallery' | 'museum' | 'kunsthalle' | 'art_cafe' | 'open_air' | 'forum'

export interface TranslationEntry {
  languages_code: string
  [field: string]: string | string[]
}

export interface CityLocation {
  id: string
  slug: string
  city_name: string
  postal_code: string
  state: string
  country: string
  latitude: number
  longitude: number
  status: ContentStatus
  translations: TranslationEntry[]
}

export interface VenueRecord {
  id: string
  slug: string
  location_id: string
  name: string
  type: VenueType
  address: string
  website_url?: string
  latitude?: number
  longitude?: number
  image: string
  image_alt: string
  hero_image?: string
  hero_image_alt?: string
  archive_number: string
  featured: boolean
  status: ContentStatus
  translations: TranslationEntry[]
}

export interface ExhibitionRecord {
  id: string
  slug: string
  primary_venue_id: string
  start_date: string
  end_date: string
  is_permanent: boolean
  image: string
  image_alt: string
  opening_hours: string
  vernissage: string
  medium: string | null
  source_pdf: string | null
  /** Root-relative folder of the exported 360° tour (`/media/tours/<id>/`), or null while none is published. */
  tour: string | null
  /** Editorial availability of the 360° record; see `TourStatus` in utils/tourAccess. */
  tour_status: TourStatus
  /** ISO date from which the record may be shown, or null for immediately. */
  tour_available_from: string | null
  status: ContentStatus
  translations: TranslationEntry[]
}

/**
 * One artist's words about one exhibition room (Directus: `exhibition_statements`,
 * M2O to exhibitions and to artists). `prompt` is the question the artist
 * answered ("How did you approach the room?"); `statement` is the answer.
 */
export interface ExhibitionStatement {
  id: string
  exhibition_id: string
  artist_id: string
  sort: number
  status: ContentStatus
  translations: TranslationEntry[]
}

export interface ExhibitionArtistLink {
  id: number
  exhibition_id: string
  artist_id: string
  sort: number
}

export interface ArtistRecord {
  id: string
  slug: string
  first_name: string
  last_name: string
  middle_initial: string | null
  artist_name: string | null
  birth_year: number | null
  death_year: number | null
  nationality: string | null
  website_url: string | null
  instagram_handle: string | null
  profile_image: string | null
  status: ContentStatus
  translations: TranslationEntry[]
}

export interface LocationTranslation {
  languages_code: string
  description: string
}

export interface Location {
  id: string
  slug: string
  name: string
  city_name: string
  postal_code: string
  state: string
  country: string
  address: string
  latitude?: number
  longitude?: number
  website_url?: string
  image: string
  image_alt: string
  archive_number: string
  featured?: boolean
  translations: LocationTranslation[]
  description?: string
}

export interface Venue {
  id: string
  slug: string
  location_id: string
  name: string
  city: string
  address: string
  latitude?: number
  longitude?: number
  website_url?: string
  image: string
  featured?: boolean
  archive_number?: string
  hero_image?: string
  hero_image_alt?: string
  lede?: string
  image_caption?: string
  coordinate_label?: string
  about?: string[]
}

export interface Artist {
  id: string
  slug: string
  name: string
  location: string
  years: string
  record_count: number
}

export interface ArtistRecordLink {
  id: string
  title: string
  venue: string
  city: string
  href: string
}

export interface DirectoryArtist extends Artist {
  displayName: string
  records: ArtistRecordLink[]
  letter: string
}

export interface Exhibition {
  id: string
  slug: string
  title: string
  artist: string
  venue: string
  city: string
  date_range: string
  image: string
  featured?: boolean
}

export interface LocationExhibition {
  id: string
  slug: string
  title: string
  artist: string
  venue_slug: string
  venue: string
  city: string
  start_date: string
  end_date: string
  date_range: string
  image: string
  image_alt: string
  summary: string
  description?: string
  medium?: string
  opening_hours: string
  vernissage: string
  source_pdf: string
  featured?: boolean
}

export interface Sponsor {
  id: string
  name: string
}

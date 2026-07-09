export interface LocationTranslation {
  languages_code: string
  description: string
}

export interface Location {
  id: string
  slug: string
  city_name: string
  postal_code: string
  state: string
  country: string
  image: string
  translations: LocationTranslation[]
}

export interface Venue {
  id: string
  slug: string
  location_id: string
  name: string
  city: string
  address: string
  website_url?: string
  image: string
  featured?: boolean
}

export interface Artist {
  id: string
  slug: string
  name: string
  location: string
  years: string
  record_count: number
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

export interface Sponsor {
  id: string
  name: string
}

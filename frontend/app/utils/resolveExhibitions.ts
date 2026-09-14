import type {
  ArtistRecord, CityLocation, ExhibitionArtistLink, ExhibitionRecord, ExhibitionStatement, VenueRecord
} from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'
import type { TourStatus } from '~/utils/tourAccess'

export interface ResolvedExhibitionArtist {
  id: string
  name: string
  website_url?: string
}

export interface ResolvedStatement {
  id: string
  artist: string
  prompt?: string
  text: string
}

export interface ResolvedExhibition {
  id: string
  slug: string
  title: string
  artist: string
  artist_ids: string[]
  artists: ResolvedExhibitionArtist[]
  statements: ResolvedStatement[]
  venue_slug: string
  venue: string
  venue_website?: string
  city: string
  start_date: string
  end_date: string
  is_permanent: boolean
  date_range: string
  image: string
  image_alt: string
  summary: string
  description?: string
  medium?: string
  opening_hours: string
  vernissage: string
  source_pdf?: string
  tour?: string
  tour_status: TourStatus
  tour_available_from: string | null
}

export const displayArtistName = (artist: ArtistRecord): string =>
  artist.artist_name ?? `${artist.first_name} ${artist.last_name}`.trim()

export const resolveExhibitions = (
  exhibitions: ExhibitionRecord[],
  venues: VenueRecord[],
  locations: CityLocation[],
  junction: ExhibitionArtistLink[],
  artists: ArtistRecord[],
  locale: string,
  statements: ExhibitionStatement[] = []
): ResolvedExhibition[] => {
  const venueById = new Map(venues.map((venue) => [venue.id, venue]))
  const locationById = new Map(locations.map((location) => [location.id, location]))
  const artistById = new Map(artists.map((artist) => [artist.id, artist]))

  const linksByExhibition = new Map<string, ExhibitionArtistLink[]>()
  for (const link of junction) {
    const rows = linksByExhibition.get(link.exhibition_id) ?? []
    rows.push(link)
    linksByExhibition.set(link.exhibition_id, rows)
  }

  const statementsByExhibition = new Map<string, ExhibitionStatement[]>()
  for (const statement of statements.filter(isVisible)) {
    const rows = statementsByExhibition.get(statement.exhibition_id) ?? []
    rows.push(statement)
    statementsByExhibition.set(statement.exhibition_id, rows)
  }

  return exhibitions.filter(isVisible).map((exhibition) => {
    const venue = venueById.get(exhibition.primary_venue_id)
    if (!venue) {
      throw new Error(`exhibitions.json: ${exhibition.id} references unknown venue ${exhibition.primary_venue_id}`)
    }
    const location = locationById.get(venue.location_id)
    if (!location) throw new Error(`venues.json: ${venue.id} references unknown location ${venue.location_id}`)

    const links = (linksByExhibition.get(exhibition.id) ?? []).sort((a, b) => a.sort - b.sort)
    const linkedArtists = links.map((link) => {
      const artist = artistById.get(link.artist_id)
      if (!artist) throw new Error(`exhibitions_artists.json: unknown artist ${link.artist_id}`)
      return artist
    })

    const text = pickTranslation(exhibition, locale)
    const resolvedStatements = (statementsByExhibition.get(exhibition.id) ?? [])
      .sort((a, b) => a.sort - b.sort)
      .map((statement) => {
        const artist = artistById.get(statement.artist_id)
        if (!artist) throw new Error(`exhibition_statements.json: unknown artist ${statement.artist_id}`)
        const words = pickTranslation(statement, locale)
        return {
          id: statement.id,
          artist: displayArtistName(artist),
          prompt: (words.prompt as string) || undefined,
          text: (words.statement as string) ?? ''
        }
      })
      .filter((statement) => statement.text)

    return {
      id: exhibition.id,
      slug: exhibition.slug,
      title: text.title as string,
      artist: linkedArtists.map(displayArtistName).join(' & '),
      artist_ids: linkedArtists.map((artist) => artist.id),
      artists: linkedArtists.map((artist) => ({
        id: artist.id,
        name: displayArtistName(artist),
        website_url: artist.website_url ?? undefined
      })),
      statements: resolvedStatements,
      venue_slug: venue.slug,
      venue: venue.name,
      venue_website: venue.website_url || undefined,
      city: location.city_name,
      start_date: exhibition.start_date,
      end_date: exhibition.end_date,
      is_permanent: exhibition.is_permanent,
      date_range: text.date_range as string,
      image: exhibition.image,
      image_alt: (text.image_alt as string) || exhibition.image_alt,
      summary: (text.summary as string) ?? '',
      description: (text.description as string) || undefined,
      medium: (text.medium as string) || undefined,
      opening_hours: (text.opening_hours as string) || exhibition.opening_hours,
      vernissage: (text.vernissage as string) || exhibition.vernissage,
      source_pdf: exhibition.source_pdf ?? undefined,
      tour: exhibition.tour ?? undefined,
      tour_status: exhibition.tour_status,
      tour_available_from: exhibition.tour_available_from
    }
  })
}

import type {
  ExhibitionRecord, ExhibitionStatement, LocationRecord, ParticipationRecord, PersonRecord, RoleRecord, VenueRecord
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
  curators: ResolvedExhibitionArtist[]
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

export const displayPersonName = (person: PersonRecord): string =>
  person.display_name ?? `${person.first_name} ${person.last_name}`.trim()

const toCredit = (person: PersonRecord): ResolvedExhibitionArtist => ({
  id: person.id,
  name: displayPersonName(person),
  website_url: person.website_url ?? undefined
})

export const resolveExhibitions = (
  exhibitions: ExhibitionRecord[],
  venues: VenueRecord[],
  locations: LocationRecord[],
  participations: ParticipationRecord[],
  persons: PersonRecord[],
  roles: RoleRecord[],
  locale: string,
  statements: ExhibitionStatement[] = []
): ResolvedExhibition[] => {
  const venueById = new Map(venues.map((venue) => [venue.id, venue]))
  const locationById = new Map(locations.map((location) => [location.id, location]))
  const personById = new Map(persons.map((person) => [person.id, person]))
  const roleSlugById = new Map(roles.map((role) => [role.id, role.slug]))

  const participationsByExhibition = new Map<string, ParticipationRecord[]>()
  for (const row of participations.filter(isVisible)) {
    const rows = participationsByExhibition.get(row.exhibition) ?? []
    rows.push(row)
    participationsByExhibition.set(row.exhibition, rows)
  }

  const statementsByExhibition = new Map<string, ExhibitionStatement[]>()
  for (const statement of statements.filter(isVisible)) {
    const rows = statementsByExhibition.get(statement.exhibition) ?? []
    rows.push(statement)
    statementsByExhibition.set(statement.exhibition, rows)
  }

  return exhibitions.filter(isVisible).map((exhibition) => {
    const venue = venueById.get(exhibition.primary_venue)
    if (!venue) {
      throw new Error(`pp_exhibitions.json: ${exhibition.id} references unknown venue ${exhibition.primary_venue}`)
    }
    const location = locationById.get(venue.location)
    if (!location) throw new Error(`pp_venues.json: ${venue.id} references unknown location ${venue.location}`)

    const rows = (participationsByExhibition.get(exhibition.id) ?? []).sort((a, b) => a.sort - b.sort)
    const credited = rows.map((row) => {
      const person = personById.get(row.person)
      if (!person) throw new Error(`pp_exhibition_participations.json: unknown person ${row.person}`)
      const role = roleSlugById.get(row.role)
      if (!role) throw new Error(`pp_exhibition_participations.json: unknown role ${row.role}`)
      return { person, role }
    })
    const artists = credited.filter(({ role }) => role === 'artist').map(({ person }) => person)
    const curators = credited.filter(({ role }) => role === 'curator').map(({ person }) => person)

    const text = pickTranslation(exhibition, locale)
    const resolvedStatements = (statementsByExhibition.get(exhibition.id) ?? [])
      .sort((a, b) => a.sort - b.sort)
      .map((statement) => {
        const person = personById.get(statement.person)
        if (!person) throw new Error(`pp_exhibition_statements.json: unknown person ${statement.person}`)
        const words = pickTranslation(statement, locale)
        return {
          id: statement.id,
          artist: displayPersonName(person),
          prompt: (words.prompt as string) || undefined,
          text: (words.statement as string) ?? ''
        }
      })
      .filter((statement) => statement.text)

    return {
      id: exhibition.id,
      slug: exhibition.slug,
      title: (text.title as string) || exhibition.title,
      artist: artists.map(displayPersonName).join(' & '),
      artist_ids: artists.map((person) => person.id),
      artists: artists.map(toCredit),
      curators: curators.map(toCredit),
      statements: resolvedStatements,
      venue_slug: venue.slug,
      venue: venue.title,
      venue_website: venue.website_url || undefined,
      city: location.title,
      start_date: exhibition.start_date,
      end_date: exhibition.end_date,
      is_permanent: exhibition.is_permanent,
      date_range: (text.date_range as string) || exhibition.date_range || '',
      image: exhibition.image,
      image_alt: (text.image_alt as string) || exhibition.image_alt,
      summary: (text.summary as string) || exhibition.summary || '',
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

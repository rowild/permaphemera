import type {
  ExhibitionRecord, ExhibitionStatement, JunctionRow, LocationRecord, ParticipationRecord, PersonRecord, RoleRecord, VenueRecord, WebsiteRecord, ExhibitionKind,
  ExhibitionOrganiserRecord, ExhibitionOrganiserRole, OrganisationRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'
import type { TourStatus } from '~/utils/tourAccess'

/** One pp_websites row, title already picked for the locale. */
export interface ResolvedLink {
  id: string
  title: string
  url: string
  kind: string
}

export interface ResolvedExhibitionArtist {
  id: string
  /** The person page is /persons/<slug>/. */
  slug: string
  name: string
  /** The first link of kind "website", or the first link at all. */
  website_url?: string
  websites: ResolvedLink[]
}

/** The organisation behind an exhibition, in one role. Its title is shown verbatim. */
export interface ResolvedOrganiser {
  id: string
  slug: string
  title: string
  role: ExhibitionOrganiserRole
}

export interface ResolvedStatement {
  id: string
  artist: string
  /** The author's person page is /persons/<artist_slug>/. */
  artist_slug: string
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
  /** Persons in the role "organiser"; the organisations behind the exhibition are `organisers`. */
  organiser_persons: ResolvedExhibitionArtist[]
  organisers: ResolvedOrganiser[]
  statements: ResolvedStatement[]
  websites: ResolvedLink[]
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
  /** Admission text from the record; undefined means free admission. */
  admission?: string
  summary: string
  description?: string
  medium?: string
  opening_hours: string
  vernissage: string
  source_pdf?: string
  tour?: string
  tour_status: TourStatus
  tour_available_from: string | null
  kind: ExhibitionKind
}

export const displayPersonName = (person: PersonRecord): string =>
  person.display_name ?? `${person.first_name} ${person.last_name}`.trim()


export const resolveExhibitions = (
  exhibitions: ExhibitionRecord[],
  venues: VenueRecord[],
  locations: LocationRecord[],
  participations: ParticipationRecord[],
  persons: PersonRecord[],
  roles: RoleRecord[],
  locale: string,
  statements: ExhibitionStatement[] = [],
  websites: WebsiteRecord[] = [],
  exhibitionsWebsites: JunctionRow[] = [],
  personsWebsites: JunctionRow[] = [],
  organisers: ExhibitionOrganiserRecord[] = [],
  organisations: OrganisationRecord[] = []
): ResolvedExhibition[] => {
  // Relation rows (organisers, participations) carry no status of their own: a row counts
  // when every record it connects is published. Anything unpublished or missing drops out
  // quietly, so one draft never breaks a page.
  const organisationById = new Map(organisations.filter(isVisible).map((organisation) => [organisation.id, organisation]))
  const organisersByExhibition = new Map<string, ResolvedOrganiser[]>()
  for (const row of [...organisers].sort((a, b) => a.sort - b.sort)) {
    const organisation = organisationById.get(row.organisation)
    if (!organisation) continue
    const rows = organisersByExhibition.get(row.exhibition) ?? []
    rows.push({ id: organisation.id, slug: organisation.slug, title: organisation.title, role: row.role })
    organisersByExhibition.set(row.exhibition, rows)
  }
  const venueById = new Map(venues.filter(isVisible).map((venue) => [venue.id, venue]))
  const locationById = new Map(locations.filter(isVisible).map((location) => [location.id, location]))
  const personById = new Map(persons.filter(isVisible).map((person) => [person.id, person]))
  const roleSlugById = new Map(roles.filter(isVisible).map((role) => [role.id, role.slug]))
  const websiteById = new Map(websites.filter(isVisible).map((site) => [site.id, site]))

  // Links reach a record through a junction table; unpublished links and rows
  // whose link is gone simply drop out.
  const linksThrough = (rows: JunctionRow[], ownerColumn: string, ownerId: string): ResolvedLink[] => rows
    .filter((row) => row[ownerColumn] === ownerId)
    .sort((a, b) => a.sort - b.sort)
    .flatMap((row) => {
      const site = websiteById.get(String(row.websites_id))
      if (!site) return []
      const words = pickTranslation(site, locale)
      return [{ id: site.id, title: (words.title as string) || site.title, url: site.url, kind: site.kind }]
    })

  const toCredit = (person: PersonRecord): ResolvedExhibitionArtist => {
    const links = linksThrough(personsWebsites, 'persons_id', person.id)
    const primary = links.find((link) => link.kind === 'website') ?? links[0]
    return { id: person.id, slug: person.slug, name: displayPersonName(person), website_url: primary?.url, websites: links }
  }

  const participationsByExhibition = new Map<string, ParticipationRecord[]>()
  for (const row of participations) {
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

  // An exhibition needs a published venue in a published town; without them it cannot be placed.
  // It also needs a real image (not missing, not a placeholder file): until it has one it shows nowhere.
  return exhibitions.filter(isVisible).flatMap((exhibition) => {
    if (!exhibition.image || exhibition.image_placeholder) return []
    const venue = venueById.get(exhibition.primary_venue)
    const location = venue ? locationById.get(venue.location) : undefined
    if (!venue || !location) return []

    const rows = (participationsByExhibition.get(exhibition.id) ?? []).sort((a, b) => a.sort - b.sort)
    const credited = rows.flatMap((row) => {
      const person = personById.get(row.person)
      const role = roleSlugById.get(row.role)
      return person && role ? [{ person, role }] : []
    })
    const artists = credited.filter(({ role }) => role === 'artist').map(({ person }) => person)
    const curators = credited.filter(({ role }) => role === 'curator').map(({ person }) => person)
    const organiserPersons = credited.filter(({ role }) => role === 'organiser').map(({ person }) => person)

    const text = pickTranslation(exhibition, locale)
    const resolvedStatements = (statementsByExhibition.get(exhibition.id) ?? [])
      .sort((a, b) => a.sort - b.sort)
      .flatMap((statement) => {
        const person = personById.get(statement.person)
        if (!person) return []
        const words = pickTranslation(statement, locale)
        return [{
          id: statement.id,
          artist: displayPersonName(person),
          artist_slug: person.slug,
          prompt: (words.prompt as string) || undefined,
          text: (words.statement as string) ?? ''
        }]
      })
      .filter((statement) => statement.text)

    return [{
      id: exhibition.id,
      slug: exhibition.slug,
      title: (text.title as string) || exhibition.title,
      artist: artists.map(displayPersonName).join(' & '),
      artist_ids: artists.map((person) => person.id),
      artists: artists.map(toCredit),
      curators: curators.map(toCredit),
      organiser_persons: organiserPersons.map(toCredit),
      organisers: organisersByExhibition.get(exhibition.id) ?? [],
      statements: resolvedStatements,
      websites: linksThrough(exhibitionsWebsites, 'exhibitions_id', exhibition.id),
      venue_slug: venue.slug,
      venue: venue.title,
      venue_website: venue.website_url || undefined,
      city: location.title,
      start_date: exhibition.start_date,
      end_date: exhibition.end_date,
      is_permanent: exhibition.is_permanent,
      date_range: (text.date_range as string) || exhibition.date_range || '',
      image: exhibition.image,
      admission: (text.admission as string) || exhibition.admission || undefined,
      image_alt: (text.image_alt as string) || exhibition.image_alt,
      summary: (text.summary as string) || exhibition.summary || '',
      description: (text.description as string) || undefined,
      medium: (text.medium as string) || undefined,
      opening_hours: (text.opening_hours as string) || exhibition.opening_hours,
      vernissage: (text.vernissage as string) || exhibition.vernissage,
      source_pdf: exhibition.source_pdf ?? undefined,
      tour: exhibition.tour ?? undefined,
      tour_status: exhibition.tour_status,
      tour_available_from: exhibition.tour_available_from,
      kind: exhibition.kind ?? 'exhibition'
    }]
  })
}

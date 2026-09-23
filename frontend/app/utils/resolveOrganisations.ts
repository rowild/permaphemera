import type {
  ExhibitionOrganiserRecord, ExhibitionOrganiserRole, JunctionRow, LocationRecord, OrganisationMembershipRecord, OrganisationRecord,
  OrganisationVenueRelation, OrganisationVenueRelationRecord, PersonRecord, VenueRecord, WebsiteRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'
import type { ResolvedExhibition, ResolvedLink } from '~/utils/resolveExhibitions'
import { displayPersonName } from '~/utils/resolveExhibitions'

/** A venue an organisation runs, sits in or exhibits at. */
export interface OrganisationVenueLink {
  slug: string
  name: string
  relation: OrganisationVenueRelation
}

/** One person in one function in the organisation. */
export interface OrganisationMember {
  id: string
  slug: string
  name: string
  function?: string
}

/** One exhibition or event the organisation stood behind, in one role. */
export interface OrganisationRecordLink {
  id: string
  slug: string
  title: string
  role: ExhibitionOrganiserRole
  exhibition: ResolvedExhibition
}

/**
 * An organisation as the site shows it. `title` is the name exactly as
 * written in Directus: it is never split, shortened or inverted, and the
 * index letter is its first letter.
 */
export interface ResolvedOrganisation {
  id: string
  slug: string
  title: string
  short_title?: string
  kind: string
  founded?: string
  address?: string
  city?: string
  logo?: string
  logo_alt?: string
  lede?: string
  about?: string[]
  description?: string
  websites: ResolvedLink[]
  venues: OrganisationVenueLink[]
  members: OrganisationMember[]
  records: OrganisationRecordLink[]
  letter: string
}

export const organisationLetter = (title: string): string => {
  const letter = title.normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toLocaleUpperCase()
  return /^[A-Z]$/.test(letter) ? letter : '#'
}

export const resolveOrganisations = (
  organisations: OrganisationRecord[],
  locations: LocationRecord[],
  venues: VenueRecord[],
  persons: PersonRecord[],
  memberships: OrganisationMembershipRecord[],
  venueRelations: OrganisationVenueRelationRecord[],
  organisers: ExhibitionOrganiserRecord[],
  exhibitions: ResolvedExhibition[],
  websites: WebsiteRecord[],
  organisationsWebsites: JunctionRow[],
  locale: string
): ResolvedOrganisation[] => {
  const locationById = new Map(locations.map((location) => [location.id, location]))
  const venueById = new Map(venues.filter(isVisible).map((venue) => [venue.id, venue]))
  const personById = new Map(persons.filter(isVisible).map((person) => [person.id, person]))
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]))
  const websiteById = new Map(websites.filter(isVisible).map((site) => [site.id, site]))

  return organisations.filter(isVisible).map((organisation) => {
    const text = pickTranslation(organisation, locale)
    const location = organisation.location ? locationById.get(organisation.location) : undefined

    const links: ResolvedLink[] = organisationsWebsites
      .filter((row) => row.organisations_id === organisation.id)
      .sort((a, b) => a.sort - b.sort)
      .flatMap((row) => {
        const site = websiteById.get(String(row.websites_id))
        if (!site) return []
        const words = pickTranslation(site, locale)
        return [{ id: site.id, title: (words.title as string) || site.title, url: site.url, kind: site.kind }]
      })

    const venueLinks: OrganisationVenueLink[] = venueRelations
      .filter((row) => isVisible(row) && row.organisation === organisation.id)
      .sort((a, b) => a.sort - b.sort)
      .flatMap((row) => {
        const venue = venueById.get(row.venue)
        return venue ? [{ slug: venue.slug, name: venue.title, relation: row.relation }] : []
      })

    const members: OrganisationMember[] = memberships
      .filter((row) => isVisible(row) && row.organisation === organisation.id)
      .sort((a, b) => a.sort - b.sort)
      .flatMap((row) => {
        const person = personById.get(row.person)
        if (!person) return []
        const words = pickTranslation(row, locale)
        return [{ id: person.id, slug: person.slug, name: displayPersonName(person), function: (words.function as string) || row.function || undefined }]
      })

    const records: OrganisationRecordLink[] = organisers
      .filter((row) => isVisible(row) && row.organisation === organisation.id)
      .flatMap((row) => {
        const exhibition = exhibitionById.get(row.exhibition)
        return exhibition ? [{ id: exhibition.id, slug: exhibition.slug, title: exhibition.title, role: row.role, exhibition }] : []
      })
      .sort((a, b) => b.exhibition.start_date.localeCompare(a.exhibition.start_date))

    return {
      id: organisation.id,
      slug: organisation.slug,
      title: organisation.title,
      short_title: (text.short_title as string) || undefined,
      kind: organisation.kind,
      founded: organisation.founded ?? undefined,
      address: organisation.address ?? undefined,
      city: location?.title,
      logo: organisation.logo ?? undefined,
      logo_alt: (text.logo_alt as string) || undefined,
      lede: (text.lede as string) || undefined,
      about: (text.about as string[]) || undefined,
      description: (text.description as string) || undefined,
      websites: links,
      venues: venueLinks,
      members,
      records,
      letter: organisationLetter(organisation.title)
    }
  }).sort((left, right) => left.title.localeCompare(right.title, locale))
}

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

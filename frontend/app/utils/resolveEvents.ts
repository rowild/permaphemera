import type { EventEditionRecord, EventKind, EventOrganiserRecord, EventRecord, ExhibitionOrganiserRole, ExhibitionRecord, JunctionRow, LocationRecord, OrganisationRecord, WebsiteRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { hostnameOf, linksThrough } from '~/utils/externalLinks'
import { pickTranslation } from '~/utils/pickTranslation'
import type { ResolvedLink } from '~/utils/resolveExhibitions'
import { toRichHtml } from '~/utils/richText'

// Events (plans/2026-11-04__events-collection.md): a festival or a museum night with its own page,
// one edition per year, the exhibitions of each edition and the organisations that put it on.

export interface ResolvedEventEdition {
  id: string
  year: number
  /** The count the event itself uses (the "7th" Comicfestival). */
  edition_number?: number
  start_date?: string
  end_date?: string
  /** The published exhibitions of this edition. */
  exhibitionIds: string[]
}

export interface ResolvedEventOrganiser {
  slug: string
  title: string
  role: ExhibitionOrganiserRole
}

export interface ResolvedEvent {
  id: string
  slug: string
  title: string
  kind: EventKind
  /** The town; none for an event across the country (Lange Nacht der Museen). */
  city?: string
  lede?: string
  description?: string
  aboutHtml?: string
  image?: string
  image_alt?: string
  image_caption?: string
  links: ResolvedLink[]
  organisers: ResolvedEventOrganiser[]
  /** Newest first. */
  editions: ResolvedEventEdition[]
  exhibitionCount: number
}

/** What an exhibition page says about its event: "Part of the Spittaler Comicfestival 2026". */
export interface EventRef {
  slug: string
  title: string
  year: number
  edition_number?: number
}

export interface EventSources {
  events: EventRecord[]
  editions: EventEditionRecord[]
  organisers: EventOrganiserRecord[]
  organisations: OrganisationRecord[]
  locations: LocationRecord[]
  exhibitions: Pick<ExhibitionRecord, 'id' | 'event_edition' | 'status'>[]
  websites: WebsiteRecord[]
  eventsWebsites: JunctionRow[]
  locale: string
}

export const resolveEvents = (s: EventSources): ResolvedEvent[] => {
  const locationById = new Map(s.locations.filter(isVisible).map((location) => [location.id, location]))
  const organisationById = new Map(s.organisations.filter(isVisible).map((organisation) => [organisation.id, organisation]))
  const websiteById = new Map(s.websites.filter(isVisible).map((site) => [site.id, site]))
  const visibleExhibitions = s.exhibitions.filter(isVisible)

  return s.events.filter(isVisible).map((event) => {
    const text = pickTranslation(event, s.locale)
    const ownWebsite: ResolvedLink[] = event.website_url
      ? [{ id: `${event.id}-website`, title: hostnameOf(event.website_url), url: event.website_url, kind: 'website' }]
      : []
    const links = [...ownWebsite, ...linksThrough(websiteById, s.eventsWebsites, 'events_id', event.id, s.locale)]
      .filter((link, index, all) => all.findIndex((other) => other.url === link.url) === index)

    const editions: ResolvedEventEdition[] = s.editions
      .filter((edition) => edition.event === event.id)
      .sort((a, b) => b.year - a.year || b.sort - a.sort)
      .map((edition) => ({
        id: edition.id,
        year: edition.year,
        edition_number: edition.edition_number ?? undefined,
        start_date: edition.start_date ?? undefined,
        end_date: edition.end_date ?? undefined,
        exhibitionIds: visibleExhibitions.filter((exhibition) => exhibition.event_edition === edition.id).map((exhibition) => exhibition.id)
      }))

    // Organiser rows carry no status: a row counts when the organisation is published too.
    const organisers = s.organisers
      .filter((row) => row.event === event.id)
      .sort((a, b) => a.sort - b.sort)
      .flatMap((row) => {
        const organisation = organisationById.get(row.organisation)
        return organisation ? [{ slug: organisation.slug, title: organisation.title, role: row.role }] : []
      })

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      kind: event.kind,
      city: event.location ? locationById.get(event.location)?.title : undefined,
      lede: (text.lede as string) || event.lede || undefined,
      description: (text.description as string) || event.description || undefined,
      aboutHtml: toRichHtml((text.about_html as string) || event.about_html),
      image: event.image ?? undefined,
      image_alt: (text.image_alt as string) || event.image_alt || undefined,
      image_caption: (text.image_caption as string) || event.image_caption || undefined,
      links,
      organisers,
      editions,
      exhibitionCount: editions.reduce((count, edition) => count + edition.exhibitionIds.length, 0)
    }
  })
}

/** For each exhibition that is part of an event: the event and the year. */
export const eventByExhibition = (events: ResolvedEvent[]): Map<string, EventRef> => new Map(events.flatMap((event) =>
  event.editions.flatMap((edition) => edition.exhibitionIds.map((id) => [id, { slug: event.slug, title: event.title, year: edition.year, ...(edition.edition_number ? { edition_number: edition.edition_number } : {}) }] as const))))

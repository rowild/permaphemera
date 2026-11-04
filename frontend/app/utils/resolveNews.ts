import type { JunctionRow, NewsRecord, NewsTopic } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import type { ResolvedOrganisation } from '~/utils/resolveOrganisations'
import type { ResolvedPerson } from '~/utils/resolvePersons'
import type { ResolvedSponsor } from '~/utils/resolveSponsors'
import type { ResolvedVenue } from '~/utils/resolveVenues'

/** The topics in the order the filter shows them. */
export const NEWS_TOPICS: readonly NewsTopic[] = ['welcome', 'support', 'opening', 'closing', 'site']

/** A news article as its pages show it: texts in the current language, published links only. */
export interface ResolvedNews {
  id: string
  slug: string
  title: string
  /** YYYY-MM-DD */
  date: string
  topic: NewsTopic
  /** The own image, else the image of the first linked exhibition, else of the first gallery. */
  image?: string
  image_alt: string
  summary?: string
  description?: string
  exhibitions: ResolvedExhibition[]
  venues: ResolvedVenue[]
  persons: ResolvedPerson[]
  organisations: ResolvedOrganisation[]
  sponsors: ResolvedSponsor[]
}

export interface NewsSources {
  news: NewsRecord[]
  exhibitions: ResolvedExhibition[]
  venues: ResolvedVenue[]
  persons: ResolvedPerson[]
  organisations: ResolvedOrganisation[]
  sponsors: ResolvedSponsor[]
  exhibitionsNews: JunctionRow[]
  newsVenues: JunctionRow[]
  newsPersons: JunctionRow[]
  newsOrganisations: JunctionRow[]
  newsSponsors: JunctionRow[]
  locale: string
}

// The resolved lists hold published records only, so a link to a draft simply finds nothing.
const linked = <T extends { id: string }>(rows: JunctionRow[], newsId: string, column: string, records: T[]): T[] => {
  const byId = new Map(records.map((record) => [record.id, record]))
  return rows
    .filter((row) => row.news_id === newsId)
    .sort((a, b) => a.sort - b.sort)
    .flatMap((row) => {
      const record = byId.get(String(row[column]))
      return record ? [record] : []
    })
}

const text = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value : undefined)

/** Published articles, newest first; same day: by title. */
export const resolveNews = (s: NewsSources): ResolvedNews[] => s.news
  .filter(isVisible)
  .map((record) => {
    const words = pickTranslation(record, s.locale)
    const exhibitions = linked(s.exhibitionsNews, record.id, 'exhibitions_id', s.exhibitions)
    const venues = linked(s.newsVenues, record.id, 'venues_id', s.venues)
    const ownImage = record.image && !(record as NewsRecord & { image_placeholder?: boolean }).image_placeholder ? record.image : undefined
    const galleryWithImage = venues.find((venue) => venue.has_image)
    const picture = ownImage
      ? { image: ownImage, alt: text(words.image_alt) ?? record.image_alt ?? '' }
      : exhibitions[0]
        ? { image: exhibitions[0].image, alt: exhibitions[0].image_alt }
        : galleryWithImage && { image: galleryWithImage.image, alt: galleryWithImage.image_alt }
    const title = text(words.title) ?? record.title
    return {
      id: record.id,
      slug: record.slug,
      title,
      date: record.published_on,
      topic: record.topic,
      image: picture ? picture.image : undefined,
      image_alt: picture ? picture.alt || '' : '',
      summary: text(words.summary) ?? text(record.summary),
      description: text(words.description) ?? text(record.description),
      exhibitions,
      venues,
      persons: linked(s.newsPersons, record.id, 'persons_id', s.persons),
      organisations: linked(s.newsOrganisations, record.id, 'organisations_id', s.organisations),
      sponsors: linked(s.newsSponsors, record.id, 'sponsors_id', s.sponsors)
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))

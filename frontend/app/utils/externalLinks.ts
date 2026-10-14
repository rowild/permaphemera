import type { JunctionRow, WebsiteRecord } from '~/types/content'
import { pickTranslation } from '~/utils/pickTranslation'
import type { ResolvedLink } from '~/utils/resolveExhibitions'

/** "https://www.example.at/x" → "example.at"; a URL that does not parse comes back unchanged. */
export const hostnameOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const PLATFORMS: Record<string, string> = {
  'instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'youtube.com': 'YouTube',
  'vimeo.com': 'Vimeo',
  'x.com': 'X',
  'twitter.com': 'X',
  'tiktok.com': 'TikTok',
  'linkedin.com': 'LinkedIn'
}

/**
 * A website reads as its host name ("galerie3.com"), a known platform as its name ("Instagram"),
 * anything else as its link title.
 */
export const linkLabel = (link: Pick<ResolvedLink, 'url' | 'title' | 'kind'>): string => {
  if (link.kind === 'website') return hostnameOf(link.url)
  return PLATFORMS[hostnameOf(link.url)] ?? link.title
}

/**
 * The links one record reaches through a websites junction, in junction order.
 * `websiteById` holds only visible links, so unpublished ones drop out here.
 */
export const linksThrough = (
  websiteById: Map<string, WebsiteRecord>,
  rows: JunctionRow[],
  ownerColumn: string,
  ownerId: string,
  locale: string
): ResolvedLink[] => rows
  .filter((row) => row[ownerColumn] === ownerId)
  .sort((a, b) => a.sort - b.sort)
  .flatMap((row) => {
    const site = websiteById.get(String(row.websites_id))
    if (!site) return []
    const words = pickTranslation(site, locale)
    return [{ id: site.id, title: (words.title as string) || site.title, url: site.url, kind: site.kind }]
  })

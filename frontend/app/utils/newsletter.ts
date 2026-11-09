// The newsletter sign-up without Vue: topics, the town list, the request body and the rule
// for the invite. The server side is the Directus extension
// `directus/extensions/permaphemera-newsletter` (plan: plans/2026-11-07__newsletter.md).

import { tourStartViewUrl } from '../../shared/tour-access.mjs'
import { openTourExhibitions, type TourReadyExhibition } from '~/utils/tourAccess'

export const NEWSLETTER_TOPICS = ['new_records', 'nearby', 'closing_soon', 'project_news'] as const
export type NewsletterTopic = typeof NEWSLETTER_TOPICS[number]

/** Names the consent text shown in the form. Change it whenever that text changes. */
export const NEWSLETTER_CONSENT_VERSION = '2026-11-nl-v1'

export const NEWSLETTER_INVITE_STORAGE_KEY = 'permaphemera-newsletter-invite'
export const INVITE_DELAY_MS = 10_000
export const INVITE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000

export const newsletterEndpoint = (directusUrl: string) => `${directusUrl.replace(/\/+$/, '')}/newsletter/subscribe`

// ── towns ─────────────────────────────────────────────────────────────────

interface TownSource { slug: string, title: string, state: string, status: string }
export interface TownOption { slug: string, title: string }
export interface TownGroup { state: string, label: string, towns: TownOption[] }

/** Published towns by federal state; `stateName` gives the shown name of a stored state. */
export function groupTownsByState(locations: TownSource[], stateName: (state: string) => string): TownGroup[] {
  const groups = new Map<string, TownOption[]>()
  for (const location of locations) {
    if (location.status !== 'published') continue
    const state = location.state ?? ''
    groups.set(state, [...(groups.get(state) ?? []), { slug: location.slug, title: location.title }])
  }
  const byName = (a: string, b: string) => a.localeCompare(b, 'de')
  return [...groups.entries()]
    .map(([state, towns]) => ({ state, label: state ? stateName(state) : '', towns: towns.sort((a, b) => byName(a.title, b.title)) }))
    .sort((a, b) => (!a.state ? 1 : !b.state ? -1 : byName(a.label, b.label)))
}

// ── the request ───────────────────────────────────────────────────────────

export interface NewsletterInput {
  email: string
  name: string
  towns: string[]
  topics: string[]
  consent: boolean
  /** The hidden field bots fill in. */
  website: string
}

export interface NewsletterContext {
  language: string
  source: 'page' | 'invite'
  pageUrl: string
  /** When the form appeared (ms); a form sent within 2 s counts as a bot. */
  startedAt: number
}

export const buildSubscribeBody = (input: NewsletterInput, context: NewsletterContext) => ({
  email: input.email.trim(),
  name: input.name.trim(),
  language: context.language,
  towns: [...input.towns],
  topics: [...input.topics],
  consent: input.consent,
  consentVersion: NEWSLETTER_CONSENT_VERSION,
  source: context.source,
  pageUrl: context.pageUrl,
  website: input.website,
  startedAt: context.startedAt
})

// ── the invite ────────────────────────────────────────────────────────────

/**
 * What the browser remembers about the invite. `shown` and `dismissed` keep it away for
 * 30 days from `savedAt`; `subscribed` (a sign-up was sent) and `never` ("never show again")
 * keep it away for good.
 */
export const INVITE_STATES = ['shown', 'dismissed', 'subscribed', 'never'] as const
export type InviteState = typeof INVITE_STATES[number]
export interface InviteRecord { state: InviteState, savedAt: number, version: 1 }

/** The invite never comes again after these. */
export const inviteClosedForGood = (record: InviteRecord | null) =>
  record?.state === 'subscribed' || record?.state === 'never'

export function parseInviteRecord(raw: string | null): InviteRecord | null {
  if (!raw) return null
  try {
    const record = JSON.parse(raw) as Partial<InviteRecord>
    const valid = record?.version === 1
      && (INVITE_STATES as readonly unknown[]).includes(record.state)
      && typeof record.savedAt === 'number'
    return valid ? record as InviteRecord : null
  } catch {
    return null
  }
}

// Reading the privacy policy or signing up already: no interruption there.
const SUPPRESSED = /^(?:\/en)?\/(?:privacy|imprint|terms|accessibility|newsletter)(?:\/|$)/

export const inviteSuppressedOn = (path: string) => SUPPRESSED.test(path)

export function inviteAllowed({ record, now, path, cookieNoticeOpen }: {
  record: InviteRecord | null
  now: number
  path: string
  cookieNoticeOpen: boolean
}): boolean {
  if (cookieNoticeOpen || inviteSuppressedOn(path)) return false
  if (!record) return true
  if (inviteClosedForGood(record)) return false
  return now - record.savedAt >= INVITE_COOLDOWN_MS
}

// ── the modal's picture ──────────────────────────────────────────────────

/** How many open tours the modal tries for a room picture before it takes the Parkschlössl. */
const INVITE_PICTURE_TRIES = 3

/**
 * The room pictures (`start-view.jpg`) of the newest open tours, newest first: the modal shows
 * the first one that loads. A tour copied after the last upload has no picture on the server yet.
 */
export const invitePictures = <T extends TourReadyExhibition & { start_date: string, image: string, tour?: string | null }>(
  exhibitions: readonly T[],
  today: string
) => openTourExhibitions(exhibitions, today)
  .slice(0, INVITE_PICTURE_TRIES)
  .map((exhibition) => ({ src: tourStartViewUrl(exhibition.tour!), exhibition }))

const loadImage = (src: string) => new Promise<void>((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve()
  image.onerror = () => reject(new Error(`could not load ${src}`))
  image.src = src
})

/** The first address in `sources` that loads as an image, or null. */
export async function firstLoadedImage(sources: readonly string[], load: (src: string) => Promise<void> = loadImage): Promise<string | null> {
  for (const src of sources) {
    try {
      await load(src)
      return src
    } catch {
      // Not there (yet): try the next one.
    }
  }
  return null
}

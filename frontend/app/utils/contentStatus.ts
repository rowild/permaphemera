import type { ContentStatus } from '~/types/content'

/**
 * Which records reach the frontend.
 *
 * Since the site went live on permaphemera.at (2026-09-16) only published
 * records render. Drafts stay in Directus until the owner publishes them;
 * archived records never render. This is the only place that decides —
 * no component contains a status conditional.
 */
export const VISIBLE_STATUSES: readonly ContentStatus[] = ['published']

export const isVisible = <T extends { status: ContentStatus }>(record: T): boolean =>
  VISIBLE_STATUSES.includes(record.status)

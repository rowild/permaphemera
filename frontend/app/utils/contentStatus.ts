import type { ContentStatus } from '~/types/content'

/**
 * Which records reach the frontend.
 *
 * `status` marks provenance, not visibility. While the project is work in
 * progress much of the content is invented or refers to institutions that are
 * not yet partners, and it must still render or most pages would be empty.
 *
 * Pre-launch, narrow this to ['published']. That is the only change required —
 * no component contains a status conditional.
 */
export const VISIBLE_STATUSES: readonly ContentStatus[] = ['published', 'draft']

export const isVisible = <T extends { status: ContentStatus }>(record: T): boolean =>
  VISIBLE_STATUSES.includes(record.status)

import type { LegalLinkItem, LegalRecordItem } from '~/types/legal'

/**
 * One section of a text or legal page (about, how it works, contact, imprint, privacy, terms,
 * accessibility): ArchiveEditorialSection's props. Legal sections bring label/value `details` and
 * source `links`, and often no eyebrow or accent.
 */
export interface EditorialSection {
  id: string
  eyebrow?: string
  title: string
  accent?: string
  paragraphs?: string[]
  items?: string[]
  emphasizedTerms?: string[]
  details?: LegalRecordItem[]
  links?: LegalLinkItem[]
}

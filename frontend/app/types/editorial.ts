/** One section of a text page (about, how it works, contact): ArchiveEditorialSection's props. */
export interface EditorialSection {
  id: string
  eyebrow: string
  title: string
  accent: string
  paragraphs: string[]
  items?: string[]
  emphasizedTerms?: string[]
}

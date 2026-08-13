export interface LegalRecordItem {
  label: string
  value: string
  href?: string
}

export interface LegalLinkItem {
  label: string
  href: string
}

export interface LegalSection {
  id: string
  eyebrow?: string
  title: string
  paragraphs?: string[]
  items?: string[]
  details?: LegalRecordItem[]
  links?: LegalLinkItem[]
}

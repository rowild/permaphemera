// frontend/shared/seo.d.mts
// Type declarations for seo.mjs, which is plain JS so the Node scripts import it without a build step.

export type SeoLocale = 'de' | 'en'

export interface SeoEntry {
  path: string
  locale: SeoLocale
  title: string
  description: string
  image: string
  imageAlt: string
  ogType: string
  noIndex: boolean
  noFollow: boolean
  canonical: string
  alternates: { de: string, en: string, 'x-default': string }
  jsonLd: object[]
  lastmod?: string
  changeFrequency: string
  priority: string
}

export interface SeoHead {
  title: string
  meta: { name?: string, property?: string, content: string }[]
  link: { rel: string, href: string, hreflang?: string }[]
  jsonLd: string[]
}

export interface SeoRead {
  title?: string
  description?: string
  image?: string
  noIndex: boolean
  noFollow: boolean
  changeFrequency?: string
  priority?: string
}

export declare const SITE_URL: string
export declare const SITE_NAME: string
export declare const DEFAULT_SHARE_IMAGE: string
export declare function localizedPath(path: string, locale: SeoLocale): string
export declare function stripMarkup(value: unknown): string
export declare function fitTitle(base: string, max?: number): string
export declare function fitDescription(text: string, max?: number): string
export declare function readSeo(record: object, locale: SeoLocale): SeoRead
export declare function recordSeoEntries(archive: object, options: { assetBase: string, messages: { de: object, en: object } }): SeoEntry[]
export declare function staticSeoEntries(messages: { de: object, en: object }, counts?: { venues?: number, organisations?: number }): SeoEntry[]
export declare function headFor(entry: SeoEntry): SeoHead

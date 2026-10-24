import type { MaybeRefOrGetter } from 'vue'
import { headFor, pageSeoEntry, type SeoEntry, type SeoLocale, type SeoMessages } from '../../shared/seo.mjs'

/**
 * Puts the SEO entry of `path` (locale-neutral, e.g. `/exhibitions/trigeniale-26/`) into the head:
 * title, description, share image, canonical, hreflang, robots and JSON-LD. The entries come from
 * shared/seo.mjs, the same module the deploy uses for the static snapshots, so both agree.
 */
export function usePageSeo(path: MaybeRefOrGetter<string>) {
  const archive = useArchiveSnapshot()
  const ready = useArchiveReady()
  const { locale, t, te } = useI18n()
  const assetBase = String(useRuntimeConfig().public.directusUrl).replace(/\/$/, '')

  const entry = computed<SeoEntry | undefined>(() => {
    const code: SeoLocale = locale.value === 'en' ? 'en' : 'de'
    // The site's messages are precompiled, so the module reads them through t(); only the
    // active locale's entries are needed.
    const messages: SeoMessages = (_locale, key, params = {}) => {
      if (!te(key)) return undefined
      return typeof params.count === 'number' ? t(key, params, params.count) : t(key, params)
    }
    return pageSeoEntry(archive.value, { path: toValue(path), locale: code, messages, assetBase, ready: ready.value })
  })

  useHead(() => {
    if (!entry.value) return {}
    const head = headFor(entry.value)
    return {
      title: head.title,
      meta: head.meta,
      link: head.link,
      script: head.jsonLd.map((json) => ({ type: 'application/ld+json', innerHTML: json }))
    }
  })
}

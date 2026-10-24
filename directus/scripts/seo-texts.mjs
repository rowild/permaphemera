// directus/scripts/seo-texts.mjs
// Rules for the hand-written SEO texts that write-seo.mjs puts into Directus
// (docs/superpowers/specs/2026-10-24-seo-design.md, "Content").

export const TITLE_MAX = 60
export const DESCRIPTION_MIN = 130
export const DESCRIPTION_MAX = 160
export const COLLECTION_OF = { exhibitions: 'pp_exhibitions', venues: 'pp_venues', persons: 'pp_persons', organisations: 'pp_organisations', sponsors: 'pp_sponsors' }

/** Problems in [{ collection, slug, en: { title, meta_description }, de: { … } }], one line each. */
export const validateSeoTexts = (items) => {
  const errors = []
  const seen = new Set()
  for (const item of items) {
    const id = `${item.collection}/${item.slug}`
    if (!COLLECTION_OF[item.collection]) { errors.push(`${id}: unknown collection`); continue }
    if (seen.has(id)) { errors.push(`${id}: listed twice`); continue }
    seen.add(id)
    for (const locale of ['en', 'de']) {
      const text = item[locale]
      if (!text) { errors.push(`${id} ${locale}: missing`); continue }
      const title = String(text.title ?? '').trim()
      const description = String(text.meta_description ?? '').trim()
      if (!title || title.length > TITLE_MAX) errors.push(`${id} ${locale}: title has ${title.length} characters (max ${TITLE_MAX})`)
      if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX) errors.push(`${id} ${locale}: description has ${description.length} characters (${DESCRIPTION_MIN}–${DESCRIPTION_MAX})`)
    }
  }
  return errors
}

/** The stored seo object with new title and description; share image, robots and sitemap stay. */
export const mergeSeo = (current, text) => ({ ...(current ?? {}), title: text.title.trim(), meta_description: text.meta_description.trim() })

// frontend/shared/source-links.mjs
// Every source under a text links to the exact page it came from (owner, 2026-11-09): the
// article or profile with its full address, never a bare domain (a start page only for a one-page site). Plain JS, so
// `pnpm check:data` (Node) and the tests share it. A source without a web address (a poster,
// a printed invitation) may stay plain text.

const SOURCES = /<p>\s*(?:Quellen?|Sources?)\s*:?\s*<\/p>\s*<ul>((?:(?!<\/?ul>)[\s\S])*)<\/ul>\s*$/i
const WEB_ADDRESS = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\b/i
const text = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

/** A link a reader can open: https (http where a source site has no https). Whether it is the exact
 * page is a research rule (docs/how-to-gallery-and-exhibition.md §7a): a one-page site holds its
 * facts on the start page. */
const isPageLink = (href) => {
  try {
    return ['https:', 'http:'].includes(new URL(href).protocol)
  } catch {
    return false
  }
}

/** The sources of a text that name a web address but do not link to a page (their visible text). */
export function unlinkedSources (html) {
  const list = (html ?? '').trim().match(SOURCES)?.[1]
  if (!list) return []
  return [...list.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map(([, item]) => ({ label: text(item), href: item.match(/<a\b[^>]*\bhref="([^"]*)"/i)?.[1] }))
    .filter(({ label, href }) => href ? !isPageLink(href) : WEB_ADDRESS.test(label))
    .map(({ label }) => label)
}

/** "slug (language): source" for every published record whose `field` has an unlinked source. */
export function unlinkedSourceLeaks (records, field) {
  return records
    .filter((record) => record.status === 'published')
    .flatMap((record) => (record.translations ?? []).flatMap((entry) =>
      unlinkedSources(entry[field]).map((source) => `${record.slug} (${entry.languages_code}): ${source}`)))
}

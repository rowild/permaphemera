/**
 * Rich text from the Directus WYSIWYG fields (`about_html`), made safe for `v-html`.
 *
 * Only paragraphs, line breaks, bold, italic and lists survive, always without attributes.
 * Links are dropped (their text stays): every external address is a link record, never text.
 * Exception (2026-11-04): with `{ links: true }` (news articles) a link stays when it points to
 * a page of the site (`/…`) or to an `https://` address; the external one opens in a new tab.
 * The closing sources list keeps those links in every text (owner, 2026-11-09): each source
 * links to the exact page it came from.
 * Script and style blocks go with their content; any other angle bracket is escaped, so no
 * unknown or broken tag can reach the page.
 */
const KEEP: Record<string, string> = { p: 'p', br: 'br', strong: 'strong', b: 'strong', em: 'em', i: 'em', ul: 'ul', ol: 'ol', li: 'li' }
const KEPT_TAG = /(<\/?(?:p|br|strong|em|ul|ol|li)>)/
const KEPT_TAG_WITH_LINKS = /(<\/?(?:p|br|strong|em|ul|ol|li)>|<a href="[^"<>]*"(?: target="_blank" rel="noopener noreferrer")?>|<\/a>)/

/** A site path (`/…`, never `//…`) or an https address, without quotes, brackets or spaces. */
const INTERNAL_HREF = /^\/(?!\/)[^\s"'<>`]*$/
const EXTERNAL_HREF = /^https:\/\/[^\s"'<>`]+$/
/** Sources only: a few source sites have no https (bv-kaernten.at, 2026-11-09). */
const EXTERNAL_HREF_HTTP = /^https?:\/\/[^\s"'<>`]+$/
export const isAllowedHref = (href: string) => INTERNAL_HREF.test(href) || EXTERNAL_HREF.test(href)

const hrefOf = (attributes: string) => {
  const match = attributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : ''
}

export interface RichTextOptions {
  /** Keep links to site pages and https addresses (news articles). */
  links?: boolean
  /** Gives a kept site link (`/…`) the current language's prefix. */
  localize?: (path: string) => string
}

interface CleanOptions extends RichTextOptions {
  /** Keep http links too (only the closing sources list keeps them). */
  http?: boolean
}

const clean = (html: string, options: CleanOptions): string => {
  const external = options.http ? EXTERNAL_HREF_HTTP : EXTERNAL_HREF
  const allowedHref = (href: string) => INTERNAL_HREF.test(href) || external.test(href)
  const openLinks: boolean[] = []
  const normalised = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|template|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (_tag, slash: string, name: string, attributes: string) => {
      if (options.links && name.toLowerCase() === 'a') {
        if (slash) return openLinks.pop() ? '</a>' : ''
        const href = hrefOf(attributes)
        const allowed = allowedHref(href)
        openLinks.push(allowed)
        if (!allowed) return ''
        if (external.test(href)) return `<a href="${href}" target="_blank" rel="noopener noreferrer">`
        const local = options.localize ? options.localize(href) : href
        return `<a href="${isAllowedHref(local) ? local : href}">`
      }
      const kept = KEEP[name.toLowerCase()]
      if (!kept) return ''
      return kept === 'br' ? (slash ? '' : '<br>') : `<${slash}${kept}>`
    })
  const escaped = normalised
    .split(options.links ? KEPT_TAG_WITH_LINKS : KEPT_TAG)
    .map((part, index) => (index % 2 ? part : part.replace(/</g, '&lt;').replace(/>/g, '&gt;')))
    .join('')
  return escaped.replace(/<p>(?:\s|&nbsp;|<br>)*<\/p>/g, '').trim()
}

/** The sources block that closes a text, in sanitised HTML: a label paragraph, then the list. */
const SOURCES = /<p>\s*(Quellen?|Sources?)\s*:?\s*<\/p>\s*<ul>((?:(?!<\/?ul>)[\s\S])*)<\/ul>\s*$/i

export const sanitizeRichText = (html: string, options: RichTextOptions = {}): string => {
  if (options.links) return clean(html, options)
  const linked = clean(html, { ...options, links: true, http: true })
  const sources = linked.match(SOURCES)
  const end = sources?.index ?? linked.length
  return linked.slice(0, end).replace(/<a [^>]*>|<\/a>/g, '') + linked.slice(end)
}

const showsText = (safe: string) => Boolean(safe.replace(/<[^>]+>|&nbsp;/g, '').trim())

/** True when the HTML still shows some text after sanitising. */
export const hasRichText = (html?: string | null, options: RichTextOptions = {}): boolean =>
  Boolean(html && showsText(sanitizeRichText(html, options)))

/** Sanitised HTML (once), or undefined when nothing visible is left (so pages can show their fallback). */
export const toRichHtml = (html?: string | null, options: RichTextOptions = {}): string | undefined => {
  if (!html) return undefined
  const safe = sanitizeRichText(html, options)
  return showsText(safe) ? safe : undefined
}

/**
 * Sources close a text as their own block (owner, 2026-11-06): a paragraph with only the label
 * ("Quelle", "Quellen", "Source", "Sources", a colon allowed) and the list right after it, as the
 * last block. Runs on sanitised HTML (no attributes left), so only this step can set the two classes.
 */
export const markSources = (safeHtml: string): string => safeHtml.replace(SOURCES, (_block, label: string, items: string) =>
  `<p class="archive-sources-label">${label}</p><ul class="archive-sources">${items}</ul>`)

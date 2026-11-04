/**
 * Rich text from the Directus WYSIWYG fields (`about_html`), made safe for `v-html`.
 *
 * Only paragraphs, line breaks, bold, italic and lists survive, always without attributes.
 * Links are dropped (their text stays): every external address is a link record, never text.
 * Exception (2026-11-04): with `{ links: true }` (news articles) a link stays when it points to
 * a page of the site (`/…`) or to an `https://` address; the external one opens in a new tab.
 * Script and style blocks go with their content; any other angle bracket is escaped, so no
 * unknown or broken tag can reach the page.
 */
const KEEP: Record<string, string> = { p: 'p', br: 'br', strong: 'strong', b: 'strong', em: 'em', i: 'em', ul: 'ul', ol: 'ol', li: 'li' }
const KEPT_TAG = /(<\/?(?:p|br|strong|em|ul|ol|li)>)/
const KEPT_TAG_WITH_LINKS = /(<\/?(?:p|br|strong|em|ul|ol|li)>|<a href="[^"<>]*"(?: target="_blank" rel="noopener noreferrer")?>|<\/a>)/

/** A site path (`/…`, never `//…`) or an https address, without quotes, brackets or spaces. */
const INTERNAL_HREF = /^\/(?!\/)[^\s"'<>`]*$/
const EXTERNAL_HREF = /^https:\/\/[^\s"'<>`]+$/
export const isAllowedHref = (href: string) => INTERNAL_HREF.test(href) || EXTERNAL_HREF.test(href)

const hrefOf = (attributes: string) => {
  const match = attributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : ''
}

export interface RichTextOptions {
  /** Keep links to site pages and https addresses (news articles). */
  links?: boolean
}

export const sanitizeRichText = (html: string, options: RichTextOptions = {}): string => {
  const openLinks: boolean[] = []
  const normalised = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|template|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (_tag, slash: string, name: string, attributes: string) => {
      if (options.links && name.toLowerCase() === 'a') {
        if (slash) return openLinks.pop() ? '</a>' : ''
        const href = hrefOf(attributes)
        const allowed = isAllowedHref(href)
        openLinks.push(allowed)
        if (!allowed) return ''
        return EXTERNAL_HREF.test(href) ? `<a href="${href}" target="_blank" rel="noopener noreferrer">` : `<a href="${href}">`
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

/** True when the HTML still shows some text after sanitising. */
export const hasRichText = (html?: string | null, options: RichTextOptions = {}): boolean =>
  Boolean(html && sanitizeRichText(html, options).replace(/<[^>]+>|&nbsp;/g, '').trim())

/** Sanitised HTML, or undefined when nothing visible is left (so pages can show their fallback). */
export const toRichHtml = (html?: string | null, options: RichTextOptions = {}): string | undefined =>
  (hasRichText(html, options) ? sanitizeRichText(html!, options) : undefined)

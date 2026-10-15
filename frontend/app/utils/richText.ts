/**
 * Rich text from the Directus WYSIWYG fields (`about_html`), made safe for `v-html`.
 *
 * Only paragraphs, line breaks, bold, italic and lists survive, always without attributes.
 * Links are dropped (their text stays): every external address is a link record, never text.
 * Script and style blocks go with their content; any other angle bracket is escaped, so no
 * unknown or broken tag can reach the page.
 */
const KEEP: Record<string, string> = { p: 'p', br: 'br', strong: 'strong', b: 'strong', em: 'em', i: 'em', ul: 'ul', ol: 'ol', li: 'li' }
const KEPT_TAG = /(<\/?(?:p|br|strong|em|ul|ol|li)>)/

export const sanitizeRichText = (html: string): string => {
  const normalised = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|template|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (_tag, slash: string, name: string) => {
      const kept = KEEP[name.toLowerCase()]
      if (!kept) return ''
      return kept === 'br' ? (slash ? '' : '<br>') : `<${slash}${kept}>`
    })
  const escaped = normalised
    .split(KEPT_TAG)
    .map((part, index) => (index % 2 ? part : part.replace(/</g, '&lt;').replace(/>/g, '&gt;')))
    .join('')
  return escaped.replace(/<p>(?:\s|&nbsp;|<br>)*<\/p>/g, '').trim()
}

/** True when the HTML still shows some text after sanitising. */
export const hasRichText = (html?: string | null): boolean =>
  Boolean(html && sanitizeRichText(html).replace(/<[^>]+>|&nbsp;/g, '').trim())

/** Sanitised HTML, or undefined when nothing visible is left (so pages can show their fallback). */
export const toRichHtml = (html?: string | null): string | undefined => (hasRichText(html) ? sanitizeRichText(html!) : undefined)

// The closing source line of a text, as its own block (owner, 2026-11-06). Pure functions,
// shared by migrate-sources.mjs and exhibitions-to-wysiwyg.mjs.

export const LABEL = { en: ['Source', 'Sources'], de: ['Quelle', 'Quellen'] }

export const escapeHtml = (value) => value.replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Split at commas outside brackets: "a.at (Paper, 2024), b.at" → ["a.at (Paper, 2024)", "b.at"]. */
export const splitSources = (list) => {
  const items = []
  let depth = 0
  let current = ''
  for (const char of list) {
    if (char === '(' || char === '[') depth += 1
    if (char === ')' || char === ']') depth = Math.max(0, depth - 1)
    if ((char === ',' || char === ';') && depth === 0) { items.push(current); current = ''; continue }
    current += char
  }
  items.push(current)
  return items.map((item) => item.trim().replace(/\.$/, '').trim()).filter(Boolean)
}

// "… sentence. Source: a, b." at the end of the last paragraph. Only the last label counts: an
// inline "(source: …)" for one fact earlier in the text stays where it is.
const HTML_TAIL = /\s*(?:Sources?|Quellen?)\s*:\s*((?:(?!(?:Sources?|Quellen?)\s*:)[^<])+?)\s*<\/p>\s*$/i

/** HTML with the closing source line → HTML with a label paragraph and a list. */
export const sourcesToList = (html, language) => {
  if (typeof html !== 'string') return { status: 'empty' }
  const match = html.match(HTML_TAIL)
  if (!match) return { status: /(?:Sources?|Quellen?)\s*:/i.test(html) ? 'not-at-end' : 'none', text: html }
  const items = splitSources(match[1])
  if (!items.length) return { status: 'not-at-end', text: html }
  const label = LABEL[language][items.length > 1 ? 1 : 0]
  const body = `${html.slice(0, match.index)}</p>`.replace(/<p>\s*<\/p>$/, '')
  return { status: 'changed', text: `${body}<p>${label}</p><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` }
}

/** A plain text (one paragraph per blank-line block) → HTML paragraphs. */
export const plainToHtml = (text) => text.trim().split(/\n\s*\n/).map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br>')}</p>`).join('')

/**
 * Markdown (news articles before 2026-11-06) → HTML, the same rules the site used
 * (frontend/app/utils/newsMarkdown.ts, removed): blank line = paragraph, line break = <br>,
 * **bold**, *italic*, lists with "- " or "1. ", links to a site path or https; other links stay text.
 * Site links are stored without language; the site adds it.
 */
const BULLET = /^\s*[-*]\s+/
const NUMBER = /^\s*\d+[.)]\s+/
const SITE_OR_HTTPS = /^(?:\/(?!\/)[^\s"'<>`]*|https:\/\/[^\s"'<>`]+)$/
const inline = (value) => escapeHtml(value)
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, text, url) => (SITE_OR_HTTPS.test(url.replace(/&amp;/g, '&')) ? `<a href="${url}">${text}</a>` : text))
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
export const markdownToHtml = (markdown) => markdown.replace(/\r\n?/g, '\n').split(/\n\s*\n/)
  .map((chunk) => chunk.split('\n').map((line) => line.trimEnd()).filter((line) => line.trim()))
  .filter((lines) => lines.length)
  .map((lines) => {
    if (lines.every((line) => BULLET.test(line))) return `<ul>${lines.map((line) => `<li>${inline(line.replace(BULLET, ''))}</li>`).join('')}</ul>`
    if (lines.every((line) => NUMBER.test(line))) return `<ol>${lines.map((line) => `<li>${inline(line.replace(NUMBER, ''))}</li>`).join('')}</ol>`
    return `<p>${lines.map(inline).join('<br>')}</p>`
  })
  .join('')

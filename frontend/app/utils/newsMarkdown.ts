import { isAllowedHref, toRichHtml } from '~/utils/richText'

/**
 * The text of a news article (markdown in Directus) as safe HTML for `v-html`.
 *
 * Only what an article needs: paragraphs (blank line), line breaks, **bold**, *italic*, lists
 * (`- ` or `1. `) and links `[text](/exhibitions/…/)` or `[text](https://…)`. A site path goes
 * through `localize` (the current language's prefix). Everything is escaped first and the result
 * goes through `sanitizeRichText` too, so no tag from the text can reach the page.
 */
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

type Localize = (path: string) => string

const inline = (value: string, localize: Localize) => escape(value)
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, text: string, url: string) => {
    const href = url.replace(/&amp;/g, '&')
    if (!isAllowedHref(href)) return text
    return `<a href="${href.startsWith('/') ? localize(href) : href}">${text}</a>`
  })
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')

const BULLET = /^\s*[-*]\s+/
const NUMBER = /^\s*\d+[.)]\s+/

const block = (lines: string[], localize: Localize) => {
  if (lines.every((line) => BULLET.test(line))) return `<ul>${lines.map((line) => `<li>${inline(line.replace(BULLET, ''), localize)}</li>`).join('')}</ul>`
  if (lines.every((line) => NUMBER.test(line))) return `<ol>${lines.map((line) => `<li>${inline(line.replace(NUMBER, ''), localize)}</li>`).join('')}</ol>`
  return `<p>${lines.map((line) => inline(line, localize)).join('<br>')}</p>`
}

/** Safe HTML, or undefined when the text is empty. */
export const newsMarkdownToHtml = (markdown?: string | null, localize: Localize = (path) => path): string | undefined => {
  if (!markdown?.trim()) return undefined
  const blocks = markdown.replace(/\r\n?/g, '\n').split(/\n\s*\n/)
    .map((chunk) => chunk.split('\n').map((line) => line.trimEnd()).filter((line) => line.trim()))
    .filter((lines) => lines.length)
  return toRichHtml(blocks.map((lines) => block(lines, localize)).join(''), { links: true })
}

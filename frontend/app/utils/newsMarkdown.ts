import { toRichHtml } from '~/utils/richText'

/**
 * The text of a news article (markdown in Directus) as safe HTML for `v-html`.
 *
 * Only what an article needs: paragraphs (blank line), line breaks, **bold**, *italic* and
 * lists (`- ` or `1. `). Everything is escaped first and the result goes through
 * `sanitizeRichText` too, so no tag from the text can reach the page. Links are not supported:
 * the records an article is about are linked below it.
 */
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const inline = (value: string) => escape(value)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')

const BULLET = /^\s*[-*]\s+/
const NUMBER = /^\s*\d+[.)]\s+/

const block = (lines: string[]) => {
  if (lines.every((line) => BULLET.test(line))) return `<ul>${lines.map((line) => `<li>${inline(line.replace(BULLET, ''))}</li>`).join('')}</ul>`
  if (lines.every((line) => NUMBER.test(line))) return `<ol>${lines.map((line) => `<li>${inline(line.replace(NUMBER, ''))}</li>`).join('')}</ol>`
  return `<p>${lines.map(inline).join('<br>')}</p>`
}

/** Safe HTML, or undefined when the text is empty. */
export const newsMarkdownToHtml = (markdown?: string | null): string | undefined => {
  if (!markdown?.trim()) return undefined
  const blocks = markdown.replace(/\r\n?/g, '\n').split(/\n\s*\n/)
    .map((chunk) => chunk.split('\n').map((line) => line.trimEnd()).filter((line) => line.trim()))
    .filter((lines) => lines.length)
  return toRichHtml(blocks.map(block).join(''))
}

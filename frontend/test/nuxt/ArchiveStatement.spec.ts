import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveStatement from '~/components/ArchiveStatement.vue'

// An artist's statement: on the exhibition page with the artist, on the person page with the
// exhibition (plans/…-audit.md 2.9).
describe('ArchiveStatement', () => {
  it('shows the prompt, the quoted text and the caption', async () => {
    const statement = await mountSuspended(ArchiveStatement, { props: { prompt: 'Wie ist der Raum gedacht?', text: 'Als Weg.' }, slots: { default: () => '— Inés Urach' } })
    expect(statement.get('figure p').text()).toBe('Wie ist der Raum gedacht?')
    expect(statement.get('blockquote').text()).toBe('Als Weg.')
    expect(statement.get('figcaption').text()).toBe('— Inés Urach')
  })

  it('has no prompt line without a prompt', async () => {
    const statement = await mountSuspended(ArchiveStatement, { props: { text: 'Als Weg.' }, slots: { default: () => 'x' } })
    expect(statement.find('figure > p').exists()).toBe(false)
  })
})

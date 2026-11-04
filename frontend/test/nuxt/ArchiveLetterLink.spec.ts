import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveLetterLink from '~/components/ArchiveLetterLink.vue'
import { ALPHABET } from '~/utils/artistDirectory'

// One letter of an A–Z rail (start page, artists page); before, the artists page's letters were
// smaller tap targets than the start page's (plans/…-audit.md 2.9).
describe('ArchiveLetterLink', () => {
  it('links a letter with artists, with a 44 px tall tap target', async () => {
    const link = (await mountSuspended(ArchiveLetterLink, { props: { to: '/artists/?letter=B' }, slots: { default: () => 'B' } })).get('a')
    expect(link.text()).toBe('B')
    expect(link.classes()).toEqual(expect.arrayContaining(['min-h-11', 'min-w-7']))
  })

  it('marks the chosen letter as the current page', async () => {
    const link = (await mountSuspended(ArchiveLetterLink, { props: { to: '/artists/?letter=B', current: true }, slots: { default: () => 'B' } })).get('a')
    expect(link.attributes('aria-current')).toBe('page')
  })

  it('shows a letter without artists as disabled text, not as a link', async () => {
    const letter = await mountSuspended(ArchiveLetterLink, { props: {}, slots: { default: () => 'Q' } })
    expect(letter.find('a').exists()).toBe(false)
    expect(letter.get('span').attributes('aria-disabled')).toBe('true')
  })

  it('shares one alphabet, with # for names that start otherwise', () => {
    expect(ALPHABET).toHaveLength(27)
    expect(ALPHABET.at(-1)).toBe('#')
  })
})

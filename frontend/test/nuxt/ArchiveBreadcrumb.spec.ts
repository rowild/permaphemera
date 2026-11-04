import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveBreadcrumb from '~/components/ArchiveBreadcrumb.vue'

const items = [{ label: 'Galerien', to: '/venues/' }, { label: 'Parkschlössl' }]
const crumbs = (route = '/about/', extra: Record<string, unknown> = {}) => mountSuspended(ArchiveBreadcrumb, { route, props: { items, ...extra } })

// Every breadcrumb starts at the start page and ends with the current page (plans/…-audit.md 2.4).
describe('ArchiveBreadcrumb', () => {
  it('always starts with the start page, then the items, in the language of the page', async () => {
    const nav = (await crumbs()).get('nav')
    const links = nav.findAll('a')
    expect(links.map((link) => [link.text(), link.attributes('href')])).toEqual([['Startseite', '/'], ['Galerien', '/venues/']])
    const english = (await crumbs('/en/about/')).findAll('a').map((link) => link.attributes('href'))
    expect(english).toEqual(['/en/', '/en/venues/'])
  })

  it('marks the last crumb as the current page, without a link', async () => {
    const current = (await crumbs()).get('[aria-current="page"]')
    expect(current.text()).toBe('Parkschlössl')
    expect(current.element.tagName).toBe('SPAN')
  })

  it('hides the separators from screen readers', async () => {
    const separators = (await crumbs()).findAll('[aria-hidden="true"]').filter((node) => node.text() === '/')
    expect(separators).toHaveLength(2)
  })

  it('passes the night surface to its links (the dark exhibition hero)', async () => {
    const link = (await crumbs('/about/', { surface: 'night' })).findComponent({ name: 'ArchiveTextLink' })
    expect(link.props('surface')).toBe('night')
  })
})

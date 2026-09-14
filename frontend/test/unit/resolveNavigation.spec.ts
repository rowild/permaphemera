import { describe, expect, it } from 'vitest'
import { resolveNavigation } from '~/utils/resolveNavigation'

const navigations = [
  { id: 'nav-main', key: 'main', title: 'Main', status: 'published' as const, sort: 1 },
  { id: 'nav-footer', key: 'footer', title: 'Footer', status: 'published' as const, sort: 2 }
]
const item = (nav: string, key: string, o: Partial<{ parent: string | null; kind: 'route' | 'url' | 'action'; path: string | null; url: string | null; sort: number; status: 'draft' | 'published' | 'archived' }> = {}) => ({
  id: `nav-${nav}-${key}`, navigation: `nav-${nav}`, parent: o.parent ?? null, key, title: key.toUpperCase(),
  kind: o.kind ?? 'route', path: o.path ?? null, url: o.url ?? null, target: '_self' as const, sort: o.sort ?? 0, status: o.status ?? 'published' as const,
  translations: [{ languages_code: 'en', title: `EN ${key}` }, { languages_code: 'de', title: `DE ${key}` }]
})
const items = [
  item('main', 'about', { path: '/about/', sort: 2 }),
  item('main', 'exhibitions', { path: '/exhibitions/', sort: 1 }),
  item('footer', 'legal', { sort: 1 }),
  item('footer', 'imprint', { parent: 'nav-footer-legal', path: '/imprint/', sort: 1 }),
  item('footer', 'cookies', { parent: 'nav-footer-legal', kind: 'action', path: 'cookie-settings', sort: 2 }),
  item('footer', 'site', { parent: 'nav-footer-legal', kind: 'url', url: 'https://example.org/', sort: 3 }),
  item('footer', 'hidden', { parent: 'nav-footer-legal', path: '/x/', sort: 4, status: 'archived' })
]

describe('resolveNavigation', () => {
  it('orders main links by sort and localizes labels', () => {
    const nav = resolveNavigation(navigations, items, 'de')
    expect(nav.main.map((l) => l.key)).toEqual(['exhibitions', 'about'])
    expect(nav.main[0]).toMatchObject({ label: 'DE exhibitions', kind: 'route', to: '/exhibitions/', target: '_self' })
  })

  it('builds footer groups with typed links and drops archived items', () => {
    const [legal] = resolveNavigation(navigations, items, 'en').footer
    expect(legal.label).toBe('EN legal')
    expect(legal.links.map((l) => l.key)).toEqual(['imprint', 'cookies', 'site'])
    expect(legal.links[1]).toMatchObject({ kind: 'action', action: 'cookie-settings' })
    expect(legal.links[2]).toMatchObject({ kind: 'url', href: 'https://example.org/' })
  })

  it('throws on a parent from another navigation', () => {
    const cross = [...items, item('main', 'stray', { parent: 'nav-footer-legal', path: '/y/' })]
    expect(() => resolveNavigation(navigations, cross, 'en')).toThrow(/parent nav-footer-legal belongs to another navigation/)
  })

  it('throws on a duplicate key inside one navigation', () => {
    const dupe = [...items, item('main', 'about', { path: '/dupe/' })]
    expect(() => resolveNavigation(navigations, dupe, 'en')).toThrow(/duplicate key about/)
  })

  it('throws on a missing navigation', () => {
    // Only main-navigation items here: a footer item referencing nav-footer
    // would now trip the earlier, more general dangling-FK check below
    // before reaching this itemsOf('footer') lookup.
    const mainOnly = items.filter((row) => row.navigation === 'nav-main')
    expect(() => resolveNavigation([navigations[0]], mainOnly, 'en')).toThrow(/no navigation with key footer/)
  })

  it('throws on an item referencing an unknown navigation', () => {
    const ghost = [...items, { ...item('main', 'ghost', { path: '/ghost/' }), navigation: 'nav-ghost' }]
    expect(() => resolveNavigation(navigations, ghost, 'en')).toThrow(/unknown navigation nav-ghost/)
  })

  it('throws on an item with an unknown kind', () => {
    const bogus = [...items, { ...item('main', 'bogus', { path: '/bogus/' }), kind: 'bogus' as never }]
    expect(() => resolveNavigation(navigations, bogus, 'en')).toThrow(/unknown kind/)
  })

  it('throws on a route item without a path', () => {
    const pathless = [...items, item('main', 'nopath')]
    expect(() => resolveNavigation(navigations, pathless, 'en')).toThrow(/route without a path/)
  })
})

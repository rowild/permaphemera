import type { NavigationItemKind, NavigationItemRecord, NavigationRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'

export interface NavLink {
  key: string
  label: string
  kind: NavigationItemKind
  /** Locale-neutral route path for kind `route`; the composable localizes it. */
  to?: string
  href?: string
  action?: string
  target: '_self' | '_blank'
}

export interface NavGroup {
  key: string
  label: string
  links: NavLink[]
}

export interface ResolvedNavigation {
  main: NavLink[]
  footer: NavGroup[]
}

const FILE = 'pp_navigation_items.json'
const bySort = (a: { sort: number }, b: { sort: number }) => a.sort - b.sort

const toLink = (item: NavigationItemRecord, locale: string): NavLink => {
  const label = (pickTranslation(item, locale).title as string) || item.title
  const base = { key: item.key, label, kind: item.kind, target: item.target }
  if (item.kind === 'route') return { ...base, to: item.path ?? undefined }
  if (item.kind === 'url') return { ...base, href: item.url ?? undefined }
  if (item.kind === 'action') return { ...base, action: item.path ?? undefined }
  throw new Error(`${FILE}: ${item.id} has unknown kind ${String(item.kind)}`)
}

export const resolveNavigation = (
  navigations: NavigationRecord[],
  items: NavigationItemRecord[],
  locale: string
): ResolvedNavigation => {
  const navByKey = new Map(navigations.map((nav) => [nav.key, nav]))
  const navIds = new Set(navigations.map((nav) => nav.id))
  const itemById = new Map(items.map((item) => [item.id, item]))

  for (const item of items) {
    if (!navIds.has(item.navigation)) throw new Error(`${FILE}: ${item.id} references unknown navigation ${item.navigation}`)
  }

  const itemsOf = (key: string): NavigationItemRecord[] => {
    const nav = navByKey.get(key)
    if (!nav) throw new Error(`pp_navigations.json: no navigation with key ${key}`)
    const rows = items.filter((item) => item.navigation === nav.id)
    const seen = new Set<string>()
    for (const row of rows) {
      if (seen.has(row.key)) throw new Error(`${FILE}: duplicate key ${row.key} in navigation ${key}`)
      seen.add(row.key)
      if (row.parent !== null) {
        const parent = itemById.get(row.parent)
        if (!parent) throw new Error(`${FILE}: ${row.id} references unknown parent ${row.parent}`)
        if (parent.navigation !== row.navigation) throw new Error(`${FILE}: ${row.id}: parent ${row.parent} belongs to another navigation`)
      }
    }
    return rows.filter(isVisible)
  }

  const mainItems = itemsOf('main')
  const main = mainItems.filter((item) => item.parent === null).sort(bySort).map((item) => toLink(item, locale))

  const footerItems = itemsOf('footer')
  const footer = footerItems.filter((item) => item.parent === null).sort(bySort).map((group) => ({
    key: group.key,
    label: (pickTranslation(group, locale).title as string) || group.title,
    links: footerItems.filter((item) => item.parent === group.id).sort(bySort).map((item) => toLink(item, locale))
  }))

  return { main, footer }
}

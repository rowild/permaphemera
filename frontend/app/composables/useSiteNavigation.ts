import navigations from '~/data/pp_navigations.json'
import navigationItems from '~/data/pp_navigation_items.json'
import type { NavigationItemRecord, NavigationRecord } from '~/types/content'
import { resolveNavigation, type NavLink, type ResolvedNavigation } from '~/utils/resolveNavigation'

/** Header and footer menus from pp_navigations, with route paths localized. */
export function useSiteNavigation() {
  const { locale } = useI18n()
  const localePath = useLocalePath()

  const localize = (link: NavLink): NavLink => (link.kind === 'route' && link.to ? { ...link, to: localePath(link.to) } : link)

  return computed<ResolvedNavigation>(() => {
    const nav = resolveNavigation(navigations as NavigationRecord[], navigationItems as NavigationItemRecord[], locale.value)
    return {
      main: nav.main.map(localize),
      footer: nav.footer.map((group) => ({ ...group, links: group.links.map(localize) }))
    }
  })
}

import { resolveNavigation, type NavLink, type ResolvedNavigation } from '~/utils/resolveNavigation'

/** Header and footer menus from pp_navigations, with route paths localized. */
export function useSiteNavigation() {
  const { locale } = useI18n()
  const localePath = useLocalePath()
  const archive = useArchiveSnapshot()
  const ready = useArchiveReady()

  const localize = (link: NavLink): NavLink => (link.kind === 'route' && link.to ? { ...link, to: localePath(link.to) } : link)

  return computed<ResolvedNavigation>(() => {
    // The start page renders before the archive arrives; its menus fill in then.
    if (!ready.value) return { main: [], footer: [] }
    const nav = resolveNavigation(archive.value.navigations, archive.value.navigationItems, locale.value)
    return {
      main: nav.main.map(localize),
      footer: nav.footer.map((group) => ({ ...group, links: group.links.map(localize) }))
    }
  })
}

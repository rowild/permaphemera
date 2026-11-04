import type { NavActive } from '~/types/navigation'

/**
 * The menu item of the current page when it depends on data (a person page: artist or not).
 * Without an argument it reads the item; pages that know theirs up front use page meta
 * `navActive` instead. The value belongs to the path that set it, so it never leaks to the next page.
 */
export const useNavActive = (key?: NavActive) => {
  const route = useRoute()
  const state = useState<{ path: string, key: NavActive } | null>('nav-active', () => null)
  if (key) state.value = { path: route.path, key }
  return computed(() => (state.value?.path === route.path ? state.value.key : undefined) ?? (route.meta.navActive as NavActive | undefined))
}

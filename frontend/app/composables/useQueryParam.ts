import type { LocationQuery } from 'vue-router'

// Changes made in the same moment (clearing search and filter together) go into one address
// update; separate updates would read the old address and undo each other.
let pending: Record<string, string> | null = null

/**
 * A search or filter value that lives in the address (`?q=`, `?state=`, `?letter=`), so a shared
 * link or the back button restores it. Reads the address at the start and whenever it changes;
 * writes a change back, trimmed, and removes an empty value. `validate` returns the value the
 * page knows, or '' (an unknown federal state, a letter without artists).
 */
export const useQueryParam = (name: string, { validate = (value: string) => value }: { validate?: (value: string) => string } = {}) => {
  const route = useRoute()
  const router = useRouter()
  const read = (query: LocationQuery) => (typeof query[name] === 'string' ? validate(query[name] as string) : '')
  const value = ref(read(route.query))

  watch(() => route.query[name], () => { value.value = read(route.query) })

  watch(value, (next) => {
    const trimmed = next.trim()
    const current = typeof route.query[name] === 'string' ? route.query[name] : ''
    if (trimmed === current && !pending) return
    const first = !pending
    pending = { ...pending, [name]: trimmed }
    if (!first) return
    void nextTick(() => {
      const changes = pending ?? {}
      pending = null
      const query: LocationQuery = Object.fromEntries(Object.entries({ ...route.query, ...changes }).filter(([, entry]) => entry !== ''))
      void router.replace({ path: route.path, query })
    })
  })

  return value
}

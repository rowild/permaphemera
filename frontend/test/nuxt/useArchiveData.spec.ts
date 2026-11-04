import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, markRaw, nextTick } from 'vue'

let seen: Array<ReturnType<typeof useArchiveData>> = []
const Reader = defineComponent({ setup() { seen.push(useArchiveData()); return () => h('p') } })

// 13 places read the archive; each call used to build and compute every join again
// (plans/2026-11-04__nuxt-optimisation-audit.md 3.1).
describe('useArchiveData', () => {
  it('is one shared instance for every caller', async () => {
    seen = []
    await mountSuspended(Reader)
    await mountSuspended(Reader)
    expect(seen).toHaveLength(2)
    expect(seen[0]!.venues).toBe(seen[1]!.venues)
    expect(seen[0]!.news).toBe(seen[1]!.news)
  })

  it('still follows the archive when it arrives', async () => {
    const data = useArchiveData()
    const state = useState<unknown>('archive')
    const empty = Object.fromEntries(Object.keys(useArchiveSnapshot().value).map((key) => [key, []]))
    state.value = markRaw({ ...empty, sponsors: [{ id: 's1', slug: 'stadt-spittal', status: 'published', title: 'Stadt Spittal' }] })
    await nextTick()
    expect(data.sponsors.value.map((sponsor) => sponsor.slug)).toEqual(['stadt-spittal'])
    clearNuxtState('archive')
  })
})

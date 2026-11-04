import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

const settle = async () => {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 20))
}

let exposed: { q: Ref<string>, state: Ref<string> }
const Probe = defineComponent({
  setup() {
    exposed = {
      q: useQueryParam('q'),
      state: useQueryParam('state', { validate: (value) => (['kaernten', 'tirol'].includes(value) ? value : '') })
    }
    return () => h('p')
  }
})

// A search or filter lives in the address (?q=, ?state=), so a link or the back button restores it.
describe('useQueryParam', () => {
  it('starts from the address and drops a value the page does not know', async () => {
    await mountSuspended(Probe, { route: '/venues/?q=Spittal&state=mars' })
    expect(exposed.q.value).toBe('Spittal')
    expect(exposed.state.value).toBe('')
  })

  it('writes a change into the address, trimmed, and removes an empty value', async () => {
    await mountSuspended(Probe, { route: '/venues/' })
    exposed.q.value = '  Klagenfurt '
    await settle()
    expect(useRoute().query.q).toBe('Klagenfurt')
    exposed.q.value = ''
    await settle()
    expect(useRoute().query.q).toBeUndefined()
  })

  it('keeps both values when two change at once (clearing or setting search and filter together)', async () => {
    await mountSuspended(Probe, { route: '/venues/' })
    exposed.q.value = 'Spittal'
    exposed.state.value = 'kaernten'
    await settle()
    expect(useRoute().query).toMatchObject({ q: 'Spittal', state: 'kaernten' })
    exposed.q.value = ''
    exposed.state.value = ''
    await settle()
    expect(useRoute().query).toEqual({})
  })

  it('follows the address when it changes (back button)', async () => {
    await mountSuspended(Probe, { route: '/venues/' })
    await useRouter().push('/venues/?q=Seeboden&state=tirol')
    await settle()
    expect(exposed.q.value).toBe('Seeboden')
    expect(exposed.state.value).toBe('tirol')
  })
})

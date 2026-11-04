import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'

const records = ref([{ slug: 'parkschloessl', title: 'Parkschlössl' }, { slug: 'europahaus', title: 'Europahaus' }])
const Detail = defineComponent({
  setup() {
    const { record, slug } = useRecordBySlug(records, 'venue.notFound')
    return () => h('p', `${slug}: ${record.value.title}`)
  }
})

// Every detail page finds its record by the address and answers an unknown slug with the
// site's 404 in the visitor's language, during setup (plans/…-audit.md 2.3).
describe('useRecordBySlug', () => {
  it('gives the record of the slug in the address', async () => {
    expect((await mountSuspended(Detail, { route: '/venues/europahaus/' })).text()).toBe('europahaus: Europahaus')
  })

  it('throws the fatal 404 with the page\'s own message for an unknown slug', async () => {
    await useRouter().push('/about/')
    await mountSuspended(Detail, { route: '/venues/gibtsnicht/' })
    expect(useError().value).toMatchObject({ statusCode: 404, statusMessage: 'Galerie nicht gefunden', fatal: true })
    await clearError()
  })
})

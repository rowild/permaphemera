import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveLanguageSwitch from '~/components/ArchiveLanguageSwitch.vue'

// Switching the language goes once to the same page in the other language and remembers the
// choice (the i18n cookie); before, the switch wrote its own cookie and navigated twice
// (plans/2026-11-04__nuxt-optimisation-audit.md 3.6).
describe('ArchiveLanguageSwitch', () => {
  it('goes once to the same page in English and remembers the choice', async () => {
    const router = useRouter()
    await router.push('/about/')
    const switcher = await mountSuspended(ArchiveLanguageSwitch, { route: '/about/' })
    let navigations = 0
    const stop = router.afterEach(() => { navigations++ })
    await switcher.get('button').trigger('click')
    const english = switcher.findAll('[role="menuitemradio"]').find((option) => option.text().includes('English'))!
    await english.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 100))
    stop()
    expect(router.currentRoute.value.path).toBe('/en/about/')
    expect(navigations).toBe(1)
    expect(document.cookie).toContain('permaphemera-locale=en')
    await router.push('/about/')
  })
})

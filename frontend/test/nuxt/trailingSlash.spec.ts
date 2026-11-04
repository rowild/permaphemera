import { mountSuspended } from '@nuxt/test-utils/runtime'
import { NuxtLink } from '#components'
import { describe, expect, it } from 'vitest'

// Canonical addresses end with "/" (shared/seo.mjs); every internal link uses that form.
describe('internal links end with a slash', () => {
  it('localePath adds it in both languages', async () => {
    await useRouter().push('/about/')
    expect(useLocalePath()('/exhibitions/hydrotopia')).toBe('/exhibitions/hydrotopia/')
    expect(useLocalePath()('/exhibitions/hydrotopia', 'en')).toBe('/en/exhibitions/hydrotopia/')
  })

  it('NuxtLink adds it to a path written without one', async () => {
    const link = await mountSuspended(NuxtLink, { props: { to: '/venues/parkschloessl' }, slots: { default: () => 'x' } })
    expect(link.get('a').attributes('href')).toBe('/venues/parkschloessl/')
  })
})

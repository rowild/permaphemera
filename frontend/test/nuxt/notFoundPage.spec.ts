import { describe, expect, it } from 'vitest'

// Unknown addresses match a page of the site that answers with its own 404 in the visitor's
// language; Nuxt's built-in 404 fires while the app starts, before the head can be written.
describe('unknown addresses', () => {
  it.each(['/gibtsnicht/', '/en/gibtsnicht/', '/a/b/c/'])('%s is answered by the site\'s 404 page', (path) => {
    const route = useRouter().resolve(path)
    expect(route.matched.length).toBe(1)
    expect(String(route.name)).toMatch(/^slug/)
  })

  it('does not take over the real pages', () => {
    expect(String(useRouter().resolve('/venues/parkschloessl/').name)).toMatch(/^venues-slug/)
  })
})

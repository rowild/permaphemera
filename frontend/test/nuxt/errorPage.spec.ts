import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import ErrorPage from '~/error.vue'

const nuxtNotFound = () => createError({ statusCode: 404, statusMessage: 'Page not found: /gibtsnicht/' })
const errorPage = (error: ReturnType<typeof createError>, route = '/gibtsnicht/') => mountSuspended(ErrorPage, { props: { error }, route })

describe('error page', () => {
  // The test app starts on /en (its browser language); a real visitor gets the language of the
  // address (checked in the browser), so each test first opens a page of its language.
  beforeEach(async () => { await useRouter().push('/about/') })

  it('names an unknown page in German on the German site, not with the framework text', async () => {
    const page = await errorPage(nuxtNotFound())
    expect(page.get('h1').text()).toBe('Seite nicht gefunden')
    expect(page.text()).not.toContain('Page not found')
  })

  it('keeps the message of the site\'s own errors', async () => {
    const page = await errorPage(createError({ statusCode: 404, statusMessage: 'Galerie nicht gefunden' }), '/venues/x/')
    expect(page.get('h1').text()).toBe('Galerie nicht gefunden')
  })

  it('leads back to the start page of the current language', async () => {
    expect((await errorPage(nuxtNotFound())).get('a').attributes('href')).toBe('/')
    const english = await errorPage(nuxtNotFound(), '/en/gibtsnicht/')
    expect(english.get('a').attributes('href')).toBe('/en/')
    expect(english.get('h1').text()).toBe('Page not found')
  })

  it('tells the browser the language of the page', async () => {
    await errorPage(nuxtNotFound())
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(document.documentElement.lang).toBe('de-AT')
    await errorPage(nuxtNotFound(), '/en/gibtsnicht/')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(document.documentElement.lang).toBe('en-GB')
  })
})

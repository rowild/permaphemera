import { beforeAll, describe, expect, it } from 'vitest'

// The settings the site's behaviour rests on, read from the config object itself (before: regexes
// on the file text in check-i18n-privacy, which broke on formatting).
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the config object is read freely in assertions
let config: Record<string, any>
beforeAll(async () => {
  Object.assign(globalThis, { defineNuxtConfig: (value: unknown) => value })
  config = (await import('../../nuxt.config')).default as typeof config
})

describe('nuxt.config', () => {
  it('is a browser-only app with i18n, German unprefixed and English under /en/', () => {
    expect(config.ssr).toBe(false)
    expect(config.modules).toContain('@nuxtjs/i18n')
    expect(config.i18n).toMatchObject({ defaultLocale: 'de', strategy: 'prefix_except_default', trailingSlash: true })
    expect(config.i18n.locales.map((locale: { code: string }) => locale.code).sort()).toEqual(['de', 'en'])
  })

  it('detects the browser language only at the root and remembers the choice in one cookie', () => {
    expect(config.i18n.detectBrowserLanguage).toMatchObject({ useCookie: true, cookieKey: 'permaphemera-locale', redirectOn: 'root', fallbackLocale: 'de' })
  })

  it('ends every internal link with a slash', () => {
    expect(config.experimental.defaults.nuxtLink.trailingSlash).toBe('append')
  })

  // Umami: self-hosted and cookieless, for every visitor, counting only on the production host
  // (owner, 2026-10-24).
  it('loads Umami from the own instance, counting only on permaphemera.at', () => {
    const umami = config.app.head.script.find((script: { src?: string }) => script.src?.includes('umami'))
    expect(umami).toMatchObject({ src: 'https://umami.project-backends.info/p.js', 'data-website-id': 'd7a5053b-b94e-4fbc-9b6f-78e1b388742c', 'data-domains': 'permaphemera.at' })
  })

  it('reserves text and data mining in the page head', () => {
    const meta = config.app.head.meta as Array<{ name?: string, content?: string }>
    expect(meta).toEqual(expect.arrayContaining([{ name: 'tdm-reservation', content: '1' }, { name: 'robots', content: 'noai, noimageai' }]))
  })
})

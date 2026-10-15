import { describe, expect, it } from 'vitest'
import { resolveOrganisations } from '~/utils/resolveOrganisations'

const organisation = {
  id: 'o1', slug: 'kunstverein-velden', title: 'Kunstverein Velden', short_title: null, kind: 'association', founded: null,
  address: null, location: null, logo: null, logo_alt: null, image: '/img/velden.jpg', image_alt: 'Members', image_caption: 'Members · Foto: Verein',
  lede: null, about_html: null, description: null, status: 'published', sort: 0,
  translations: [
    { languages_code: 'en', image_alt: 'Members', image_caption: 'Members · Foto: Verein' },
    { languages_code: 'de', image_alt: 'Mitglieder', image_caption: 'Mitglieder · Foto: Verein' }
  ]
} as never

const resolve = (locale: string) => resolveOrganisations([organisation], [], [], [], [], [], [], [], [], [], locale)

describe('resolveOrganisations', () => {
  it('passes the localized about text as sanitised HTML, and nothing when it is empty', () => {
    const withAbout = { ...(organisation as object), about_html: '<p>EN</p>', translations: [{ languages_code: 'en', about_html: '<p>EN</p>' }, { languages_code: 'de', about_html: '<p onclick="x">DE</p>' }] } as never
    expect(resolveOrganisations([withAbout], [], [], [], [], [], [], [], [], [], 'de')[0]!.aboutHtml).toBe('<p>DE</p>')
    expect(resolve('en')[0]!.aboutHtml).toBeUndefined()
  })

  it('passes the photo with its localized alt text and credit line', () => {
    expect(resolve('en')[0]).toMatchObject({ image: '/img/velden.jpg', image_alt: 'Members', image_caption: 'Members · Foto: Verein' })
    expect(resolve('de')[0]).toMatchObject({ image_alt: 'Mitglieder', image_caption: 'Mitglieder · Foto: Verein' })
  })
})

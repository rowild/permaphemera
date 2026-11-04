import { describe, expect, it } from 'vitest'
import { SITE_OWNER } from '~/utils/siteOwner'

// The owner's contact data, written into four pages before (plans/…-audit.md 2.9).
describe('SITE_OWNER', () => {
  it('holds name, e-mail and phone with their link forms', () => {
    expect(SITE_OWNER.name).toBe('Robert Wildling')
    expect(SITE_OWNER.emailHref).toBe(`mailto:${SITE_OWNER.email}`)
    expect(SITE_OWNER.phoneHref).toBe('tel:+436766089613')
  })
})

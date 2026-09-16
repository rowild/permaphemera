import { describe, expect, it } from 'vitest'
import { VISIBLE_STATUSES, isVisible } from '~/utils/contentStatus'

describe('VISIBLE_STATUSES', () => {
  it('excludes draft and archived, because the site is live', () => {
    expect(VISIBLE_STATUSES).not.toContain('draft')
    expect(VISIBLE_STATUSES).not.toContain('archived')
  })

  it('includes published', () => {
    expect(VISIBLE_STATUSES).toContain('published')
  })
})

describe('isVisible', () => {
  it('accepts a published record', () => {
    expect(isVisible({ status: 'published' })).toBe(true)
  })

  it('rejects a draft record', () => {
    expect(isVisible({ status: 'draft' })).toBe(false)
  })

  it('rejects an archived record', () => {
    expect(isVisible({ status: 'archived' })).toBe(false)
  })
})

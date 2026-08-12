import { describe, expect, it } from 'vitest'
import { VISIBLE_STATUSES, isVisible } from '~/utils/contentStatus'

describe('VISIBLE_STATUSES', () => {
  it('includes draft, because draft records must still render', () => {
    expect(VISIBLE_STATUSES).toContain('draft')
  })

  it('includes published', () => {
    expect(VISIBLE_STATUSES).toContain('published')
  })
})

describe('isVisible', () => {
  it('accepts a published record', () => {
    expect(isVisible({ status: 'published' })).toBe(true)
  })

  it('accepts a draft record while the project is work in progress', () => {
    expect(isVisible({ status: 'draft' })).toBe(true)
  })
})

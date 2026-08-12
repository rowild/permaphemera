import { describe, expect, it } from 'vitest'
import { VISIBLE_STATUSES } from '~/utils/contentStatus'

describe('VISIBLE_STATUSES', () => {
  it('includes draft, because draft records must still render', () => {
    expect(VISIBLE_STATUSES).toContain('draft')
  })
})

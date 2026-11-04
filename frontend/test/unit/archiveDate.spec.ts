import { describe, expect, it } from 'vitest'
import { formatArchiveDate } from '~/utils/archiveDate'

// One way to write a single day on the site (news dates, "online from" on cards and pages);
// English uses the British day-month order everywhere (before: the cards wrote "Dec 19, 2026").
describe('formatArchiveDate', () => {
  it('writes a long date in German and British English', () => {
    expect(formatArchiveDate('2026-12-19', 'de')).toBe('19. Dezember 2026')
    expect(formatArchiveDate('2026-12-19', 'en')).toBe('19 December 2026')
  })

  it('writes a short month and can keep the date on one line', () => {
    expect(formatArchiveDate('2026-12-19', 'en', { month: 'short' })).toBe('19 Dec 2026')
    expect(formatArchiveDate('2026-12-19', 'de', { month: 'short', noBreak: true })).toBe('19. Dez. 2026')
  })

  it('stays on the day in every time zone (Vienna noon)', () => {
    expect(formatArchiveDate('2026-01-01', 'de')).toBe('1. Jänner 2026')
  })
})

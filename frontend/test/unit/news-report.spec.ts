import { describe, expect, it } from 'vitest'
import { buildReport, mailOf, stateOf } from '../../scripts/lib/news-report.mjs'

const exhibition = (slug: string, extra: Record<string, unknown> = {}) => ({
  id: `id-${slug}`, slug, status: 'published', title: `Title ${slug}`, primary_venue: 'v1', is_permanent: false,
  start_date: '2026-09-01', end_date: '2026-12-31', tour_status: 'unavailable', tour_available_from: null, tour: null, ...extra
})
const archive = (extra: Record<string, unknown[]> = {}) => ({
  venues: [{ id: 'v1', slug: 'galerie-a', status: 'published', title: 'Galerie A' }],
  persons: [{ id: 'p1', slug: 'ina-rainer', status: 'published', first_name: 'Ina', last_name: 'Rainer' }],
  organisations: [], sponsors: [], news: [],
  exhibitions: [
    exhibition('closes-soon', { end_date: '2026-11-20' }),
    exhibition('closes-later', { end_date: '2027-01-31' }),
    exhibition('opens-soon', { start_date: '2026-11-15', end_date: '2027-01-10' }),
    exhibition('tour-soon', { end_date: '2026-11-10', tour_status: 'available', tour_available_from: '2026-11-10' }),
    exhibition('tour-open', { end_date: '2026-10-01', tour_status: 'available', tour_available_from: '2026-10-01', tour: '/media/tours/x/' })
  ],
  ...extra
})
const today = '2026-11-04'

describe('news report', () => {
  it('lists what closes, opens and goes online within three weeks', () => {
    const { text } = buildReport(archive(), undefined, today)
    const section = (title: string) => text.split('\n\n').find((block) => block.startsWith(title)) ?? ''
    expect(section('Exhibitions that close within 3 weeks')).toContain('Title closes-soon')
    expect(section('Exhibitions that close within 3 weeks')).not.toContain('closes-later')
    expect(section('Exhibitions that open within 3 weeks')).toContain('Title opens-soon')
    expect(section('360° tours that go online within 3 weeks')).toContain('Title tour-soon')
    expect(text).toContain('https://permaphemera.at/exhibitions/closes-soon/')
    expect(text).toContain('/admin/content/pp_exhibitions/id-closes-soon')
  })

  it('names nothing as new on the first run and the newcomers later', () => {
    const first = buildReport(archive(), undefined, today).text
    expect(first).toContain('First report')
    expect(first.split('\n\n').find((block) => block.startsWith('360° tours that went online'))).toContain('- nothing')
    expect(first).not.toContain('Galerie A\n')
    const previous = { ...stateOf(archive(), '2026-10-01'), venues: [], persons: [], openTours: [] }
    const { text } = buildReport(archive(), previous, today)
    expect(text).toContain('Galerie A')
    expect(text).toContain('Ina Rainer')
    expect(text.split('\n\n').find((block) => block.startsWith('360° tours that went online'))).toContain('Title tour-open')
  })

  it('says so when nothing happened', () => {
    const quiet = archive({ exhibitions: [exhibition('closes-later', { end_date: '2027-01-31' })] })
    const { text, empty } = buildReport(quiet, stateOf(quiet, '2026-10-01'), today)
    expect(empty).toBe(true)
    expect(text).toContain('Nothing new.')
  })

  it('writes a plain-text mail with an ASCII subject', () => {
    const mail = mailOf({ from: 'webmaster@rowild.at', to: 'robertwildling@gmail.com', today, text: 'Grüße' })
    expect(mail).toContain('Subject: PERMAPHEMERA news report 2026-11-04\r\n')
    expect(mail).toContain('Content-Type: text/plain; charset=utf-8')
    expect(mail.endsWith('\r\nGrüße')).toBe(true)
  })
})

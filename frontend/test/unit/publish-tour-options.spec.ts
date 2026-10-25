import { describe, expect, it } from 'vitest'
import { parseArguments, recordSummary } from '../../scripts/lib/publish-tour-options.mjs'

// The Tour Editor's "Publish to website…" window drives publish-tour.mjs
// without a terminal (2026-10-25): it asks for the candidates as JSON, copies
// before the upload and links only after it. The flags must not combine into
// something half-done.
describe('parseArguments', () => {
  it('reads the id and every mode flag', () => {
    expect(parseArguments(['t-1'])).toMatchObject({ tourId: 't-1', mode: 'publish', showNow: false })
    expect(parseArguments(['t-1', '--candidates-json'])).toMatchObject({ mode: 'candidates' })
    expect(parseArguments(['t-1', '--copy-only'])).toMatchObject({ mode: 'copy' })
    expect(parseArguments(['t-1', '--link-only', '--exhibition', 'show', '--show-now']))
      .toMatchObject({ mode: 'link', exhibition: 'show', showNow: true })
    expect(parseArguments(['t-1', '--from', '/e', '--dry-run'])).toMatchObject({ from: '/e', dryRun: true })
  })

  it('refuses combinations that would do half a job', () => {
    expect(() => parseArguments(['t-1', '--show-now'])).toThrow(/--show-now/)
    expect(() => parseArguments(['t-1', '--copy-only', '--link-only'])).toThrow(/one of/)
    expect(() => parseArguments(['t-1', '--candidates-json', '--copy-only'])).toThrow(/one of/)
    expect(() => parseArguments(['t-1', '--copy-only', '--exhibition', 'x'])).toThrow(/--exhibition/)
    expect(() => parseArguments(['t-1', '--candidates-json', '--dry-run'])).toThrow(/--dry-run/)
    expect(() => parseArguments(['t-1', 't-2'])).toThrow(/one tour id/)
    expect(() => parseArguments(['t-1', '--nope'])).toThrow(/Unknown option/)
    expect(() => parseArguments(['t-1', '--exhibition'])).toThrow(/needs a value/)
  })
})

describe('recordSummary', () => {
  it('keeps what the window needs to decide about the Start button', () => {
    const record = { id: 'u', slug: 's', start_date: '2026-10-15', tour_status: 'available', tour_available_from: null, tour: null, translations: [] }
    expect(recordSummary(record, 'Trigeniale 26')).toEqual({
      slug: 's', title: 'Trigeniale 26', start_date: '2026-10-15', tour_status: 'available', tour_available_from: null,
    })
  })
})

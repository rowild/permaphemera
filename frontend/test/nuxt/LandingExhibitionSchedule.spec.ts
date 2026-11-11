import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeAll, describe, expect, it } from 'vitest'
import LandingExhibitionSchedule from '~/components/LandingExhibitionSchedule.vue'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import type { ResolvedNews } from '~/utils/resolveNews'

const exhibition = (id: string) => ({
  id, slug: id, title: `Title ${id}`, artist: 'Artist', venue: 'Galerie', city: 'Seeboden', date_range: '1.–2. Nov. 2026',
  image: `/media/${id}.jpg`, start_date: '2026-11-01', end_date: '2026-11-02', tour_status: 'unavailable', tour_available_from: null, tour: null
}) as unknown as ResolvedExhibition
const list = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => exhibition(`${prefix}-${index + 1}`))
const news = [{ id: 'n1', slug: 'n1', title: 'Meldung', date: '2026-11-04', date_label: '4. November 2026' }] as unknown as ResolvedNews[]

// One mount for all checks, with just enough cards to test the limits: rendering many cards three
// times slowed the parallel test files enough to make their short timeouts flaky (2026-11-11).
let wrapper: Awaited<ReturnType<typeof mountSuspended>>
beforeAll(async () => {
  wrapper = await mountSuspended(LandingExhibitionSchedule, {
    route: '/exhibitions/',
    props: { tours: list('tour', 5), current: list('current', 6), upcoming: list('upcoming', 1), news }
  })
})

// Owner, 2026-11-11: the section leads with the 360° tours that came online last; current and
// announced exhibitions follow as two small rows; "Aktuelles" keeps its column.
describe('LandingExhibitionSchedule', () => {
  it('shows the four newest tours in the main column, with the link to all exhibitions there', () => {
    const column = wrapper.get('[data-new-tours]')
    expect(column.findAll('.schedule-tour-grid > *')).toHaveLength(4)
    expect(column.find('a[href="/exhibitions/"]').exists()).toBe(true)
  })

  it('lists current and announced exhibitions in two small rows of at most five', () => {
    expect(wrapper.get('[data-schedule-row="current"]').findAll('li')).toHaveLength(5)
    expect(wrapper.get('[data-schedule-row="upcoming"]').findAll('li')).toHaveLength(1)
  })

  it('gives "Aktuelles" the section line', () => {
    const heading = wrapper.findComponent({ name: 'LandingNewsList' }).get('h3')
    expect(heading.classes()).toContain('archive-section-eyebrow')
  })
})

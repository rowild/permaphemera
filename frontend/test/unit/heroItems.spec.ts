import { describe, expect, it } from 'vitest'
import { buildHeroItems, selectOpenedExhibitions } from '~/utils/heroItems'

const today = '2026-10-14'

const exhibition = (id: string, start: string, end: string, tour?: { tour?: string, status?: 'available' | 'restricted' | 'unavailable', from?: string | null }) => ({
  id, slug: id, title: `Title ${id}`, artist: `Artist ${id}`, venue: 'Parkschlössl', venue_slug: 'parkschloessl', city: 'Spittal',
  date_range: `${start}–${end}`, image: `/img/${id}.webp`, start_date: start, end_date: end, is_permanent: false,
  tour: tour?.tour, tour_status: tour?.status ?? 'unavailable', tour_available_from: tour?.from ?? null
})

const venue = (slug: string, archive: string, image = `/img/${slug}.jpg`, hasImage = Boolean(image)) => ({
  id: `id-${slug}`, slug, name: `Venue ${slug}`, city_name: 'Klagenfurt', image, has_image: hasImage, archive_number: archive
})

const href = {
  exhibition: (slug: string) => `/exhibitions/${slug}/`,
  venue: (slug: string) => `/venues/${slug}/`
}

describe('selectOpenedExhibitions', () => {
  it('keeps current and past exhibitions and drops the ones that have not opened yet', () => {
    const list = [exhibition('past', '2026-06-01', '2026-06-12'), exhibition('now', '2026-10-03', '2026-10-30'), exhibition('later', '2026-11-20', '2027-01-31')]
    expect(selectOpenedExhibitions(list, today).map((item) => item.id)).toEqual(['past', 'now'])
  })

  it('counts an exhibition that opens today as current', () => {
    expect(selectOpenedExhibitions([exhibition('today', today, '2026-11-01')], today)).toHaveLength(1)
  })
})

describe('buildHeroItems', () => {
  const open = (id: string, start: string) => exhibition(id, start, start, { tour: `/media/tours/${id}/`, status: 'available', from: '2026-01-01' })

  it('offers only exhibitions whose 360° tour is open, newest first', () => {
    const items = buildHeroItems([
      open('older', '2026-06-01'),
      open('newer', '2026-08-10'),
      exhibition('no-tour', '2026-09-01', '2026-09-30'),
      exhibition('scheduled', '2026-10-03', '2026-10-30', { status: 'available', from: '2026-10-31' }),
      exhibition('restricted', '2026-07-01', '2026-07-30', { tour: '/media/tours/r/', status: 'restricted' })
    ], [], today, href)
    expect(items.map((item) => item.id)).toEqual(['newer', 'older'])
    expect(items.every((item) => item.kind === 'exhibition')).toBe(true)
    expect(items[0]!.href).toBe('/exhibitions/newer/')
    expect(items[0]!.tourUrl).toBe('/media/tours/newer/')
  })

  it('fills up to twelve blades with galleries in archive order, venues without a tour first', () => {
    const venues = [venue('parkschloessl', '01'), venue('b', '28'), venue('a', '27'), venue('no-image', '29', '')]
    const items = buildHeroItems([open('t1', '2026-06-01')], venues, today, href)
    expect(items.map((item) => item.id)).toEqual(['t1', 'venue-id-a', 'venue-id-b', 'venue-id-parkschloessl'])
    const gallery = items[1]!
    expect(gallery).toMatchObject({ kind: 'venue', href: '/venues/a/', title: 'Venue a', location: 'Klagenfurt', artist: '', dateRange: '' })
    expect(gallery.tourUrl).toBeUndefined()
  })

  it('never fills a blade with a gallery whose image is a placeholder', () => {
    const venues = [venue('a', '27'), venue('placeholder', '26', '/assets/placeholder', false)]
    const items = buildHeroItems([open('t1', '2026-06-01')], venues, today, href)
    expect(items.map((item) => item.id)).toEqual(['t1', 'venue-id-a'])
  })

  it('needs no galleries once there are twelve open tours', () => {
    const tours = Array.from({ length: 12 }, (_, index) => open(`t${index}`, `2026-0${(index % 9) + 1}-01`))
    const items = buildHeroItems(tours, [venue('a', '27')], today, href)
    expect(items).toHaveLength(12)
    expect(items.some((item) => item.kind === 'venue')).toBe(false)
  })
})

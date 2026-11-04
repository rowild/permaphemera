import { afterEach, describe, expect, it, vi } from 'vitest'

// "Today" decides current, upcoming and past; every card started its own midnight timer
// (plans/2026-11-04__nuxt-optimisation-audit.md 3.5). One date and one timer for the app.
describe('useArchiveToday', () => {
  afterEach(() => vi.useRealTimers())

  it('is one shared date for every caller', () => {
    const [first, second] = [useArchiveToday(), useArchiveToday()]
    useState<string>('archive-today').value = '2030-01-01'
    expect([first.value, second.value]).toEqual(['2030-01-01', '2030-01-01'])
    clearNuxtState('archive-today')
  })

  it('moves to the next day just after midnight', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] })
    vi.setSystemTime(new Date(2026, 10, 4, 23, 59, 0))
    clearNuxtState('archive-today')
    const today = useArchiveToday()
    expect(today.value).toBe('2026-11-04')
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000)
    expect(today.value).toBe('2026-11-05')
  })
})

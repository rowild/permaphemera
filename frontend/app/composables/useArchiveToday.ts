import { localDateKey } from '~/utils/exhibitionSchedule'

/**
 * Today's date (YYYY-MM-DD, local), shared by the whole app: it decides current, upcoming and past,
 * and moves on just after midnight. One date and one timer, started with the state (every card
 * used to start its own; plans/2026-11-04__nuxt-optimisation-audit.md 3.5).
 */
export function useArchiveToday() {
  const nuxtApp = useNuxtApp()
  const scheduleNextDay = () => {
    const now = new Date()
    const nextDay = new Date(now)
    nextDay.setHours(24, 0, 0, 50)
    setTimeout(() => {
      nuxtApp.runWithContext(() => { useState<string>('archive-today').value = localDateKey() })
      scheduleNextDay()
    }, nextDay.getTime() - now.getTime())
  }
  const today = useState<string>('archive-today', () => {
    if (import.meta.client) scheduleNextDay()
    return localDateKey()
  })
  return readonly(today)
}

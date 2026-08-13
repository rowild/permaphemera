import { localDateKey } from '~/utils/exhibitionSchedule'

export function useArchiveToday() {
  const today = ref(localDateKey())
  let midnightTimer: ReturnType<typeof setTimeout> | undefined

  const scheduleNextDay = () => {
    const now = new Date()
    const nextDay = new Date(now)
    nextDay.setHours(24, 0, 0, 50)

    midnightTimer = setTimeout(() => {
      today.value = localDateKey()
      scheduleNextDay()
    }, nextDay.getTime() - now.getTime())
  }

  onMounted(scheduleNextDay)
  onBeforeUnmount(() => clearTimeout(midnightTimer))

  return readonly(today)
}

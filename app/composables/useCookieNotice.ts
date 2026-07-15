const COOKIE_NOTICE_STORAGE_KEY = 'permaphemera-cookie-notice-dismissed'

export function useCookieNotice() {
  const isVisible = useState('cookie-notice-visible', () => false)

  const initialize = () => {
    if (!import.meta.client) return
    isVisible.value = window.localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) !== 'true'
  }

  const dismiss = () => {
    isVisible.value = false
    if (import.meta.client) window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, 'true')
  }

  const show = () => {
    isVisible.value = true
  }

  return {
    isVisible: readonly(isVisible),
    initialize,
    dismiss,
    show
  }
}

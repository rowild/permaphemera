type MatomoCommand = [string, ...unknown[]]

declare global {
  interface Window {
    _paq?: MatomoCommand[]
  }
}

const MATOMO_URL = 'https://matomo.rowild.at/'
const MATOMO_SITE_ID = '9'
const MATOMO_SCRIPT_ID = 'permaphemera-matomo'

export function useMatomo() {
  const configured = useState('matomo-configured', () => false)
  const trackingEnabled = useState('matomo-tracking-enabled', () => false)

  const queue = (...command: MatomoCommand) => {
    if (!import.meta.client) return
    const paq = window._paq = window._paq || []
    paq.push(command)
  }

  const trackPageView = () => {
    if (!import.meta.client || !trackingEnabled.value) return
    queue('setCustomUrl', window.location.href)
    queue('setDocumentTitle', document.title)
    queue('trackPageView')
  }

  const enable = () => {
    if (!import.meta.client || trackingEnabled.value) return

    trackingEnabled.value = true

    if (configured.value) {
      queue('setConsentGiven')
      trackPageView()
      return
    }

    configured.value = true
    queue('requireConsent')
    queue('setConsentGiven')
    queue('trackPageView')
    queue('enableLinkTracking')
    queue('setTrackerUrl', `${MATOMO_URL}matomo.php`)
    queue('setSiteId', MATOMO_SITE_ID)

    if (document.getElementById(MATOMO_SCRIPT_ID)) return

    const script = document.createElement('script')
    script.id = MATOMO_SCRIPT_ID
    script.async = true
    script.src = `${MATOMO_URL}matomo.js`
    script.addEventListener('error', () => {
      configured.value = false
      trackingEnabled.value = false
    }, { once: true })
    document.head.appendChild(script)
  }

  const disable = () => {
    trackingEnabled.value = false
    if (!import.meta.client || !configured.value) return
    queue('forgetConsentGiven')
    queue('deleteCookies')
  }

  return {
    enable,
    disable,
    trackPageView
  }
}

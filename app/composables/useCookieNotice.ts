type ConsentDecision = 'granted' | 'denied' | null

export interface ConsentSelection {
  analytics: boolean
  googleMaps: boolean
  youtube: boolean
}

interface StoredConsent {
  analytics: Exclude<ConsentDecision, null>
  googleMaps: Exclude<ConsentDecision, null>
  youtube: Exclude<ConsentDecision, null>
  savedAt: number
  version: 2
}

const COOKIE_CONSENT_STORAGE_KEY = 'permaphemera-cookie-consent'
const LEGACY_NOTICE_STORAGE_KEY = 'permaphemera-cookie-notice-dismissed'
const CONSENT_MAX_AGE = 1000 * 60 * 60 * 24 * 365

const toDecision = (selected: boolean): Exclude<ConsentDecision, null> => selected ? 'granted' : 'denied'
const isDecision = (value: unknown): value is Exclude<ConsentDecision, null> => value === 'granted' || value === 'denied'

export function useCookieNotice() {
  const isVisible = useState('cookie-notice-visible', () => false)
  const analyticsConsent = useState<ConsentDecision>('analytics-consent', () => null)
  const googleMapsConsent = useState<ConsentDecision>('google-maps-consent', () => null)
  const youtubeConsent = useState<ConsentDecision>('youtube-consent', () => null)
  const initialized = useState('cookie-consent-initialized', () => false)
  const { enable: enableMatomo, disable: disableMatomo } = useMatomo()

  const remember = (selection: ConsentSelection) => {
    if (!import.meta.client) return

    const preference: StoredConsent = {
      analytics: toDecision(selection.analytics),
      googleMaps: toDecision(selection.googleMaps),
      youtube: toDecision(selection.youtube),
      savedAt: Date.now(),
      version: 2
    }

    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(preference))
    window.localStorage.removeItem(LEGACY_NOTICE_STORAGE_KEY)
  }

  const applySelection = (selection: ConsentSelection) => {
    analyticsConsent.value = toDecision(selection.analytics)
    googleMapsConsent.value = toDecision(selection.googleMaps)
    youtubeConsent.value = toDecision(selection.youtube)

    if (selection.analytics) enableMatomo()
    else disableMatomo()
  }

  const initialize = () => {
    if (!import.meta.client || initialized.value) return
    initialized.value = true

    try {
      const rawPreference = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
      const preference = rawPreference ? JSON.parse(rawPreference) as Partial<StoredConsent> : null
      const isCurrent = preference?.version === 2
        && isDecision(preference.analytics)
        && isDecision(preference.googleMaps)
        && isDecision(preference.youtube)
        && typeof preference.savedAt === 'number'
        && Date.now() - preference.savedAt < CONSENT_MAX_AGE

      if (isCurrent) {
        applySelection({
          analytics: preference.analytics === 'granted',
          googleMaps: preference.googleMaps === 'granted',
          youtube: preference.youtube === 'granted'
        })
        isVisible.value = false
        return
      }
    } catch {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY)
    }

    analyticsConsent.value = null
    googleMapsConsent.value = null
    youtubeConsent.value = null
    disableMatomo()
    isVisible.value = true
  }

  const savePreferences = (selection: ConsentSelection) => {
    applySelection(selection)
    remember(selection)
    isVisible.value = false
  }

  const acceptAll = () => {
    savePreferences({ analytics: true, googleMaps: true, youtube: true })
  }

  const show = () => {
    isVisible.value = true
  }

  return {
    isVisible: readonly(isVisible),
    analyticsConsent: readonly(analyticsConsent),
    googleMapsConsent: readonly(googleMapsConsent),
    youtubeConsent: readonly(youtubeConsent),
    initialize,
    savePreferences,
    acceptAll,
    show
  }
}

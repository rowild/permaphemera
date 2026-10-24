type ConsentDecision = 'granted' | 'denied' | null

export interface ConsentSelection {
  googleMaps: boolean
  youtube: boolean
}

// Version 2 records written before 2026-10-24 also carry an `analytics` decision for the
// former analytics switch; it is ignored. Umami needs no switch (it sets no cookies).
interface StoredConsent {
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
  const googleMapsConsent = useState<ConsentDecision>('google-maps-consent', () => null)
  const youtubeConsent = useState<ConsentDecision>('youtube-consent', () => null)
  const initialized = useState('cookie-consent-initialized', () => false)

  const remember = (selection: ConsentSelection) => {
    if (!import.meta.client) return

    const preference: StoredConsent = {
      googleMaps: toDecision(selection.googleMaps),
      youtube: toDecision(selection.youtube),
      savedAt: Date.now(),
      version: 2
    }

    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(preference))
    window.localStorage.removeItem(LEGACY_NOTICE_STORAGE_KEY)
  }

  const applySelection = (selection: ConsentSelection) => {
    googleMapsConsent.value = toDecision(selection.googleMaps)
    youtubeConsent.value = toDecision(selection.youtube)
  }

  const initialize = () => {
    if (!import.meta.client || initialized.value) return
    initialized.value = true

    try {
      const rawPreference = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
      const preference = rawPreference ? JSON.parse(rawPreference) as Partial<StoredConsent> : null
      const isCurrent = preference?.version === 2
        && isDecision(preference.googleMaps)
        && isDecision(preference.youtube)
        && typeof preference.savedAt === 'number'
        && Date.now() - preference.savedAt < CONSENT_MAX_AGE

      if (isCurrent) {
        applySelection({
          googleMaps: preference.googleMaps === 'granted',
          youtube: preference.youtube === 'granted'
        })
        isVisible.value = false
        return
      }
    } catch {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY)
    }

    googleMapsConsent.value = null
    youtubeConsent.value = null
    isVisible.value = true
  }

  const savePreferences = (selection: ConsentSelection) => {
    applySelection(selection)
    remember(selection)
    isVisible.value = false
  }

  const acceptAll = () => {
    savePreferences({ googleMaps: true, youtube: true })
  }

  const show = () => {
    isVisible.value = true
  }

  return {
    isVisible: readonly(isVisible),
    googleMapsConsent: readonly(googleMapsConsent),
    youtubeConsent: readonly(youtubeConsent),
    initialize,
    savePreferences,
    acceptAll,
    show
  }
}

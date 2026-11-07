import { NEWSLETTER_INVITE_STORAGE_KEY, parseInviteRecord } from '~/utils/newsletter'
import type { InviteRecord } from '~/utils/newsletter'

/**
 * The small newsletter invite: whether it shows, and what the browser remembers about it
 * (`permaphemera-newsletter-invite` in localStorage: "dismissed" or "subscribed", with a date).
 * The rule itself is `inviteAllowed` in `utils/newsletter.ts`; the timer lives in
 * `ArchiveNewsletterInvite`. The start page holds the invite back until its intro is over.
 */
export function useNewsletterInvite() {
  const visible = useState('newsletter-invite-visible', () => false)
  const heldForIntro = useState('newsletter-invite-held', () => false)

  const read = (): InviteRecord | null => {
    if (!import.meta.client) return null
    try {
      return parseInviteRecord(window.localStorage.getItem(NEWSLETTER_INVITE_STORAGE_KEY))
    } catch {
      return null
    }
  }

  const write = (state: InviteRecord['state']) => {
    if (!import.meta.client) return
    try {
      const record: InviteRecord = { state, savedAt: Date.now(), version: 1 }
      window.localStorage.setItem(NEWSLETTER_INVITE_STORAGE_KEY, JSON.stringify(record))
    } catch {
      // Storage blocked: the invite may come again next time. Nothing else depends on it.
    }
  }

  return {
    visible: readonly(visible),
    heldForIntro: readonly(heldForIntro),
    read,
    show: () => { visible.value = true },
    /** Out of the way without counting as a "no" (the visitor went to /newsletter/). */
    hide: () => { visible.value = false },
    /** "Not now": hide, and keep quiet for 30 days. */
    dismiss: () => {
      if (read()?.state !== 'subscribed') write('dismissed')
      visible.value = false
    },
    /** A sign-up was sent (from any form): never invite again. */
    markSubscribed: () => write('subscribed'),
    holdForIntro: () => { heldForIntro.value = true },
    releaseIntro: () => { heldForIntro.value = false }
  }
}

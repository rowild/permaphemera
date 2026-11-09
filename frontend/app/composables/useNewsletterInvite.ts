import { NEWSLETTER_INVITE_STORAGE_KEY, inviteClosedForGood, parseInviteRecord } from '~/utils/newsletter'
import type { InviteRecord } from '~/utils/newsletter'

/**
 * The newsletter modal: whether it shows, and what the browser remembers about it
 * (`permaphemera-newsletter-invite` in localStorage: "shown", "dismissed", "subscribed" or
 * "never", with a date).
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
    /** Show it, and count the 30 days from now. */
    show: () => {
      if (!inviteClosedForGood(read())) write('shown')
      visible.value = true
    },
    /** Out of the way without counting as a "no" (the visitor went to /newsletter/). */
    hide: () => { visible.value = false },
    /** "Not now" (×, Escape, a click beside it): hide, and keep quiet for 30 days. */
    dismiss: () => {
      if (!inviteClosedForGood(read())) write('dismissed')
      visible.value = false
    },
    /** "Never show again": hide, and never invite again (like a sign-up). */
    neverAgain: () => {
      if (!inviteClosedForGood(read())) write('never')
      visible.value = false
    },
    /** A sign-up was sent (from any form): never invite again. */
    markSubscribed: () => write('subscribed'),
    holdForIntro: () => { heldForIntro.value = true },
    releaseIntro: () => { heldForIntro.value = false }
  }
}

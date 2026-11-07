import { newsletterEndpoint } from '~/utils/newsletter'
import type { buildSubscribeBody } from '~/utils/newsletter'

export type NewsletterStatus = 'idle' | 'sending' | 'pending' | 'error'

// Codes the endpoint sends that the form explains; every other failure is "failed".
const KNOWN_ERRORS = ['invalid_email', 'missing_consent', 'missing_topic', 'rate_limited', 'unavailable'] as const
export type NewsletterError = typeof KNOWN_ERRORS[number] | 'failed'

/**
 * Sends one sign-up to the Directus endpoint (`directus/extensions/permaphemera-newsletter`).
 * `pending` means: Brevo sends the confirmation mail. The endpoint answers the same for a
 * known address, so the form never tells whether someone is subscribed.
 */
export function useNewsletterSubscription() {
  const { directusUrl } = useRuntimeConfig().public
  const status = ref<NewsletterStatus>('idle')
  const error = ref<NewsletterError | null>(null)

  const submit = async (body: ReturnType<typeof buildSubscribeBody>) => {
    if (status.value === 'sending') return
    status.value = 'sending'
    error.value = null
    try {
      const response = await fetch(newsletterEndpoint(String(directusUrl)), {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(body)
      })
      const answer = response.ok ? await response.json() as { ok?: boolean, error?: string } : null
      if (answer?.ok === true) {
        status.value = 'pending'
        return
      }
      const code = answer?.error
      error.value = KNOWN_ERRORS.includes(code as typeof KNOWN_ERRORS[number]) ? code as NewsletterError : 'failed'
    } catch {
      error.value = 'failed'
    }
    status.value = 'error'
  }

  return { status: readonly(status), error: readonly(error), submit }
}

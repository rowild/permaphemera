import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import NewsletterStatusPage from '~/components/NewsletterStatusPage.vue'

// Where Brevo's confirmation link leads. Unsubscribing stays on Brevo's own page.
describe('NewsletterStatusPage', () => {
  it('confirmed: says so and leads on to the exhibitions and the start page', async () => {
    const wrapper = await mountSuspended(NewsletterStatusPage)
    expect(wrapper.get('h1').text()).toBe('Anmeldung bestätigt')
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual(expect.arrayContaining(['/newsletter/', '/exhibitions/', '/']))
  })
})

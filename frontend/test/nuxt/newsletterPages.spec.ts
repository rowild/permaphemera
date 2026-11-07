import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import NewsletterStatusPage from '~/components/NewsletterStatusPage.vue'

// Where Brevo's links lead: after the confirmation click and after unsubscribing.
describe('NewsletterStatusPage', () => {
  it('confirmed: says so and leads on to the exhibitions and the start page', async () => {
    const wrapper = await mountSuspended(NewsletterStatusPage, { props: { page: 'confirmed' } })
    expect(wrapper.get('h1').text()).toBe('Anmeldung bestätigt')
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual(expect.arrayContaining(['/newsletter/', '/exhibitions/', '/']))
  })

  it('unsubscribed: says so and offers a new sign-up', async () => {
    const wrapper = await mountSuspended(NewsletterStatusPage, { props: { page: 'unsubscribed' } })
    expect(wrapper.get('h1').text()).toBe('Abgemeldet')
    const again = wrapper.findAll('a').find((link) => link.text().includes('Neu anmelden'))
    expect(again?.attributes('href')).toBe('/newsletter/')
  })
})

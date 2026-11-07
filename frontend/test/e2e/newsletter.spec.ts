import { expect, test, width } from './fixtures'

// The newsletter sign-up in a real browser (plans/2026-11-07__newsletter.md). The endpoint is
// answered here, so no test ever reaches Brevo.
const answerEndpoint = async (page: import('@playwright/test').Page, answer: object) => {
  const sent: unknown[] = []
  await page.route('**/newsletter/subscribe', async (route) => {
    sent.push(route.request().postDataJSON())
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer) })
  })
  return sent
}

test('the sign-up page sends the form and says that a confirmation mail is on its way', async ({ page }) => {
  const sent = await answerEndpoint(page, { ok: true, state: 'pending' })
  await page.goto('/newsletter/')
  await expect(page.locator('h1')).toHaveText('Newsletter')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width(page))

  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill('maria@example.at')
  await page.locator('details.archive-town-select summary').click()
  await page.locator('details.archive-town-select input[value="villach"]').check()
  await page.locator('[data-part="consent"] input').check()
  await page.waitForTimeout(2100) // a form sent within 2 s counts as a bot on the server
  await page.getByRole('button', { name: 'Anmelden' }).click()

  await expect(page.locator('.newsletter-form').getByRole('status')).toContainText('maria@example.at')
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({ email: 'maria@example.at', towns: ['villach'], consent: true, source: 'page', website: '' })
})

test('a refusal shows its reason and keeps the form', async ({ page }) => {
  await answerEndpoint(page, { ok: false, error: 'invalid_email' })
  await page.goto('/en/newsletter/')
  await page.getByLabel('E-mail address', { exact: true }).fill('maria@example.at')
  await page.locator('[data-part="consent"] input').check()
  await page.getByRole('button', { name: 'Sign up' }).click()
  await expect(page.getByRole('alert')).toHaveText('Please check the e-mail address.')
  await expect(page.getByLabel('E-mail address', { exact: true })).toBeVisible()
})

test('the invite comes after 10 s, small on phones, and closing it keeps it away', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('permaphemera-newsletter-invite'))
  await page.goto('/exhibitions/')
  await expect(page.locator('h1').first()).toBeVisible()
  const invite = page.locator('aside.newsletter-invite')
  await expect(invite).toBeVisible({ timeout: 15_000 })

  const box = (await invite.boundingBox())!
  if (width(page) < 768) {
    // On phones only a button to the page: no form over half the screen.
    await expect(invite.locator('[data-part="to-page"]')).toBeVisible()
    await expect(invite.locator('input[type="email"]')).toBeHidden()
    expect(box.height).toBeLessThan(844 * 0.4)
  } else {
    await expect(invite.locator('input[type="email"]')).toBeVisible()
  }
  expect(box.x + box.width).toBeLessThanOrEqual(width(page))

  await invite.locator('button[data-part="close"]').click()
  await expect(invite).toBeHidden()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('permaphemera-newsletter-invite') ?? 'null'))
  expect(stored).toMatchObject({ state: 'dismissed' })
})

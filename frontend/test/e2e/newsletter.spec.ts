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

test('the invite comes after 10 s as a centred modal without a form, and closing it keeps it away', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('permaphemera-newsletter-invite'))
  await page.goto('/exhibitions/')
  await expect(page.locator('h1').first()).toBeVisible()
  const invite = page.locator('.newsletter-invite[role="dialog"]')
  await expect(invite).toBeVisible({ timeout: 15_000 })

  // No form on any screen size: only the link to the sign-up page.
  await expect(invite.locator('form, input')).toHaveCount(0)
  await expect(invite.locator('[data-part="to-page"]')).toBeVisible()
  await expect(invite.locator('[data-part="never"]')).toBeVisible()

  // Inside the screen and in its centre.
  const box = (await invite.boundingBox())!
  const viewport = page.viewportSize()!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(4)

  // The × sits exactly in the middle of its button (owner's rule: symbols in buttons are centred).
  const button = (await invite.locator('button[data-part="close"]').boundingBox())!
  const icon = (await invite.locator('[data-part="close-icon"]').boundingBox())!
  expect(Math.abs(icon.x + icon.width / 2 - (button.x + button.width / 2))).toBeLessThan(0.5)
  expect(Math.abs(icon.y + icon.height / 2 - (button.y + button.height / 2))).toBeLessThan(0.5)

  await invite.locator('button[data-part="close"]').click()
  await expect(invite).toBeHidden()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('permaphemera-newsletter-invite') ?? 'null'))
  expect(stored).toMatchObject({ state: 'dismissed' })
})

test('"never show again" stores "never"', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('permaphemera-newsletter-invite'))
  await page.goto('/exhibitions/')
  const invite = page.locator('.newsletter-invite[role="dialog"]')
  await expect(invite).toBeVisible({ timeout: 15_000 })
  await invite.locator('[data-part="never"]').click()
  await expect(invite).toBeHidden()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('permaphemera-newsletter-invite') ?? 'null'))
  expect(stored).toMatchObject({ state: 'never' })
})

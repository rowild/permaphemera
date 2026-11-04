import { expect, test } from './fixtures'

test('an unknown address shows the site\'s own 404 in the language of the address', async ({ page }) => {
  await page.goto('/gibtsnicht/')
  await expect(page.locator('h1')).toHaveText('Seite nicht gefunden')
  await expect(page.locator('html')).toHaveAttribute('lang', 'de-AT')
  await page.goto('/en/gibtsnicht/')
  await expect(page.locator('h1')).toHaveText('Page not found')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
  await expect(page.locator('.error-page a')).toHaveAttribute('href', '/en/')
})

test('an old /locations/ link arrives at the gallery', async ({ page }) => {
  await page.goto('/locations/parkschloessl-spittal-drau/')
  await expect(page).toHaveURL(/\/venues\/parkschloessl-spittal-drau\/$/)
  await expect(page.locator('h1')).toContainText('Parkschlössl')
})

test('every internal link ends with a slash', async ({ page }) => {
  await page.goto('/venues/parkschloessl-spittal-drau/')
  const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')!))
  expect(hrefs.filter((href) => !href.split(/[?#]/)[0]!.endsWith('/'))).toEqual([])
})

test('breadcrumbs start at the start page and mark the current page', async ({ page }) => {
  await page.goto('/persons/ondina-altran/')
  const crumbs = page.locator('nav.breadcrumb')
  await expect(crumbs.locator('a').first()).toHaveAttribute('href', '/')
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Ondina Altran')
})

test('the language switch goes once to the same page in English and remembers it', async ({ page, context }) => {
  await page.goto('/venues/parkschloessl-spittal-drau/')
  const before = await page.evaluate(() => history.length)
  await page.locator('[data-header-language] button').first().click()
  await page.getByRole('menuitemradio', { name: /English/ }).click()
  await expect(page).toHaveURL(/\/en\/venues\/parkschloessl-spittal-drau\/$/)
  expect(await page.evaluate(() => history.length) - before).toBe(1)
  expect((await context.cookies()).find((cookie) => cookie.name === 'permaphemera-locale')?.value).toBe('en')
})

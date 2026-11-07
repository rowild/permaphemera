import { expect, test, width } from './fixtures'

const PAGES = ['/', '/exhibitions/', '/venues/', '/organisations/', '/artists/', '/news/', '/about/', '/exhibitions/blinddate-der-perspektiven/', '/venues/parkschloessl-spittal-drau/', '/persons/ondina-altran/', '/imprint/', '/en/contact/', '/newsletter/', '/en/newsletter/confirmed/']

test.describe('page frame', () => {
  for (const path of PAGES) {
    test(`${path} loads without errors, header and footer beside <main>`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
      await page.goto(path)
      await expect(page.locator('h1').first()).toBeVisible()
      expect(await page.locator('main header.site-header, main footer.site-footer').count()).toBe(0)
      await expect(page.locator('header.site-header')).toHaveCount(1)
      expect(errors).toEqual([])
    })
  }
})

// Owner, 2026-11-04: the header stays at the top and shrinks to a slim bar while scrolled.
test('the header stays at the top, shrinks while scrolled and grows back', async ({ page }) => {
  await page.goto('/venues/')
  const header = page.locator('header.site-header')
  await expect(page.locator('h1').first()).toBeVisible()
  const full = (await header.boundingBox())!.height
  await page.mouse.wheel(0, 1500)
  await expect(header).toHaveAttribute('data-compact')
  await expect.poll(async () => (await header.boundingBox())!.y).toBe(0)
  // The shrink is a 300 ms transition: 102 → 64 px on desktop, 96 → 56 on tablet, 64 → 48 on phones.
  await expect.poll(async () => (await header.boundingBox())!.height).toBeLessThan(full - 10)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(header).not.toHaveAttribute('data-compact')
})

test('the header menu opens below the header without making it taller', async ({ page }) => {
  await page.goto('/about/')
  const header = page.locator('header.site-header')
  const before = (await header.boundingBox())!.height
  await page.locator('button.mobile-menu').click()
  const menu = page.locator('#mobile-primary-navigation')
  await expect(menu).toBeVisible()
  expect((await header.boundingBox())!.height).toBe(before)
  // It overlaps the header's divider line a little, by design; it never starts inside the header.
  expect((await menu.boundingBox())!.y).toBeGreaterThanOrEqual((await header.boundingBox())!.y + before - 16)
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
})

test('the footer drawer (tablet, phone) opens, keeps focus inside and closes with Escape', async ({ page }) => {
  test.skip(width(page) > 1280, 'desktop shows the footer menu without a drawer')
  await page.goto('/about/')
  const trigger = page.locator('footer button.mobile-footer-menu-trigger')
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
  for (let i = 0; i < 30; i++) await page.keyboard.press('Tab')
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"], footer')))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toBeFocused()
})

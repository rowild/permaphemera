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

// Owner, 2026-11-11: the logo's geometry. In archive-temple.svg (64 units) the lowest step ends at
// 58.9, the underside of the roof's base line is at 23.9 and the top of the roof peak at 6.8.
// 1. The lowest step and the word share one baseline.
// 2. The P is as tall as the house from the lowest step to the underside of the roof's base line
//    (Cormorant Garamond: P = 0.628 em), so the word's size is 35 / 64 / 0.628 of the mark.
// 3. The header eyebrow stands on the roof peak and starts where the word starts.
// A zero-height inline-block sits on its line's baseline: the probe that measures it.
type LogoGeometry = { mark: number, stepGap: number, sizeRatio: number, eyebrowGap?: number, eyebrowX?: number }
const logoGeometry = (lockup: string, mark: string, word: string, eyebrow?: string) => ({ lockup, mark, word, eyebrow })
const measureLogo = async (page: import('@playwright/test').Page, selectors: ReturnType<typeof logoGeometry>) => page.evaluate((s) => {
  const baselineOf = (element: Element) => {
    const probe = document.createElement('span')
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
    element.appendChild(probe)
    const y = probe.getBoundingClientRect().bottom
    probe.remove()
    return y
  }
  const root = [...document.querySelectorAll(s.lockup)].find((element) => element.getClientRects().length)!
  const markBox = root.querySelector(s.mark)!.getBoundingClientRect()
  const word = root.querySelector(s.word)!
  const size = Number.parseFloat(getComputedStyle(word).fontSize)
  const result: LogoGeometry = {
    mark: markBox.width,
    stepGap: markBox.bottom - markBox.height * (64 - 58.9) / 64 - baselineOf(word.querySelector('[aria-hidden="true"]') ?? word),
    sizeRatio: size / markBox.width
  }
  if (s.eyebrow) {
    const eyebrow = root.querySelector(s.eyebrow)!
    result.eyebrowGap = baselineOf(eyebrow) - (markBox.top + markBox.height * 6.8 / 64)
    const firstLetter = word.querySelector('[data-letter]')!.getBoundingClientRect().left
    const range = document.createRange()
    range.setStart(eyebrow.firstChild!, eyebrow.textContent!.search(/\S/))
    range.setEnd(eyebrow.firstChild!, eyebrow.textContent!.search(/\S/) + 1)
    result.eyebrowX = range.getBoundingClientRect().left - firstLetter
  }
  return result
}, selectors)
const WORD_RATIO = (58.9 - 23.9) / 64 / 0.628

test.describe('logo geometry', () => {
  const header = logoGeometry('header.site-header', '[data-header-brand-mark]', '[data-header-brand]', '[data-header-tagline]')

  test('the header logo: one baseline, the P as tall as the house, the eyebrow on the roof peak', async ({ page }) => {
    await page.goto('/venues/')
    // A worker's first page waits for its paced Directus requests (fixtures.ts).
    await expect(page.locator('[data-header-brand]')).toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(400)
    const logo = await measureLogo(page, header)
    // The mark's size per width, as before the change: 32 px, 24 px up to 700 px, 20 px up to 420 px.
    expect(logo.mark).toBeCloseTo(width(page) <= 420 ? 20 : width(page) <= 700 ? 24 : 32, 1)
    expect(Math.abs(logo.stepGap)).toBeLessThan(0.5)
    expect(logo.sizeRatio).toBeCloseTo(WORD_RATIO, 3)
    expect(Math.abs(logo.eyebrowGap!)).toBeLessThan(0.5)
    expect(Math.abs(logo.eyebrowX!)).toBeLessThan(0.5)
  })

  test('the slim header keeps the baseline and the proportion', async ({ page }) => {
    await page.goto('/venues/')
    await expect(page.locator('h1').first()).toBeVisible()
    await page.mouse.wheel(0, 1500)
    await expect(page.locator('header.site-header')).toHaveAttribute('data-compact')
    await page.waitForTimeout(500)
    const logo = await measureLogo(page, { ...header, eyebrow: undefined })
    expect(logo.mark).toBeLessThanOrEqual(24.01)
    expect(Math.abs(logo.stepGap)).toBeLessThan(0.5)
    expect(logo.sizeRatio).toBeCloseTo(WORD_RATIO, 3)
  })

  test('the footer logo: one baseline, the P as tall as the house', async ({ page }) => {
    await page.goto('/imprint/')
    const footer = page.locator('.footer-brand-lockup:visible')
    await footer.scrollIntoViewIfNeeded()
    await expect(footer).toBeVisible()
    const logo = await measureLogo(page, logoGeometry('.footer-brand-lockup', '.footer-brand-mark', 'strong'))
    expect(Math.abs(logo.stepGap)).toBeLessThan(0.5)
    expect(logo.sizeRatio).toBeCloseTo(WORD_RATIO, 3)
  })
})

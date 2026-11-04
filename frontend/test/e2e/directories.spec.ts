import { expect, test, width } from './fixtures'

const INDEX_PAGES = ['/exhibitions/', '/venues/', '/organisations/', '/artists/']

// Owner, 2026-11-04: the breadcrumb sits at one height on every index page; the hero is at least
// 480 px high on desktop and tablet.
test('the four index pages put their breadcrumb at one height', async ({ page }) => {
  test.skip(width(page) < 768, 'phones stack the hero from the top anyway')
  const tops: number[] = []
  for (const path of INDEX_PAGES) {
    await page.goto(path)
    const hero = page.locator('section.directory-hero')
    tops.push(Math.round((await hero.locator('nav').boundingBox())!.y))
    expect((await hero.boundingBox())!.height).toBeGreaterThanOrEqual(479)
  }
  expect(new Set(tops).size).toBe(1)
})

test('the search form stays one row with a 44 px search button on phones', async ({ page }) => {
  test.skip(width(page) > 767, 'phone layout only')
  await page.goto('/exhibitions/')
  const form = page.locator('form').filter({ has: page.locator('input[type="search"]') }).first()
  const input = (await form.locator('input[type="search"]').boundingBox())!
  const button = (await form.locator('button[type="submit"]').boundingBox())!
  expect(Math.abs(input.y + input.height / 2 - (button.y + button.height / 2))).toBeLessThan(4)
  expect(button.height).toBeGreaterThanOrEqual(44)
})

// A count shows once per page: the status line only while a search is active (owner, 2026-11-04).
test('a search shows its count, keeps it in the address and clears again', async ({ page }) => {
  await page.goto('/exhibitions/')
  const status = page.locator('.directory-status')
  await expect(status.getByRole('status')).toHaveText('')
  await page.locator('input[type="search"]').fill('Klagenfurt')
  await expect(status.getByRole('status')).toContainText(/\d+ von \d+/)
  await expect(page).toHaveURL(/\?q=Klagenfurt/)
  await status.getByRole('button').click()
  await expect(page).toHaveURL(/\/exhibitions\/$/)
  await expect(status.getByRole('status')).toHaveText('')
})

test('a search without results says so and leads back to the full list', async ({ page }) => {
  await page.goto('/venues/?q=xyzxyz')
  const empty = page.locator('.empty-state')
  await expect(empty).toBeVisible()
  await empty.getByRole('button').click()
  await expect(empty).toHaveCount(0)
  await expect(page.locator('.gallery-directory-grid article, .gallery-directory-grid a').first()).toBeVisible()
})

test('an unknown federal state in a link shows all galleries', async ({ page }) => {
  await page.goto('/venues/')
  const all = await page.locator('.gallery-directory-grid > *').count()
  await page.goto('/venues/?state=mars')
  await expect(page.locator('.gallery-directory-grid > *')).toHaveCount(all)
})

test('the A–Z letters on the artists page are 44 px tap targets and filter the list', async ({ page }) => {
  await page.goto('/artists/')
  const letter = page.locator('.artist-alphabet-filter a', { hasText: /^S$/ })
  expect((await letter.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await letter.click()
  await expect(page).toHaveURL(/letter=S/)
  await expect(letter).toHaveAttribute('aria-current', 'page')
})

test('an artist name opens the person page', async ({ page }) => {
  await page.goto('/artists/')
  await expect(page.locator('.artist-name-link').first()).toHaveAttribute('href', /^\/persons\/[^/]+\/$/)
})

test('the artist dialog opens from the "i", keeps the focus inside, closes by Escape or backdrop', async ({ page }) => {
  await page.goto('/artists/')
  const info = page.locator('.artist-info-button').first()
  await expect(info).toHaveAttribute('aria-expanded', 'false')
  await info.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(info).toHaveAttribute('aria-expanded', 'true')
  const inside = () => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))
  expect(await inside()).toBe(true)
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab')
  expect(await inside()).toBe(true)
  const exhibitionLinks = await dialog.locator('a[href^="/exhibitions/"]').count()
  expect(exhibitionLinks).toBeGreaterThan(0)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(info).toBeFocused()
  await info.click()
  await expect(dialog).toBeVisible()
  await page.mouse.click(5, 5)
  await expect(dialog).toBeHidden()
})

// Owner, 2026-11-04: the first heading below the divider never sits on it. The hidden status line
// keeps its space (28 px, 16 on phones), the same as the space above the divider.
for (const path of INDEX_PAGES) {
  test(`${path} keeps space between the divider and the first content`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible()
    const gap = await page.locator('main .archive-inset-divider').first().evaluate((divider) => {
      const below = divider.getBoundingClientRect().bottom
      const tops = [...divider.nextElementSibling!.querySelectorAll('*')]
        // Whole lines only: an inline piece's letter box reaches above a tight line height.
        .filter((element) => !element.closest('.sr-only') && getComputedStyle(element).display !== 'inline' && [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim()))
        .map((element) => element.getBoundingClientRect())
        .filter((box) => box.height > 0 && box.top >= below - 2)
        .map((box) => box.top)
      return Math.min(...tops) - below
    })
    expect(gap).toBeGreaterThanOrEqual(width(page) < 768 ? 12 : 24)
  })
}

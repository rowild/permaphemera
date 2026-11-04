import { expect, test, width } from './fixtures'

// Directus images load resized (?width=…), never as the full original (16 MB on the start page
// before 0.0.51).
for (const path of ['/', '/venues/', '/exhibitions/']) {
  test(`${path} loads Directus images only in a resized form`, async ({ page }) => {
    const originals: string[] = []
    page.on('request', (request) => {
      if (/\/assets\/[0-9a-f-]{36}/.test(request.url()) && !request.url().includes('width=')) originals.push(request.url())
    })
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible()
    for (let y = 0; y < 6; y++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(300) }
    await page.waitForTimeout(1500)
    expect(originals).toEqual([])
  })
}

test('the gallery page preview shows its image (it once collapsed to zero height)', async ({ page }) => {
  test.skip(width(page) < 768, 'the preview column is desktop and tablet only')
  await page.goto('/venues/parkschloessl-spittal-drau/')
  const image = page.locator('.venue-preview-image').first()
  await expect(image).toBeVisible()
  expect((await image.boundingBox())!.height).toBeGreaterThan(100)
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
})

test('the fact box puts each label above its value on phones, beside it elsewhere', async ({ page }) => {
  await page.goto('/contact/')
  const row = page.locator('aside.fact-record dl > div').nth(1)
  const label = (await row.locator('dt').boundingBox())!
  const value = (await row.locator('dd').boundingBox())!
  if (width(page) < 768) expect(value.y).toBeGreaterThanOrEqual(label.y + label.height - 1)
  else expect(value.x).toBeGreaterThan(label.x + label.width - 1)
})

test('an exhibition page shows its short text and its tour notice once', async ({ page }) => {
  await page.goto('/exhibitions/blinddate-der-perspektiven/')
  const text = await page.locator('main').innerText()
  expect(text.match(/keinen 360°-Rundgang/g)?.length).toBe(1)
  expect(text.match(/Drei Absolventinnen der Freien Akademie/g)?.length).toBe(1)
})

// Three.js (about 730 KB) loads with the wheel, never in the files the page needs to show itself
// (plans/2026-11-04__nuxt-optimisation-audit.md 1.5).
test('the start page wheel draws all twelve pictures and loads Three.js on its own', async ({ page, request }) => {
  const scripts = new Set<string>()
  page.on('request', (sent) => { if (/\/_nuxt\/[\w-]+\.js$/.test(sent.url())) scripts.add(new URL(sent.url()).pathname) })
  await page.goto('/')
  // The twelve blades take clicks once their pictures are on the wheel and the intro has run.
  const blades = page.locator('svg.kaleidoscope-blade-links')
  await expect(blades).not.toHaveClass(/pointer-events-none/, { timeout: 30_000 })
  await expect(blades.locator('a[href]')).toHaveCount(12)
  expect(await page.locator('canvas.hero-kaleidoscope-canvas').evaluate((canvas: HTMLCanvasElement) => canvas.width > 0 && !!canvas.getContext('webgl2'))).toBe(true)

  const three: string[] = []
  for (const path of scripts) if ((await (await request.get(path)).text()).includes('__THREE__')) three.push(path)
  expect(three).toHaveLength(1)
  const firstFiles = (await (await request.get('/')).text()).match(/\/_nuxt\/[\w-]+\.js/g) ?? []
  expect(firstFiles.length).toBeGreaterThan(0)
  expect(firstFiles).not.toContain(three[0])
})

// The text pages keep their layout while pictures arrive (the method picture once pushed the
// /about/ heading 520 px down on tablets: layout shift 0.34), and the site's own pictures stay
// small (the method picture was a 1 MB PNG).
for (const path of ['/about/', '/how-it-works/', '/exhibitions/', '/venues/']) {
  test(`${path} does not jump while it loads, and its own pictures stay under 300 KB`, async ({ page }) => {
    const heavy: string[] = []
    page.on('response', async (response) => {
      if (!new URL(response.url()).pathname.startsWith('/media/images/')) return
      const bytes = Number(response.headers()['content-length'] ?? (await response.body().catch(() => Buffer.alloc(0))).length)
      if (bytes > 300_000) heavy.push(`${new URL(response.url()).pathname} ${Math.round(bytes / 1024)} KB`)
    })
    await page.addInitScript(() => {
      const shifts = { total: 0 }
      Object.assign(window, { shifts })
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { value: number, hadRecentInput: boolean })[]) if (!entry.hadRecentInput) shifts.total += entry.value
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible()
    await page.waitForLoadState('load')
    await page.waitForTimeout(1500)
    expect(await page.evaluate(() => (window as unknown as { shifts: { total: number } }).shifts.total)).toBeLessThan(0.1)
    expect(heavy).toEqual([])
  })
}

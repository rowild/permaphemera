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

// An exhibition that is over and was not photographed (tour_status unavailable). Until 2026-11-11
// this was Blinddate der Perspektiven, which has a published tour since then.
test('an exhibition page shows its short text and its tour notice once', async ({ page }) => {
  await page.goto('/exhibitions/kunstkalender-hoffnung-und-frieden/')
  const text = await page.locator('main').innerText()
  expect(text.match(/keinen 360°-Rundgang/g)?.length).toBe(1)
  expect(text.match(/entstanden mit Helmuth Ploschnitznigg und Adi Schmölzer, in einer Pop-up-Galerie/g)?.length).toBe(1)
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

// Owner, 2026-11-04: a gallery page names its curator and its head, like "Betrieben von".
test('a gallery page names its curator and its head, and no other person tied to it', async ({ page }) => {
  await page.goto('/venues/galerie-im-schloss-porcia-spittal-drau/')
  const facts = page.locator('dl.venue-contact-list')
  const curator = facts.locator('div', { has: page.locator('dt', { hasText: /^Kurator:in$/ }) })
  await expect(curator.getByRole('link', { name: 'Séverin Krön' })).toHaveAttribute('href', '/persons/severin-kroen/')

  await page.goto('/venues/bv-galerie-klagenfurt/')
  const head = facts.locator('div', { has: page.locator('dt', { hasText: /^Leitung$/ }) })
  await expect(head.getByRole('link', { name: 'Margaretha Bauer' })).toHaveAttribute('href', '/persons/margaretha-bauer/')
  // Eva Asaad photographs the gallery's exhibitions: a tie, but neither curator nor head.
  await expect(facts.getByRole('link', { name: 'Eva Asaad' })).toHaveCount(0)
})

// Owner, 2026-11-11: the start page leads with the newest 360° tours. The first section shows
// them in its left two thirds with the link to all exhibitions at the end of that area; the news
// column keeps its place and carries the section line; current and announced exhibitions follow
// in two small rows of at most five that scroll sideways when needed; "Ausstellungen" (more
// tours) comes before "Räume".
test('the start page leads with the newest tours', async ({ page }) => {
  await page.goto('/')
  const section = page.locator('#new-tours')
  await expect(section).toBeVisible({ timeout: 30_000 })
  // The sections below the hero are built one per frame after the hero text (index.vue).
  await expect(page.locator('#venues')).toBeAttached({ timeout: 30_000 })
  const order = await page.evaluate(() => ['#new-tours', '#exhibitions', '#venues'].map((id) => {
    const element = document.querySelector(id)
    return element ? [...document.querySelectorAll('section[id]')].indexOf(element as HTMLElement) : -1
  }))
  expect(order[0]).toBeGreaterThanOrEqual(0)
  expect(order[1]).toBeGreaterThan(order[0]!)
  expect(order[2]).toBeGreaterThan(order[1]!)

  for (const row of await section.locator('[data-schedule-row]').all()) {
    expect(await row.locator('li').count()).toBeLessThanOrEqual(5)
    const track = row.locator('ul')
    const { scroll, client, overflow } = await track.evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth, overflow: getComputedStyle(element).overflowX }))
    if (scroll > client + 1) expect(overflow).toBe('auto')
  }

  if (width(page) < 701) return
  const news = section.locator('.news-latest')
  await expect(news).toBeVisible()
  const newsBox = (await news.boundingBox())!
  const link = (await section.locator('.new-tours-heading a[href$="/exhibitions/"]').boundingBox())!
  expect(link.x + link.width).toBeLessThanOrEqual(newsBox.x)
  expect(link.y + link.height).toBeLessThanOrEqual(newsBox.y + 1)
  expect(await news.locator('h3').evaluate((heading) => getComputedStyle(heading, '::after').content)).not.toBe('none')
})

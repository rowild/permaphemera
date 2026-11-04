import { expect, test } from './fixtures'

// Events (plans/2026-11-04__events-collection.md). Runs against a build that reads a Directus with
// the events published (the local copy during the branch; the live one after the release).

test('the events index lists each event with its kind, place, editions and exhibitions', async ({ page }) => {
  await page.goto('/events/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Veranstaltungen und ihre')
  const festival = page.getByRole('link', { name: 'Veranstaltung öffnen: Spittaler Comicfestival' })
  await expect(festival).toHaveAttribute('href', '/events/spittaler-comicfestival/')
  await expect(page.locator('main')).toContainText('Festival · Spittal an der Drau')
  await expect(page.locator('main')).toContainText('Museumsnacht · Ganz Österreich')
})

test('an event page shows its organiser, its editions and the exhibitions of each edition', async ({ page }) => {
  await page.goto('/events/spittaler-comicfestival/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Spittaler Comicfestival')
  const facts = page.locator('section.event-hero dl')
  await expect(facts.getByRole('link', { name: 'Austriatoon' })).toHaveAttribute('href', '/organisations/austriatoon/')
  const edition = page.locator('#event-edition-2026')
  await expect(edition.locator('.eyebrow')).toContainText('7. Ausgabe · 2026')
  await expect(edition.getByRole('heading', { level: 2 })).toHaveText('Ausstellungen 2026')
  await expect(edition.locator('a[href="/exhibitions/auf-linien-zum-leben/"]').first()).toBeVisible()
})

test('a one-night event across the country shows its date and its exhibitions', async ({ page }) => {
  await page.goto('/events/lange-nacht-der-museen/')
  // No town: the subtitle says where instead (no separate place row: it would repeat it).
  await expect(page.locator('section.event-hero')).toContainText('Ganz Österreich')
  await expect(page.locator('#event-edition-2026 .eyebrow')).toHaveText('3. Oktober 2026')
  await expect(page.locator('#event-edition-2026 .exhibition-card-grid > div')).toHaveCount(4)
})

test('an exhibition names the event it is part of, linked', async ({ page }) => {
  await page.goto('/exhibitions/auf-linien-zum-leben/')
  const row = page.locator('div', { has: page.locator('dt', { hasText: /^Teil von$/ }) }).last()
  await expect(row.getByRole('link', { name: 'Spittaler Comicfestival 2026' })).toHaveAttribute('href', '/events/spittaler-comicfestival/')
})

test('an organisation page names the events it organises', async ({ page }) => {
  await page.goto('/organisations/austriatoon/')
  await expect(page.locator('section.organisation-hero dl').getByRole('link', { name: 'Spittaler Comicfestival' })).toHaveAttribute('href', '/events/spittaler-comicfestival/')
})

test('the main menu leads to the events', async ({ page }) => {
  await page.goto('/about/')
  await expect(page.locator('h1').first()).toBeVisible()
  const header = page.locator('header.site-header')
  // Tablets and phones show the main menu behind the menu button.
  if (await page.locator('button.mobile-menu').isVisible()) await page.locator('button.mobile-menu').click()
  await expect(header.getByRole('link', { name: 'Veranstaltungen' }).filter({ visible: true }).first()).toHaveAttribute('href', '/events/')
})

// Owner, 2026-11-04: one divider between the hero and the list, not two lines.
test('the events index has one line between the hero and the list', async ({ page }) => {
  await page.goto('/events/')
  await expect(page.locator('.event-directory-list')).toBeVisible()
  expect(await page.locator('.event-directory-list').evaluate((list) => getComputedStyle(list).borderTopWidth)).toBe('0px')
})

// Owner, 2026-11-04: the aside ("Über die Veranstaltung") starts level with the eyebrow, not with
// the breadcrumb (two columns: desktop only).
test('the record hero aside starts level with the eyebrow', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1100, 'one column on tablets and phones')
  for (const path of ['/events/spittaler-comicfestival/', '/organisations/austriatoon/']) {
    await page.goto(path)
    const hero = page.locator('section.record-hero')
    await expect(hero).toBeVisible()
    // The aside (its picture or its "Über …" eyebrow) starts on the line of the copy's eyebrow.
    const [eyebrow, aside] = await hero.locator('.record-hero-grid').evaluate((grid) => [
      grid.querySelector('.record-hero-copy .eyebrow')!.getBoundingClientRect().top,
      grid.lastElementChild!.getBoundingClientRect().top
    ])
    expect(Math.abs(eyebrow! - aside!), path).toBeLessThanOrEqual(2)
  }
})

// Owner, 2026-11-04: a long label ("Veranstaltungen") is divided, never drawn over its value.
test('fact labels never run into their values', async ({ page }) => {
  for (const path of ['/organisations/austriatoon/', '/events/spittaler-comicfestival/', '/venues/bv-galerie-klagenfurt/', '/exhibitions/auf-linien-zum-leben/', '/persons/severin-kroen/']) {
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible()
    const overlaps = await page.locator('.archive-metadata-row').evaluateAll((rows) => rows.flatMap((row) => {
      const label = row.querySelector('.metadata-label')!.getBoundingClientRect()
      const value = row.querySelector('dd')!.getBoundingClientRect()
      return label.right > value.left + 1 ? [`${row.querySelector('.metadata-label')!.textContent}: ${Math.round(label.right - value.left)} px`] : []
    }))
    expect(overlaps, path).toEqual([])
  }
})

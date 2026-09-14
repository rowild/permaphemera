// directus/scripts/seed.mjs
// Reference data the site needs on day one. Safe to run twice.
//   node scripts/seed.mjs
import { loadEnv, login } from './lib.mjs'

const { api } = await login(loadEnv())

const one = async (collection, filter) => {
  const q = Object.entries(filter).map(([k, v]) => `filter[${k}][_eq]=${encodeURIComponent(v)}`).join('&')
  const rows = await api('GET', `/items/${collection}?${q}&limit=1`)
  return rows[0] ?? null
}
const ensure = async (collection, filter, data) => {
  const existing = await one(collection, filter)
  if (existing) { console.log(`= ${collection} ${JSON.stringify(filter)}`); return existing }
  const created = await api('POST', `/items/${collection}`, { ...filter, ...data })
  console.log(`+ ${collection} ${JSON.stringify(filter)}`)
  return created
}
const tr = (en, de) => [{ languages_code: 'en', title: en }, { languages_code: 'de', title: de }]

// Languages
await ensure('languages', { code: 'en' }, { name: 'English', direction: 'ltr' })
await ensure('languages', { code: 'de' }, { name: 'Deutsch', direction: 'ltr' })

// Roles
await ensure('pp_roles', { slug: 'artist' }, { status: 'published', title: 'Artist', sort: 1, translations: tr('Artist', 'Künstler:in') })
await ensure('pp_roles', { slug: 'curator' }, { status: 'published', title: 'Curator', sort: 2, translations: tr('Curator', 'Kurator:in') })

// Navigations. Titles come from the frontend locale files of 2026-09-14.
const main = await ensure('pp_navigations', { key: 'main' }, { status: 'published', title: 'Main navigation', sort: 1 })
const footer = await ensure('pp_navigations', { key: 'footer' }, { status: 'published', title: 'Footer navigation', sort: 2 })

const item = async (nav, key, en, de, opts = {}) => ensure('pp_navigation_items', { navigation: nav.id, key }, {
  status: 'published', title: en, kind: opts.kind ?? 'route', path: opts.path ?? null, url: opts.url ?? null,
  target: '_self', parent: opts.parent?.id ?? null, sort: opts.sort ?? 0, translations: tr(en, de),
})

// main
await item(main, 'exhibitions', 'Exhibitions', 'Ausstellungen', { path: '/exhibitions/', sort: 1 })
await item(main, 'artists', 'Artists', 'Künstler:innen', { path: '/artists/', sort: 2 })
await item(main, 'galleries', 'Galleries', 'Galerien', { path: '/venues/', sort: 3 })
await item(main, 'about', 'About the Project', 'Über das Projekt', { path: '/about/', sort: 4 })

// footer groups
const explore = await item(footer, 'explore', 'Explore', 'Entdecken', { sort: 1 })
const information = await item(footer, 'information', 'Information', 'Information', { sort: 2 })
const legal = await item(footer, 'legal', 'Legal', 'Rechtliches', { sort: 3 })

await item(footer, 'exhibitions', 'Exhibitions', 'Ausstellungen', { path: '/exhibitions/', parent: explore, sort: 1 })
await item(footer, 'artists', 'Artists', 'Künstler:innen', { path: '/artists/', parent: explore, sort: 2 })
await item(footer, 'galleries', 'Galleries', 'Galerien', { path: '/venues/', parent: explore, sort: 3 })

await item(footer, 'about', 'About the Project', 'Über das Projekt', { path: '/about/', parent: information, sort: 1 })
await item(footer, 'how-it-works', 'How it works', 'Wie es funktioniert', { path: '/how-it-works/', parent: information, sort: 2 })
await item(footer, 'contact', 'Contact', 'Kontakt', { path: '/contact/', parent: information, sort: 3 })

await item(footer, 'imprint', 'Imprint', 'Impressum', { path: '/imprint/', parent: legal, sort: 1 })
await item(footer, 'privacy', 'Privacy Policy', 'Datenschutzerklärung', { path: '/privacy/', parent: legal, sort: 2 })
await item(footer, 'terms', 'Terms of Use', 'Nutzungsbedingungen', { path: '/terms/', parent: legal, sort: 3 })
await item(footer, 'accessibility', 'Accessibility', 'Barrierefreiheit', { path: '/accessibility/', parent: legal, sort: 4 })
await item(footer, 'cookies', 'Cookie settings', 'Cookie-Einstellungen', { kind: 'action', path: 'cookie-settings', parent: legal, sort: 5 })

console.log('done')

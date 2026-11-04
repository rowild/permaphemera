// plans/2026-11-04__events-collection/migrate-events.mjs
// Moves the two events into the new collection (plans/2026-11-04__events-collection.md):
// the Spittaler Comicfestival (until now an organisation record) and the ORF Lange Nacht der
// Museen (until now only a phrase in four exhibitions). Safe to run twice: every step looks
// first. New records are drafts; the owner publishes.
//
//   cd directus
//   node ../plans/2026-11-04__events-collection/migrate-events.mjs [--dry-run]            # local
//   DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-04__events-collection/migrate-events.mjs   # live, at the release
import { loadEnv, login } from '../../directus/scripts/lib.mjs'

const dryRun = process.argv.includes('--dry-run')
const { api, base } = await login(loadEnv())
console.log(`${dryRun ? 'DRY RUN against' : 'Writing to'} ${base}`)

const q = (value) => encodeURIComponent(JSON.stringify(value))
const find = async (collection, filter, fields = 'id') => (await api('GET', `/items/${collection}?filter=${q(filter)}&fields=${fields}&limit=-1`))
const one = async (collection, filter, fields) => (await find(collection, filter, fields))[0]
const write = async (method, path, body, label) => {
  console.log(`${method === 'DELETE' ? '-' : method === 'POST' ? '+' : '~'} ${label}`)
  if (dryRun) return { id: `(dry-run ${label})` }
  return api(method, path, body)
}
const bySlug = async (collection, slug) => {
  const record = await one(collection, { slug: { _eq: slug } }, 'id')
  if (!record) throw new Error(`${collection} ${slug} not found`)
  return record.id
}

// ---------------------------------------------------------------------------------------------
// Spittaler Comicfestival
const FESTIVAL_ORG = 'spittaler-comicfestival'
const festivalOrg = await one('pp_organisations', { slug: { _eq: FESTIVAL_ORG } }, 'id,title,location,lede,description,about_html,translations.*')

let festival = await one('pp_events', { slug: { _eq: 'spittaler-comicfestival' } }, 'id')
if (!festival) {
  if (!festivalOrg) throw new Error('Neither the event nor the old organisation record exists: nothing to move the texts from')
  const text = (code) => festivalOrg.translations.find((entry) => entry.languages_code === code) ?? {}
  const seo = {
    en: { title: 'Spittaler Comicfestival, Spittal an der Drau', meta_description: text('en').seo?.meta_description ?? null },
    de: { title: 'Spittaler Comicfestival, Spittal an der Drau', meta_description: text('de').seo?.meta_description ?? null }
  }
  festival = await write('POST', '/items/pp_events', {
    status: 'draft', title: 'Spittaler Comicfestival', slug: 'spittaler-comicfestival', kind: 'festival', location: festivalOrg.location,
    lede: text('en').lede, description: text('en').description, about_html: text('en').about_html, seo: seo.en,
    translations: ['en', 'de'].map((code) => ({ languages_code: code, lede: text(code).lede, description: text(code).description, about_html: text(code).about_html, seo: seo[code] }))
  }, 'event spittaler-comicfestival (texts from the organisation record)')
}

let festival2026 = await one('pp_event_editions', { event: { _eq: festival.id }, year: { _eq: 2026 } }, 'id')
festival2026 ??= await write('POST', '/items/pp_event_editions', { event: festival.id, year: 2026, edition_number: 7 }, 'edition Comicfestival 2026 (7th)')

const linesId = await bySlug('pp_exhibitions', 'auf-linien-zum-leben')
const lines = await one('pp_exhibitions', { id: { _eq: linesId } }, 'id,event_edition')
if (lines.event_edition !== festival2026.id) await write('PATCH', `/items/pp_exhibitions/${linesId}`, { event_edition: festival2026.id }, 'auf-linien-zum-leben -> Comicfestival 2026')

const austriatoon = await bySlug('pp_organisations', 'austriatoon')
if (!(await one('pp_event_organisers', { event: { _eq: festival.id }, organisation: { _eq: austriatoon } })))
  await write('POST', '/items/pp_event_organisers', { event: festival.id, organisation: austriatoon, role: 'organiser', sort: 1 }, 'Austriatoon organises the Comicfestival')

for (const slug of ['spittal-an-der-drau-erster-partner', 'der-sommer-im-parkschloessl']) {
  const news = await bySlug('pp_news', slug)
  if (!(await one('pp_mm__events_news', { events_id: { _eq: festival.id }, news_id: { _eq: news } })))
    await write('POST', '/items/pp_mm__events_news', { events_id: festival.id, news_id: news, sort: 1 }, `news ${slug} -> Comicfestival`)
}

// The news text named the festival as a link to its organisation page; that link was removed on
// 2026-11-04 (the record became a draft). It points at the event page now.
const summer = await one('pp_news', { slug: { _eq: 'der-sommer-im-parkschloessl' } }, 'id,description,translations.id,translations.languages_code,translations.description')
const relink = (text) => text
  .replace(/(?<!\[)the Spittal comic festival with/, 'the [Spittal comic festival](/events/spittaler-comicfestival/) with')
  .replace(/(?<!\[)das Spittaler Comicfestival mit/, 'das [Spittaler Comicfestival](/events/spittaler-comicfestival/) mit')
const relinked = { description: relink(summer.description), translations: { update: summer.translations.map((entry) => ({ id: entry.id, description: relink(entry.description) })) } }
if (relinked.description !== summer.description || summer.translations.some((entry, index) => relinked.translations.update[index].description !== entry.description))
  await write('PATCH', `/items/pp_news/${summer.id}`, relinked, 'news der-sommer-im-parkschloessl links the festival to /events/spittaler-comicfestival/')

// ---------------------------------------------------------------------------------------------
// ORF Lange Nacht der Museen
let longNight = await one('pp_events', { slug: { _eq: 'lange-nacht-der-museen' } }, 'id')
if (!longNight) {
  const words = {
    en: {
      lede: 'One night in October when museums and galleries across Austria stay open late.',
      description: 'Annual museum night of the ORF across Austria.',
      about_html: '<p>The ORF Lange Nacht der Museen takes place on a Saturday in October every year: museums and galleries across Austria stay open into the night, with one ticket for all of them. In 2026 it fell on 3 October.</p>',
      seo: { title: 'ORF Lange Nacht der Museen', meta_description: 'The ORF Lange Nacht der Museen opens museums and galleries across Austria on one Saturday each October; in the archive: its exhibitions of 2026.' }
    },
    de: {
      lede: 'Eine Nacht im Oktober, in der Museen und Galerien in ganz Österreich bis spät geöffnet sind.',
      description: 'Jährliche Museumsnacht des ORF in ganz Österreich.',
      about_html: '<p>Die ORF Lange Nacht der Museen findet jedes Jahr an einem Samstag im Oktober statt: Museen und Galerien in ganz Österreich sind dann bis in die Nacht geöffnet, mit einem Ticket für alle. 2026 fiel sie auf den 3. Oktober.</p>',
      seo: { title: 'ORF Lange Nacht der Museen', meta_description: 'Die ORF Lange Nacht der Museen öffnet jedes Jahr an einem Samstag im Oktober Museen und Galerien in ganz Österreich; im Archiv: ihre Ausstellungen von 2026.' }
    }
  }
  longNight = await write('POST', '/items/pp_events', {
    status: 'draft', title: 'ORF Lange Nacht der Museen', slug: 'lange-nacht-der-museen', kind: 'long_night', location: null,
    website_url: 'https://langenacht.orf.at/', ...words.en,
    translations: ['en', 'de'].map((code) => ({ languages_code: code, ...words[code] }))
  }, 'event lange-nacht-der-museen')
}

let night2026 = await one('pp_event_editions', { event: { _eq: longNight.id }, year: { _eq: 2026 } }, 'id')
night2026 ??= await write('POST', '/items/pp_event_editions', { event: longNight.id, year: 2026, start_date: '2026-10-03', end_date: '2026-10-03' }, 'edition Lange Nacht 2026 (3 October)')

for (const slug of ['mediterraneo-harald-scheicher-2026', 'schwach-unperfekt-ausgefranst-echt-2026', 'spannungsfelder-und-perspektiven-2026', 'walther-preiml-sehnsucht']) {
  const exhibition = await one('pp_exhibitions', { slug: { _eq: slug } }, 'id,event_edition')
  if (!exhibition) throw new Error(`pp_exhibitions ${slug} not found`)
  if (exhibition.event_edition !== night2026.id) await write('PATCH', `/items/pp_exhibitions/${exhibition.id}`, { event_edition: night2026.id }, `${slug} -> Lange Nacht 2026`)
}

// ---------------------------------------------------------------------------------------------
// Main menu: "Veranstaltungen" / "Events", a draft until the release (the live site reads the menu).
const main = await one('pp_navigations', { key: { _eq: 'main' } }, 'id')
if (!(await one('pp_navigation_items', { navigation: { _eq: main.id }, key: { _eq: 'events' } })))
  await write('POST', '/items/pp_navigation_items', {
    status: 'draft', navigation: main.id, parent: null, key: 'events', title: 'Events', kind: 'route', path: '/events/', url: null, target: '_self', sort: 5,
    translations: [{ languages_code: 'en', title: 'Events' }, { languages_code: 'de', title: 'Veranstaltungen' }]
  }, 'main menu item "Veranstaltungen" / "Events" (draft)')

// ---------------------------------------------------------------------------------------------
// The old organisation record: its rows first, then the record (owner: delete it).
if (festivalOrg) {
  for (const [collection, column] of [['pp_exhibition_organisers', 'organisation'], ['pp_organisation_venue_relations', 'organisation'], ['pp_organisation_memberships', 'organisation'], ['pp_mm__news_organisations', 'organisations_id'], ['pp_mm__organisations_websites', 'organisations_id']]) {
    for (const row of await find(collection, { [column]: { _eq: festivalOrg.id } }))
      await write('DELETE', `/items/${collection}/${row.id}`, undefined, `${collection} row ${row.id} of the old organisation record`)
  }
  await write('DELETE', `/items/pp_organisations/${festivalOrg.id}`, undefined, `organisation ${FESTIVAL_ORG} (moved to the event)`)
}

console.log('done')

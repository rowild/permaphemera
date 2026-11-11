// scripts/lib/news-report.mjs
// The monthly news report for the owner (plans/2026-11-04__news-system.md §7): what happened in
// the archive, so the owner can decide whether a news article is worth writing. Pure logic: the
// archive (published records, as the public API delivers them) and the state of the last report
// go in; the mail text and the next state come out.
import { tourAccess, tourOnlineDate } from '../../shared/tour-access.mjs'

export const SITE_URL = 'https://permaphemera.at'
export const ADMIN_URL = 'https://permaphemera.project-backends.info/admin/content'
/** "Soon" in the report: the next three weeks (owner, 2026-11-04). */
export const WINDOW_DAYS = 21

const published = (record) => record?.status === 'published'
const addDays = (day, days) => new Date(Date.parse(`${day}T12:00:00Z`) + days * 864e5).toISOString().slice(0, 10)
const personName = (person) => (person.display_name || `${person.first_name ?? ''} ${person.last_name ?? ''}`).trim()
const longDate = (day) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`))

/** What the next report compares with: the published slugs per kind and the open tours. */
export const stateOf = (archive, today) => ({
  date: today,
  venues: (archive.venues ?? []).filter(published).map((r) => r.slug).sort(),
  persons: (archive.persons ?? []).filter(published).map((r) => r.slug).sort(),
  organisations: (archive.organisations ?? []).filter(published).map((r) => r.slug).sort(),
  sponsors: (archive.sponsors ?? []).filter(published).map((r) => r.slug).sort(),
  exhibitions: (archive.exhibitions ?? []).filter(published).map((r) => r.slug).sort(),
  openTours: (archive.exhibitions ?? []).filter((r) => published(r) && tourAccess(r, today).kind === 'open').map((r) => r.slug).sort()
})

export const buildReport = (archive, previous, today) => {
  const next = stateOf(archive, today)
  const soon = addDays(today, WINDOW_DAYS)
  const exhibitions = (archive.exhibitions ?? []).filter(published)
  const venueName = new Map((archive.venues ?? []).map((venue) => [venue.id, venue.title]))
  const isNew = (kind) => (slug) => Boolean(previous) && !previous[kind].includes(slug)

  const line = (title, detail, path, collection, id) =>
    `- ${title}${detail ? ` (${detail})` : ''}\n  ${SITE_URL}${path}\n  ${ADMIN_URL}/${collection}/${id}`
  const where = (exhibition) => venueName.get(exhibition.primary_venue)
  const byDate = (field) => (a, b) => String(a[field] ?? '').localeCompare(String(b[field] ?? ''))

  const sections = [
    ['Exhibitions that close within 3 weeks (a "closing" article: the 360° tour follows)',
      exhibitions.filter((e) => !e.is_permanent && e.end_date >= today && e.end_date <= soon).sort(byDate('end_date'))
        .map((e) => line(e.title, [where(e), `closes ${longDate(e.end_date)}`].filter(Boolean).join(', '), `/exhibitions/${e.slug}/`, 'pp_exhibitions', e.id))],
    ['360° tours that went online since the last report',
      exhibitions.filter((e) => next.openTours.includes(e.slug) && isNew('openTours')(e.slug))
        .map((e) => line(e.title, where(e), `/exhibitions/${e.slug}/`, 'pp_exhibitions', e.id))],
    ['360° tours that go online within 3 weeks',
      exhibitions.filter((e) => { const access = tourAccess(e, today); return access.kind === 'scheduled' && access.date <= soon }).sort((a, b) => (tourOnlineDate(a) ?? '').localeCompare(tourOnlineDate(b) ?? ''))
        .map((e) => line(e.title, [where(e), `tour from ${longDate(tourOnlineDate(e))}`].filter(Boolean).join(', '), `/exhibitions/${e.slug}/`, 'pp_exhibitions', e.id))],
    ['New galleries since the last report (a "welcome" article)',
      (archive.venues ?? []).filter((r) => published(r) && isNew('venues')(r.slug)).map((r) => line(r.title, '', `/venues/${r.slug}/`, 'pp_venues', r.id))],
    ['New artists and other persons since the last report (a "welcome" article)',
      (archive.persons ?? []).filter((r) => published(r) && isNew('persons')(r.slug)).map((r) => line(personName(r), '', `/persons/${r.slug}/`, 'pp_persons', r.id))],
    ['New organisations since the last report (a "welcome" article)',
      (archive.organisations ?? []).filter((r) => published(r) && isNew('organisations')(r.slug)).map((r) => line(r.title, '', `/organisations/${r.slug}/`, 'pp_organisations', r.id))],
    ['New sponsors since the last report (a "support" article)',
      (archive.sponsors ?? []).filter((r) => published(r) && isNew('sponsors')(r.slug)).map((r) => line(r.title, '', `/sponsors/${r.slug}/`, 'pp_sponsors', r.id))],
    ['Exhibitions that open within 3 weeks (an "opening" article)',
      exhibitions.filter((e) => e.start_date > today && e.start_date <= soon).sort(byDate('start_date'))
        .map((e) => line(e.title, [where(e), `opens ${longDate(e.start_date)}`].filter(Boolean).join(', '), `/exhibitions/${e.slug}/`, 'pp_exhibitions', e.id))],
    ['New exhibitions in the archive since the last report (for information; no welcome article for exhibitions)',
      exhibitions.filter((e) => isNew('exhibitions')(e.slug)).map((e) => line(e.title, where(e), `/exhibitions/${e.slug}/`, 'pp_exhibitions', e.id))]
  ]

  const lastArticle = (archive.news ?? []).filter(published).map((n) => n.published_on).sort().at(-1)
  const days = lastArticle ? Math.round((Date.parse(today) - Date.parse(lastArticle)) / 864e5) : undefined
  const intro = [
    `PERMAPHEMERA news report, ${longDate(today)}`,
    previous ? `Changes since the last report of ${longDate(previous.date)}.` : 'First report: it lists what is coming up and sets the starting point. "New since the last report" begins with the next one.',
    lastArticle ? `Last published news article: ${longDate(lastArticle)} (${days} days ago).` : 'No news article is published yet.'
  ].join('\n')
  const body = sections.map(([title, lines]) => `${title}:\n${lines.length ? lines.join('\n') : '- nothing'}`).join('\n\n')
  const empty = sections.every(([, lines]) => !lines.length)
  const outro = [
    empty ? 'Nothing new. No article needed, unless there is news about the website.' : '',
    'To write an article, tell Claude, for example: "News: welcome for <gallery>" or "News: <exhibition> closes, tour follows". Claude writes it in German and English as a draft in Directus; you publish it.',
    `All news: ${SITE_URL}/news/ · Drafts: ${ADMIN_URL}/pp_news`
  ].filter(Boolean).join('\n\n')

  return { text: `${intro}\n\n${body}\n\n${outro}\n`, next, empty }
}

/** A plain-text mail (RFC 5322) for curl's SMTP upload. The subject stays ASCII. */
export const mailOf = ({ from, to, today, text }) => [
  `From: PERMAPHEMERA <${from}>`,
  `To: ${to}`,
  `Subject: PERMAPHEMERA news report ${today}`,
  `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
  `Message-ID: <news-report-${today}-${Date.now()}@permaphemera.at>`,
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=utf-8',
  'Content-Transfer-Encoding: 8bit',
  '',
  text
].join('\r\n')

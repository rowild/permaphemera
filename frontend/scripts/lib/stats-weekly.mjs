// The pure part of the weekly Umami sums (owner, 2026-11-11; plans/2026-11-11__umami-weekly-sums.md).
// Umami deletes visit details after 36 months; these sums stay for good in pp_stats_weekly.
//
// Input: the lines scripts/server/stats-weekly.sh exports from Umami, one JSON object each:
//   { t: 'v', w: week, p: url_path, s: session, r: referrer_domain, n: page views }
//   { t: 'o', w: week, tour: tour id, s: session, n: tour openings }
//   { t: 's', s: session, c: country, r: region, ci: city, d: device }
// A week is the Monday it starts on (Vienna time). A visitor is Umami's session (it changes
// monthly), counted once per week and row.

/** The first week Umami counted (it started on Saturday 2026-10-24). */
export const FIRST_WEEK = '2026-10-19'

/**
 * Where the next export starts: the last stored week again (an interrupted run may have written
 * only part of it; rows already stored are skipped by key), or the first week.
 */
export const exportStart = (lastStored) => lastStored || FIRST_WEEK

/** One address per page: both languages together, without anchor and query, with the end slash. */
export const normalizePath = (path) => {
  let p = String(path || '/').replace(/[?#].*$/, '')
  p = p.replace(/^\/en(?=\/|$)/, '') || '/'
  if (!p.startsWith('/')) p = `/${p}`
  return p.endsWith('/') ? p : `${p}/`
}

// Route segment -> Directus collection. Only these addresses are record pages.
const RECORD_ROUTES = {
  exhibitions: 'pp_exhibitions',
  persons: 'pp_persons',
  venues: 'pp_venues',
  organisations: 'pp_organisations',
  events: 'pp_events',
  news: 'pp_news',
  sponsors: 'pp_sponsors'
}
const LIST_PAGES = new Set(['/exhibitions/current/', '/exhibitions/past/', '/exhibitions/upcoming/'])

const idOf = (value) => (value && typeof value === 'object' ? value.id : value) ?? null
const personName = (p) => p.display_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || p.slug

/**
 * Lookup tables from the Directus records: address -> record, tour id -> exhibition, and the
 * towns each record counts for (galleries, exhibitions via their gallery, organisations, events).
 */
export const buildIndex = (records) => {
  const towns = new Map((records.locations ?? []).map((t) => [t.id, t.title]))
  const byPath = new Map()
  const byTour = new Map()
  const add = (route, item, label, townId) => {
    const record = { collection: RECORD_ROUTES[route], item: item.id, label, path: `/${route}/${item.slug}/`, towns: townId && towns.has(townId) ? [townId] : [] }
    byPath.set(record.path, record)
    return record
  }
  for (const v of records.venues ?? []) add('venues', v, v.title, idOf(v.location))
  for (const e of records.exhibitions ?? []) {
    const record = add('exhibitions', e, e.title, idOf(e.primary_venue?.location))
    const tour = e.tour && /\/media\/tours\/([^/?#]+)/.exec(e.tour)?.[1]
    if (tour) byTour.set(tour, record)
  }
  for (const p of records.persons ?? []) add('persons', p, personName(p), null)
  for (const o of records.organisations ?? []) add('organisations', o, o.title, idOf(o.location))
  for (const ev of records.events ?? []) add('events', ev, ev.title, idOf(ev.location))
  for (const n of records.news ?? []) add('news', n, n.title, null)
  for (const s of records.sponsors ?? []) add('sponsors', s, s.title, null)
  return { byPath, byTour, towns }
}

const recordOf = (index, path) => {
  if (LIST_PAGES.has(path)) return null
  const match = /^\/([a-z]+)\/[^/]+\/$/.exec(path)
  return match && RECORD_ROUTES[match[1]] ? index.byPath.get(path) ?? null : null
}

/** Sums the exported lines into the rows of pp_stats_weekly (without the numbers' zero rows). */
export const sumWeeks = (lines, index) => {
  const sessions = new Map(lines.filter((l) => l.t === 's').map((l) => [l.s, l]))
  const rows = new Map()
  const bump = (week, kind, id, base, { views = 0, tours = 0, session }) => {
    const key = `${week}|${kind}|${id}`.slice(0, 255)
    let row = rows.get(key)
    if (!row) {
      row = { key, week, kind, collection: null, item: null, label: null, path: null, ...base, views: 0, tour_opens: 0, sessions: new Set() }
      rows.set(key, row)
    }
    row.views += views
    row.tour_opens += tours
    if (session) row.sessions.add(session)
  }
  // Where the visitor came from and the device: the same numbers for a page view and a tour opening.
  const visitorRows = (week, session, amounts) => {
    const s = sessions.get(session)
    if (!s) return
    if (s.c) bump(week, 'country', s.c, { label: s.c }, amounts)
    if (s.c && s.ci) bump(week, 'city', `${s.c}|${s.r ?? ''}|${s.ci}`, { label: [s.c, s.r, s.ci].filter(Boolean).join(' · ') }, amounts)
    if (s.d && amounts.views) bump(week, 'device', s.d, { label: s.d }, amounts)
  }
  const recordRows = (week, record, amounts) => {
    bump(week, 'record', `${record.collection}:${record.item}`, { collection: record.collection, item: record.item, label: record.label, path: record.path }, amounts)
    for (const town of record.towns) bump(week, 'town', `pp_locations:${town}`, { collection: 'pp_locations', item: town, label: index.towns.get(town) }, amounts)
  }

  for (const l of lines) {
    if (l.t === 'v') {
      const amounts = { views: Number(l.n) || 0, session: l.s }
      const path = normalizePath(l.p)
      bump(l.w, 'site', 'site', { label: 'permaphemera.at' }, amounts)
      const record = recordOf(index, path)
      if (record) recordRows(l.w, record, amounts)
      else bump(l.w, 'page', path, { label: path, path }, amounts)
      visitorRows(l.w, l.s, amounts)
      if (l.r && !/(^|\.)permaphemera\.at$/.test(l.r)) bump(l.w, 'referrer', l.r, { label: l.r }, amounts)
    } else if (l.t === 'o') {
      const amounts = { tours: Number(l.n) || 0, session: l.s }
      bump(l.w, 'site', 'site', { label: 'permaphemera.at' }, amounts)
      const record = index.byTour.get(l.tour)
      if (record) recordRows(l.w, record, amounts)
      else bump(l.w, 'page', `/media/tours/${l.tour}/`, { label: `/media/tours/${l.tour}/`, path: `/media/tours/${l.tour}/` }, amounts)
      visitorRows(l.w, l.s, amounts)
    }
  }
  return [...rows.values()].map(({ sessions: set, ...row }) => ({ ...row, visitors: set.size }))
}

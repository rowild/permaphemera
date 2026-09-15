async function main() {
  const { loadArchiveFromDirectus, directusUrl } = await import('./lib/archive-source.mjs')
  const a = await loadArchiveFromDirectus()

  const locations = a.locations, venues = a.venues, persons = a.persons, roles = a.roles, personRoles = a.personRoles
  const exhibitions = a.exhibitions, participations = a.participations, statements = a.statements, sponsors = a.sponsors
  const navigations = a.navigations, navigationItems = a.navigationItems
  const junctions = [a.exhibitionsVenues, a.exhibitionsSponsors, a.personsVenues, a.personsSponsors, a.locationsSponsors, a.sponsorsVenues]

  const ids = (records) => new Set(records.map((record) => record.id))
  const locationIds = ids(locations), venueIds = ids(venues), personIds = ids(persons), roleIds = ids(roles)
  const exhibitionIds = ids(exhibitions), navigationIds = ids(navigations), itemIds = ids(navigationItems)
  const roleArtist = roles.find((role) => role.slug === 'artist')?.id

  const uniqueBy = (records, key) => new Set(records.map((record) => record[key])).size === records.length
  const en = (record) => (record.translations ?? []).find((entry) => entry.languages_code === 'en')
  const everyHasEnglish = (records) => records.every((record) => Boolean(en(record)))
  const validStatus = (records) => records.every((record) => ['draft', 'published', 'archived'].includes(record.status))
  const norm = (value) => (value === '' || value === undefined ? null : value)
  // English on the record must equal the `en` translation entry, field by field.
  const englishMirrors = (records, fields) => records.every((record) => {
    const entry = en(record) ?? {}
    return fields.every((field) => JSON.stringify(norm(record[field])) === JSON.stringify(norm(entry[field])))
  })
  const rolesOf = (personId) => new Set(personRoles.filter((row) => row.persons_id === personId).map((row) => row.roles_id))

  // Every image/hero_image/source_pdf/logo URL Directus returned must resolve
  // to a file it actually serves.
  const fileUrls = []
  for (const venue of venues) for (const field of ['image', 'hero_image']) if (venue[field]) fileUrls.push(venue[field])
  for (const exhibition of exhibitions) for (const field of ['image', 'source_pdf']) if (exhibition[field]) fileUrls.push(exhibition[field])
  for (const sponsor of sponsors) if (sponsor.logo) fileUrls.push(sponsor.logo)
  const fileChecks = await Promise.all(fileUrls.map(async (url) => {
    const id = url.split('/assets/')[1]
    const response = await fetch(`${directusUrl}/assets/${id}`, { method: 'HEAD' })
    return response.ok
  }))

  const checks = [
    ['locations count is 17', locations.length === 17],
    ['venues count is 36', venues.length === 36],
    ['persons count is 73', persons.length === 73],
    ['roles are artist and curator', roles.map((role) => role.slug).sort().join(',') === 'artist,curator'],
    ['exhibitions count is 13', exhibitions.length === 13],
    ['participations count is 15', participations.length === 15],
    ['sponsors count is 8', sponsors.length === 8],
    ['navigations are main and footer', navigations.map((nav) => nav.key).sort().join(',') === 'footer,main'],
    ['navigation items count is 18', navigationItems.length === 18],

    ['every location has coordinates inside Austria', locations.every((location) =>
      location.latitude > 46 && location.latitude < 49 && location.longitude > 9 && location.longitude < 17)],

    ['venue.location all resolve', venues.every((venue) => locationIds.has(venue.location))],
    ['exhibition.primary_venue all resolve', exhibitions.every((exhibition) => venueIds.has(exhibition.primary_venue))],
    ['participation.exhibition all resolve', participations.every((row) => exhibitionIds.has(row.exhibition))],
    ['participation.person all resolve', participations.every((row) => personIds.has(row.person))],
    ['participation.role all resolve', participations.every((row) => roleIds.has(row.role))],
    ['participation role is one of the person\'s roles', participations.every((row) => rolesOf(row.person).has(row.role))],
    ['every person has at least one role', persons.every((person) => rolesOf(person.id).size > 0)],
    ['person-role rows resolve both ends', personRoles.every((row) => personIds.has(row.persons_id) && roleIds.has(row.roles_id))],
    ['every exhibition has at least one artist participation', exhibitions.every((exhibition) =>
      participations.some((row) => row.exhibition === exhibition.id && row.role === roleArtist))],
    ['statement.exhibition all resolve', statements.every((row) => exhibitionIds.has(row.exhibition))],
    ['statement.person all resolve', statements.every((row) => personIds.has(row.person))],
    ['every statement is by a participant of that exhibition', statements.every((row) =>
      participations.some((link) => link.exhibition === row.exhibition && link.person === row.person))],
    ['statement ids unique', uniqueBy(statements, 'id')],
    ['participation ids unique', uniqueBy(participations, 'id')],
    ['empty junctions are arrays', junctions.every(Array.isArray)],

    ['navigation item.navigation all resolve', navigationItems.every((item) => navigationIds.has(item.navigation))],
    ['navigation item.parent resolves and stays in the same navigation', navigationItems.every((item) => {
      if (item.parent === null) return true
      const parent = navigationItems.find((candidate) => candidate.id === item.parent)
      return Boolean(parent) && parent.navigation === item.navigation
    })],
    ['navigation item keys unique per navigation', navigations.every((nav) =>
      uniqueBy(navigationItems.filter((item) => item.navigation === nav.id), 'key'))],
    ['navigation item kind matches its path/url', navigationItems.every((item) => {
      if (item.kind === 'url') return typeof item.url === 'string' && item.url.length > 0 && item.path === null
      if (item.kind === 'action') return typeof item.path === 'string' && item.path.length > 0 && item.url === null
      if (item.kind !== 'route' || item.url !== null) return false
      // A route with no path is a group heading: only valid if some item names it as parent.
      if (item.path === null) return navigationItems.some((other) => other.parent === item.id)
      return item.path.startsWith('/')
    })],
    ['navigation item ids unique', itemIds.size === navigationItems.length],
    ['footer navigation has exactly the groups explore, information, legal', navigationItems
      .filter((item) => item.navigation === navigations.find((nav) => nav.key === 'footer')?.id && item.parent === null)
      .map((item) => item.key).sort().join(',') === ['explore', 'information', 'legal'].sort().join(',')],
    ['main navigation keys match the header active-state union', navigationItems
      .filter((item) => item.navigation === navigations.find((nav) => nav.key === 'main')?.id && item.parent === null)
      .map((item) => item.key).sort().join(',') === ['about', 'artists', 'exhibitions', 'galleries'].sort().join(',')],

    ['every venue has a known type', venues.every((venue) =>
      ['gallery', 'museum', 'kunsthalle', 'art_cafe', 'open_air', 'forum'].includes(venue.type))],

    ['location slugs unique', uniqueBy(locations, 'slug')],
    ['venue slugs unique', uniqueBy(venues, 'slug')],
    ['person slugs unique', uniqueBy(persons, 'slug')],
    ['exhibition slugs unique', uniqueBy(exhibitions, 'slug')],
    ['sponsor slugs unique', uniqueBy(sponsors, 'slug')],

    ['every location has an en translation', everyHasEnglish(locations)],
    ['every venue has an en translation', everyHasEnglish(venues)],
    ['every exhibition has an en translation', everyHasEnglish(exhibitions)],
    ['every role has an en translation', everyHasEnglish(roles)],
    ['every sponsor has an en translation', everyHasEnglish(sponsors)],
    ['every navigation item has an en translation', everyHasEnglish(navigationItems)],
    ['persons carry no translations', persons.every((person) => person.translations === undefined)],

    ['locations: English on the record equals the en entry', englishMirrors(locations, ['description'])],
    ['venues: English on the record equals the en entry', englishMirrors(venues, ['description', 'lede', 'about', 'image_caption', 'coordinate_label'])],
    ['exhibitions: English on the record equals the en entry', englishMirrors(exhibitions, ['title', 'summary', 'description', 'date_range', 'opening_hours', 'vernissage', 'image_alt', 'medium'])],
    ['statements: English on the record equals the en entry', englishMirrors(statements, ['prompt', 'statement'])],
    ['roles: English on the record equals the en entry', englishMirrors(roles, ['title'])],
    ['sponsors: English on the record equals the en entry', englishMirrors(sponsors, ['description'])],
    ['every published sponsor has a logo', sponsors.filter((s) => s.status === 'published').every((s) => typeof s.logo === 'string' && s.logo.length > 0)],
    ['navigation items: English on the record equals the en entry', englishMirrors(navigationItems, ['title'])],

    ['all collections have a valid status', [locations, venues, persons, roles, exhibitions, participations, statements, sponsors, navigations, navigationItems].every(validStatus)],
    ['no person keeps dropped fields', persons.every((person) => ['biography', 'birth_year', 'death_year', 'nationality', 'instagram_handle', 'profile_image', 'artist_name', 'record_count'].every((field) => person[field] === undefined))],
    ['no exhibition keeps a manual featured flag', exhibitions.every((exhibition) => exhibition.featured === undefined)],
    ['no old key survives', [...venues, ...exhibitions, ...participations, ...statements].every((record) =>
      ['location_id', 'primary_venue_id', 'exhibition_id', 'artist_id', 'name', 'city_name'].every((key) => record[key] === undefined))],

    [`every file field points at a file Directus serves (${fileUrls.length} checked)`, fileChecks.every(Boolean)]
  ]

  const failures = checks.filter(([, passed]) => !passed)
  if (failures.length) {
    console.error('Data integrity failed:')
    for (const [label] of failures) console.error(`  - ${label}`)
    process.exitCode = 1
  } else {
    console.log(`Data integrity OK: ${checks.length} assertions across 17 collections from ${directusUrl}.`)
  }
}

try {
  await main()
} catch (error) {
  if (error.message.startsWith('Directus not reachable')) {
    console.error(error.message)
  } else {
    console.error(error)
  }
  process.exitCode = 1
}

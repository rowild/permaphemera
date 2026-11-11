// directus/scripts/import-order.mjs
// The order in which import.mjs restores the collections: every collection after the ones it
// points to (import-order.test.mjs checks both, against the schema). Until 2026-11-04 the list
// lacked organisations, quotes, news and six junctions, so a restore silently dropped them.
export const IMPORT_ORDER = [
  // Entities, each after the ones it points to.
  'pp_locations', 'pp_venues', 'pp_persons', 'pp_roles', 'pp_websites', 'pp_events', 'pp_event_editions', 'pp_exhibitions', 'pp_sponsors',
  'pp_organisations', 'pp_quotes', 'pp_news', 'pp_navigations', 'pp_navigation_items',
  // The weekly Umami sums (2026-11-11): kept for good, so a restore must bring them back too.
  'pp_stats_weekly',
  // Child rows without status.
  'pp_exhibition_participations', 'pp_exhibition_statements', 'pp_exhibition_organisers',
  'pp_organisation_memberships', 'pp_organisation_venue_relations', 'pp_event_organisers',
  // Junctions.
  'pp_mm__persons_roles', 'pp_mm__exhibitions_venues', 'pp_mm__exhibitions_sponsors', 'pp_mm__persons_venues',
  'pp_mm__persons_sponsors', 'pp_mm__locations_sponsors', 'pp_mm__sponsors_venues', 'pp_mm__exhibitions_websites',
  'pp_mm__persons_websites', 'pp_mm__organisations_websites', 'pp_mm__venues_websites', 'pp_mm__exhibitions_news',
  'pp_mm__news_venues', 'pp_mm__news_persons', 'pp_mm__news_organisations', 'pp_mm__news_sponsors',
  'pp_mm__events_websites', 'pp_mm__events_news'
]

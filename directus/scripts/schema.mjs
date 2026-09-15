// directus/scripts/schema.mjs
// The PERMAPHEMERA schema as data. Names of junction tables, translation tables
// and FK columns are never written here; naming.mjs derives them.
import { bool, date, dropdown, file, float, jsonArray, m2o, markdown, str, text } from './fields.mjs'

export const COLOR = '#a6523c'
export const SCHEMA_VERSION = '2026-09-15.2'
export const ROOT_FOLDER = 'archive'
export const ROOT_LABEL = 'PERMAPHEMERA'

export const section = (key, label, fields, opts = {}) => ({ key, label, fields, ...opts })
export const content = (fields) => section('content', 'Content', fields, { detail: true, start: 'open' })

const PERSON = '{{first_name}} {{last_name}}'

export const entities = {
  locations: {
    kind: 'main', icon: 'location_city', sort: 4, labels: ['Locations', 'Location', 'Locations'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'The geographic place: a town. Venues stand in a location. Exhibition → venue → location is one chain; there is no direct exhibition → location link on purpose.',
    fields: [
      str('title', { required: true, note: 'City or town name.' }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
      str('postal_code', { width: 'half' }),
      str('state', { width: 'half' }),
      str('country', { width: 'half' }),
      float('latitude', { required: true, note: 'Town-centre approximation. Two floats, because SQLite has no geometry type.' }),
      float('longitude', { required: true }),
      text('description', { translated: true }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'slug']),
      section('address', 'Address', ['postal_code', 'state', 'country', 'latitude', 'longitude']),
      section('relations', 'Relations', ['venues', 'sponsors']),
      content(['description']),
    ],
  },

  venues: {
    kind: 'main', icon: 'museum', sort: 2, labels: ['Venues', 'Venue', 'Venues'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'The building an exhibition happens in.',
    fields: [
      str('title', { required: true }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
      m2o('location', 'locations', { oneField: 'venues', oneTemplate: '{{title}}' }),
      m2o('part_of', 'venues', { template: '{{title}}', oneField: 'spaces', oneTemplate: '{{title}}', note: 'The venue this space belongs to organisationally, e.g. Alpen-Adria-Galerie → Stadtgalerie Klagenfurt. Empty for independent venues.' }),
      dropdown('type', ['gallery', 'museum', 'kunsthalle', 'art_cafe', 'open_air', 'forum'], { default: 'gallery', allowOther: true }),
      str('address'),
      str('website_url', { width: 'half' }),
      float('latitude', { note: 'Optional exact building pin.' }),
      float('longitude'),
      file('image', { image: true }),
      str('image_alt', { width: 'half' }),
      file('hero_image', { image: true }),
      str('hero_image_alt', { width: 'half' }),
      str('archive_number', { width: 'half', note: 'Two-digit display number, e.g. 01.' }),
      bool('featured', { note: 'Curated landing-page highlight.' }),
      text('description', { translated: true }),
      str('lede', { translated: true, note: 'One-line teaser under the venue title.' }),
      jsonArray('about', { translated: true, note: 'JSON array of paragraph strings.' }),
      str('image_caption', { translated: true }),
      str('coordinate_label', { translated: true, note: 'Human-readable DMS readout.' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'slug', 'type', 'location', 'part_of', 'featured', 'archive_number']),
      section('address', 'Address', ['address', 'website_url', 'latitude', 'longitude', 'coordinate_label']),
      section('images', 'Images', ['image', 'image_alt', 'hero_image', 'hero_image_alt', 'image_caption']),
      section('relations', 'Relations', ['spaces', 'exhibitions', 'further_exhibitions', 'persons', 'sponsors']),
      content(['lede', 'about', 'description']),
    ],
  },

  persons: {
    kind: 'main', icon: 'person', sort: 3, labels: ['Persons', 'Person', 'Persons'],
    display: ['first_name', 'last_name'], displayTemplate: PERSON, statusWidth: 'full',
    note: 'People and collectives: artists, curators. The site shows a name, their links (see websites) and their statements. Nothing else, by decision of 2026-09-14.',
    fields: [
      str('first_name', { width: 'half' }),
      str('last_name', { width: 'half' }),
      str('middle_initial', { width: 'half' }),
      str('display_name', { width: 'full', note: 'Pseudonym or collective name. Shown instead of first + last when set.' }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'first_name', 'last_name', 'middle_initial', 'display_name', 'slug', 'roles']),
      section('links', 'Links', ['websites']),
      section('relations', 'Relations', ['participations', 'venues', 'sponsors']),
    ],
  },

  roles: {
    kind: 'main', icon: 'badge', sort: 6, labels: ['Roles', 'Role', 'Roles'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'What a person can be on a show: artist, curator, … Vocabulary table; add rows, not columns.',
    fields: [
      str('title', { required: true, translated: true }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'slug']),
      section('relations', 'Relations', ['persons']),
    ],
  },

  exhibitions: {
    kind: 'main', icon: 'auto_awesome', sort: 1, labels: ['Exhibitions', 'Exhibition', 'Exhibitions'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'The show. Highlighting on the site is derived from dates and never stored.',
    fields: [
      str('title', { required: true, translated: true }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
      m2o('primary_venue', 'venues', { oneField: 'exhibitions', oneTemplate: '{{title}}' }),
      date('start_date', { required: true }),
      date('end_date', { required: true }),
      bool('is_permanent'),
      file('image', { image: true }),
      str('image_alt', { width: 'half', translated: true }),
      str('summary', { translated: true, note: 'One-line teaser.' }),
      markdown('description', { translated: true, note: 'Curatorial statement.' }),
      str('date_range', { width: 'half', translated: true, note: 'Display form of the dates.' }),
      str('opening_hours', { width: 'half', translated: true }),
      str('vernissage', { width: 'half', translated: true }),
      str('medium', { width: 'half', translated: true }),
      file('source_pdf', { note: 'The invitation or press sheet the record was derived from.' }),
      str('tour', { note: 'Root-relative folder of the exported 360° tour, e.g. /media/tours/<id>/. Empty while none is published.' }),
      dropdown('tour_status', ['available', 'restricted', 'unavailable'], { default: 'unavailable' }),
      date('tour_available_from', { note: 'Usually the day after the analog show closes. Empty means at once.' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'slug', 'primary_venue']),
      section('dates', 'Dates', ['start_date', 'end_date', 'is_permanent', 'date_range', 'opening_hours', 'vernissage']),
      section('media', 'Media', ['image', 'image_alt', 'source_pdf', 'medium']),
      section('tour', 'Tour', ['tour', 'tour_status', 'tour_available_from']),
      section('relations', 'Relations', ['participations', 'statements', 'websites', 'further_venues', 'sponsors']),
      content(['summary', 'description']),
    ],
  },

  exhibition_participations: {
    kind: 'child', host: 'exhibitions', hostField: 'exhibition', hostAlias: 'participations',
    hostAliasTemplate: '{{person.first_name}} {{person.last_name}} · {{role.title}}',
    icon: 'group', sort: 1, labels: ['Exhibition Participations', 'Exhibition Participation', 'Exhibition Participations'],
    display: ['person', 'role'], displayTemplate: '{{person.first_name}} {{person.last_name}} · {{role.title}}',
    note: 'One person in one function on one show. A person who both makes and curates a show has two rows. The role must be one of the person\'s roles.',
    fields: [
      m2o('person', 'persons', { template: PERSON, oneField: 'participations', oneTemplate: '{{exhibition.title}} · {{role.title}}' }),
      m2o('role', 'roles', { template: '{{title}}' }),
    ],
    layout: { flat: ['status', 'exhibition', 'person', 'role'] },
  },

  exhibition_statements: {
    kind: 'child', host: 'exhibitions', hostField: 'exhibition', hostAlias: 'statements',
    hostAliasTemplate: '{{person.first_name}} {{person.last_name}}: {{prompt}}',
    icon: 'format_quote', sort: 2, labels: ['Exhibition Statements', 'Exhibition Statement', 'Exhibition Statements'],
    display: ['prompt'], displayTemplate: '{{person.first_name}} {{person.last_name}}: {{prompt}}',
    note: "An artist's words about one show.",
    fields: [
      m2o('person', 'persons', { template: PERSON }),
      str('prompt', { translated: true, note: 'The question asked, e.g. "How did you approach the room?"' }),
      text('statement', { translated: true }),
    ],
    layout: { flat: ['status', 'exhibition', 'person', 'prompt', 'statement'] },
  },

  sponsors: {
    kind: 'main', icon: 'handshake', sort: 5, labels: ['Sponsors', 'Sponsor', 'Sponsors'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'Supporters and partners. Linked to what they support.',
    fields: [
      str('title', { required: true }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
      str('website_url', { width: 'half' }),
      file('logo', { image: true }),
      text('description', { translated: true }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'slug', 'website_url', 'logo']),
      section('relations', 'Relations', ['venues', 'exhibitions', 'persons', 'locations']),
      content(['description']),
    ],
  },

  websites: {
    kind: 'main', icon: 'link', sort: 8, labels: ['Websites', 'Website', 'Websites'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'One external link: an artist site, an exhibition page, a press sheet, a social profile. Persons and exhibitions link to as many as they need.',
    fields: [
      str('title', { required: true, translated: true, note: 'Link text the site shows, e.g. "Exhibition page at stadtgalerie.net".' }),
      str('url', { required: true, note: 'Absolute URL including https://.' }),
      dropdown('kind', ['website', 'exhibition_page', 'press', 'document', 'social'], { default: 'website', allowOther: true }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'url', 'kind']),
      section('relations', 'Relations', ['exhibitions', 'persons']),
    ],
  },

  navigations: {
    kind: 'main', icon: 'menu', sort: 7, labels: ['Navigations', 'Navigation', 'Navigations'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'One row per menu: main, footer.',
    fields: [
      str('title', { required: true, note: 'Admin label, e.g. "Main navigation".' }),
      str('key', { required: true, unique: true, width: 'half', note: 'Stable identifier the frontend reads: main, footer.' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'key']),
      section('relations', 'Relations', ['items']),
    ],
  },

  navigation_items: {
    kind: 'child', host: 'navigations', hostField: 'navigation', hostAlias: 'items', hostAliasTemplate: '{{title}}',
    icon: 'link', sort: 1, labels: ['Navigation Items', 'Navigation Item', 'Navigation Items'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'One menu entry. A parent item with an empty path renders as a group heading.',
    fields: [
      m2o('parent', 'navigation_items', { template: '{{title}}', oneField: 'children', oneTemplate: '{{title}}' }),
      str('key', { required: true, width: 'half', note: 'Stable identifier, unique within one navigation.' }),
      str('title', { required: true, translated: true, width: 'half' }),
      dropdown('kind', ['route', 'url', 'action'], { default: 'route' }),
      str('path', { width: 'half', note: 'Locale-neutral route like /exhibitions/, or the action name for kind=action.' }),
      str('url', { width: 'half', note: 'External link for kind=url.' }),
      dropdown('target', ['_self', '_blank'], { default: '_self' }),
    ],
    layout: { flat: ['status', 'navigation', 'parent', 'key', 'title', 'kind', 'path', 'url', 'target', 'children'] },
  },
}

// Many-to-many links. Table names come from mmTable(a, b); FK columns from fk().
// `owner` = sidebar parent. `sortedFrom` = the side whose list order the junction's
// `sort` column stores (conventions §2 rule 4: one side only → the column is `sort`).
export const junctions = [
  { a: 'exhibitions', b: 'venues', aliasA: 'further_venues', aliasB: 'further_exhibitions', owner: 'exhibitions', sortedFrom: 'exhibitions', note: 'Further venues of a travelling show; primary_venue stays the main one.' },
  { a: 'exhibitions', b: 'sponsors', aliasA: 'sponsors', aliasB: 'exhibitions', owner: 'sponsors', sortedFrom: 'exhibitions' },
  { a: 'persons', b: 'roles', aliasA: 'roles', aliasB: 'persons', owner: 'persons', sortedFrom: 'persons', note: 'What a person can be. A participation role must be one of these.' },
  { a: 'persons', b: 'venues', aliasA: 'venues', aliasB: 'persons', owner: 'persons', sortedFrom: 'venues', note: 'The venue represents or works with the person. Not derived from exhibitions.' },
  { a: 'persons', b: 'sponsors', aliasA: 'sponsors', aliasB: 'persons', owner: 'sponsors', sortedFrom: 'persons' },
  { a: 'locations', b: 'sponsors', aliasA: 'sponsors', aliasB: 'locations', owner: 'sponsors', sortedFrom: 'locations' },
  { a: 'sponsors', b: 'venues', aliasA: 'venues', aliasB: 'sponsors', owner: 'sponsors', sortedFrom: 'venues' },
  { a: 'exhibitions', b: 'websites', aliasA: 'websites', aliasB: 'exhibitions', owner: 'websites', sortedFrom: 'exhibitions', note: 'External links of a show: its page on the venue site, press sheets, documents.' },
  { a: 'persons', b: 'websites', aliasA: 'websites', aliasB: 'persons', owner: 'websites', sortedFrom: 'persons', note: 'The links of a person. Replaced the single website_url column on 2026-09-15.' },
]

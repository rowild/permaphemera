import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const readJson = async (path) => JSON.parse(await readText(path))

const [
  cityLocations,
  galleries,
  exhibitions,
  galleriesIndex,
  galleryDetail,
  galleryCard,
  exhibitionsIndex,
  exhibitionDetail,
  exhibitionCard,
  landingExhibitionCard,
  relatedExhibitionCard,
  englishMessages,
  germanMessages,
  mainCss,
  header,
  footerMenu
] = await Promise.all([
  readJson('app/data/pp_locations.json'),
  readJson('app/data/pp_venues.json'),
  readJson('app/data/pp_exhibitions.json'),
  readText('app/pages/venues/index.vue'),
  readText('app/pages/venues/[slug].vue'),
  readText('app/components/GalleryDirectoryCard.vue'),
  readText('app/pages/exhibitions/index.vue'),
  readText('app/pages/exhibitions/[slug].vue'),
  readText('app/components/ExhibitionDirectoryCard.vue'),
  readText('app/components/LandingExhibitionCard.vue'),
  readText('app/components/RelatedExhibitionCard.vue'),
  readJson('i18n/locales/en.json'),
  readJson('i18n/locales/de.json'),
  readText('app/assets/css/main.css'),
  readText('app/components/ArchiveHeader.vue'),
  readText('app/components/ArchiveFooterMenu.vue')
])

// `pp_locations.json` holds the 17 cities; galleries live in `pp_venues.json`
// and reach their city fields (state, country, postal code) through
// `location`.
const cityById = new Map(cityLocations.map((city) => [city.id, city]))
const cityOf = (gallery) => {
  const city = cityById.get(gallery.location)
  assert(city, `${gallery.id} references unknown location ${gallery.location}.`)
  return city
}

assert.equal(galleries.length, 36, 'The gallery directory must contain Parkschlössl plus 35 additional galleries.')
assert.equal(new Set(galleries.map(({ id }) => id)).size, galleries.length, 'Gallery IDs must be unique.')
assert.equal(new Set(galleries.map(({ slug }) => slug)).size, galleries.length, 'Gallery slugs must be unique.')
assert.equal(new Set(galleries.map((gallery) => cityOf(gallery).state)).size, 9, 'The gallery directory must represent all nine Austrian federal states.')
assert(galleries.every((gallery) => cityOf(gallery).country === 'Austria'), 'Every gallery must be in Austria.')
assert(galleries.some(({ slug, featured }) => slug === 'parkschloessl-spittal-drau' && featured), 'Parkschlössl must remain the featured pilot gallery.')

for (const gallery of galleries) {
  for (const field of ['id', 'slug', 'title', 'image']) {
    assert(gallery[field], `${gallery.id} is missing required gallery field ${field}.`)
  }

  const city = cityOf(gallery)
  for (const field of ['title', 'postal_code', 'state', 'country']) {
    assert(city[field], `${gallery.id} is missing required city field ${field} via location ${city.id}.`)
  }

  // `address`, `image_alt` and `archive_number` are blank on the ten promoted
  // venues merged in from the old exhibitions/orphan-gallery data: no source
  // text existed to fill them (see task-2-report.md), so they stay empty
  // stubs on purpose rather than invented. Only the one published gallery
  // (Parkschlössl today; more as venues graduate from draft) must carry them.
  if (gallery.status === 'published') {
    for (const field of ['address', 'image_alt', 'archive_number']) {
      assert(gallery[field], `${gallery.id} is published and must carry required gallery field ${field}.`)
    }
  }

  // German dossier text is not required per gallery (the same ten promoted
  // venues have none to carry over), but every gallery must at least resolve
  // in English.
  const languages = new Set(gallery.translations?.map(({ languages_code }) => languages_code))
  assert(languages.has('en'), `${gallery.id} must have an English description.`)
}

assert.match(galleriesIndex, /<ArchiveSearchForm/, 'The galleries index must use the shared search form.')
assert.match(galleriesIndex, /<GalleryDirectoryCard[\s\S]*v-for=/, 'The galleries index must render reusable gallery cards.')
assert.match(galleriesIndex, /route\.query\.state/, 'The gallery state filter must be URL-backed.')
assert.match(galleryCard, /<VenueMaskedImage/, 'Gallery cards must use the shared generated media mask.')
assert.match(galleryCard, /<VenueCardFrame/, 'Gallery cards must use the shared generated cut-corner frame.')
assert.match(galleryDetail, /venues\.value\.find/, 'Gallery detail routes must resolve the canonical venues collection.')
assert.match(galleryDetail, /venueDossier/, 'Gallery detail routes must layer optional rich venue dossier data.')

assert(exhibitions.length > 0, 'The exhibitions directory needs routed exhibition records.')
assert.match(exhibitionsIndex, /<ArchiveSearchForm/, 'The exhibitions index must use the shared search form.')
assert.match(exhibitionsIndex, /<ExhibitionDirectoryCard[\s\S]*v-for=/, 'The exhibitions index must render reusable exhibition cards.')
assert.match(exhibitionsIndex, /right\.start_date\.localeCompare\(left\.start_date\)/, 'The exhibitions index must order records by newest start date first.')
assert.doesNotMatch(exhibitionsIndex, /left\.featured\s*\?\s*-1\s*:\s*1/, 'Featured status must not override the chronological exhibition order.')
assert.match(exhibitionsIndex, /selectFeaturedExhibition\(orderedExhibitions\.value, archiveToday\.value\)/, 'The exhibitions index must derive its highlighted record from the current local date.')
assert.match(exhibitionsIndex, /:featured="exhibition\.id === featuredExhibition\?\.id"/, 'Only the date-derived exhibition may receive the highlighted card treatment.')
assert.match(exhibitionCard, /<ExhibitionFrameCard/, 'Exhibition cards must use the shared generated cut-corner frame.')
assert.match(exhibitionCard, /\$t\('cards\.openExhibition'\)/, 'Every exhibition-directory card must use the shared Visit Exhibition label.')
assert.doesNotMatch(exhibitionCard, /\$t\('common\.open'\)/, 'Exhibition-directory cards must not use the generic Open label.')
assert.match(landingExhibitionCard, /\[ record-card-action \][^\n]*items-center justify-center/, 'Landing exhibition actions must stay centered over their images.')
assert.match(landingExhibitionCard, /\$t\('cards\.openExhibition'\)/, 'Landing exhibition actions must use the shared exhibition label.')
assert.match(landingExhibitionCard, /transition-colors[^\n]*group-hover\/exhibition:text-archive-red[^\n]*group-focus-visible\/exhibition:text-archive-red/, 'Landing exhibition actions must animate to archive red on hover and keyboard focus.')
assert.match(landingExhibitionCard, /archive-record-open-action[^\n]*text-sm[^\n]*opacity-90/, 'Landing exhibition actions must use the dedicated compact frame without reducing their label size.')
assert.match(mainCss, /\.archive-record-open-action\s*\{[^}]*width: min\(9\.75rem, calc\(100% - 2rem\)\);[^}]*min-height: 2\.75rem;[^}]*padding-inline: 0\.1875rem;[^}]*border-width: 0\.5rem;/s, 'Landing exhibition actions must keep a small, genuinely inset frame with minimal padding.')
assert.match(landingExhibitionCard, /ref="recordTitleViewport"[^>]*overflow-hidden/, 'Landing exhibition titles must stay on one clipped line.')
assert.match(landingExhibitionCard, /ref="recordTitleViewport"[^>]*overflow-hidden[^>]*pb-0\.5/, 'Landing exhibition title viewports must reserve two pixels for font descenders.')
assert.match(landingExhibitionCard, /archive-record-title-marquee/, 'Overflowing landing exhibition titles must use the measured marquee treatment.')
assert.match(landingExhibitionCard, /ResizeObserver/, 'Landing exhibition title overflow must respond to live card width.')
assert.match(landingExhibitionCard, /<ArchiveTooltipFrame[\s\S]*?\[ record-title-tooltip \]/, 'Overflowing landing exhibition titles must use the shared custom archival tooltip frame.')
assert.match(landingExhibitionCard, /\[ record-location-line \][^\n]*leading-\[1\.15\][^\n]*compact:leading-\[1\.05\]/, 'Landing exhibition locations must use compact desktop and mobile metadata line-heights.')
assert.match(mainCss, /@keyframes archive-record-title-scroll[\s\S]*\.archive-record-title-marquee/, 'The landing exhibition title marquee animation must be globally defined.')
assert.match(relatedExhibitionCard, /<ExhibitionFrameCard/, 'Related exhibition cards must use the shared generated cut-corner frame.')
assert.match(relatedExhibitionCard, /\$t\('cards\.openExhibition'\)/, 'Related exhibition cards must use the shared exhibition label.')
assert.equal(englishMessages.cards.openExhibition, 'Visit Exhibition', 'English exhibition actions must use the requested label.')
assert.equal(germanMessages.cards.openExhibition, 'Ausstellung besuchen', 'German exhibition actions must use the equivalent localized label.')
assert.equal(englishMessages.cards.enterExhibition, 'Visit Exhibition', 'The featured exhibition action must use the requested English label.')
assert.equal(germanMessages.cards.enterExhibition, 'Ausstellung besuchen', 'The featured exhibition action must use the equivalent localized label.')
assert(![exhibitionCard, landingExhibitionCard, relatedExhibitionCard].some((source) => /openRecord/.test(source)), 'Exhibition cards must not retain the old open-record action keys.')
assert.match(exhibitionDetail, /localePath\('\/exhibitions\/'\)/, 'Exhibition detail breadcrumbs must return to the exhibition index.')
assert.match(exhibitionDetail, /galleryPath/, 'Exhibition detail routes must derive their owning gallery route.')

const navigations = await readJson('app/data/pp_navigations.json')
const navigationItems = await readJson('app/data/pp_navigation_items.json')
const mainNavigationId = navigations.find((nav) => nav.key === 'main')?.id
const mainPaths = navigationItems.filter((item) => item.navigation === mainNavigationId).map((item) => item.path)
assert(mainPaths.includes('/venues/'), 'Gallery navigation must target the real gallery index.')
assert(mainPaths.includes('/exhibitions/'), 'Exhibition navigation must target the real exhibition index.')
for (const navigation of [header, footerMenu]) {
  assert.match(navigation, /useSiteNavigation\(\)/, 'Header and footer must render their links from the navigation data.')
}

console.log(`Directory routes are valid (${galleries.length} galleries across nine states; ${exhibitions.length} exhibition records).`)

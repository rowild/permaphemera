import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const readJson = async (path) => JSON.parse(await readText(path))

const [
  locations,
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
  readJson('app/data/locations.json'),
  readJson('app/data/location-exhibitions.json'),
  readText('app/pages/locations/index.vue'),
  readText('app/pages/locations/[slug].vue'),
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

assert.equal(locations.length, 26, 'The gallery directory must contain Parkschlössl plus 25 additional galleries.')
assert.equal(new Set(locations.map(({ id }) => id)).size, locations.length, 'Gallery IDs must be unique.')
assert.equal(new Set(locations.map(({ slug }) => slug)).size, locations.length, 'Gallery slugs must be unique.')
assert.equal(new Set(locations.map(({ state }) => state)).size, 9, 'The gallery directory must represent all nine Austrian federal states.')
assert(locations.every(({ country }) => country === 'Austria'), 'Every gallery must be in Austria.')
assert(locations.some(({ slug, featured }) => slug === 'parkschloessl-spittal-drau' && featured), 'Parkschlössl must remain the featured pilot gallery.')

for (const location of locations) {
  for (const field of ['id', 'slug', 'name', 'city_name', 'postal_code', 'state', 'country', 'address', 'image', 'image_alt', 'archive_number']) {
    assert(location[field], `${location.id} is missing required gallery field ${field}.`)
  }

  const languages = new Set(location.translations?.map(({ languages_code }) => languages_code))
  assert(languages.has('en') && languages.has('de'), `${location.id} must have English and German descriptions.`)
}

assert.match(galleriesIndex, /<ArchiveSearchForm/, 'The galleries index must use the shared search form.')
assert.match(galleriesIndex, /<GalleryDirectoryCard[\s\S]*v-for=/, 'The galleries index must render reusable gallery cards.')
assert.match(galleriesIndex, /route\.query\.state/, 'The gallery state filter must be URL-backed.')
assert.match(galleryCard, /<VenueMaskedImage/, 'Gallery cards must use the shared generated media mask.')
assert.match(galleryCard, /<VenueCardFrame/, 'Gallery cards must use the shared generated cut-corner frame.')
assert.match(galleryDetail, /locations\.value\.find/, 'Gallery detail routes must resolve the canonical locations collection.')
assert.match(galleryDetail, /venueDossier/, 'Gallery detail routes must layer optional rich venue dossier data.')

assert(exhibitions.length > 0, 'The exhibitions directory needs routed exhibition records.')
assert.match(exhibitionsIndex, /<ArchiveSearchForm/, 'The exhibitions index must use the shared search form.')
assert.match(exhibitionsIndex, /<ExhibitionDirectoryCard[\s\S]*v-for=/, 'The exhibitions index must render reusable exhibition cards.')
assert.match(exhibitionCard, /<ExhibitionFrameCard/, 'Exhibition cards must use the shared generated cut-corner frame.')
assert.match(landingExhibitionCard, /\[ record-card-action \][^\n]*items-center justify-center/, 'Landing exhibition actions must stay centered over their images.')
assert.match(landingExhibitionCard, /\$t\('cards\.openExhibition'\)/, 'Landing exhibition actions must use the shared exhibition label.')
assert.match(landingExhibitionCard, /transition-colors[^\n]*group-hover\/exhibition:text-archive-red[^\n]*group-focus-visible\/exhibition:text-archive-red/, 'Landing exhibition actions must animate to archive red on hover and keyboard focus.')
assert.match(landingExhibitionCard, /archive-record-open-action[^\n]*text-\[0\.86rem\][^\n]*opacity-90/, 'Landing exhibition actions must use the dedicated compact frame without reducing their label size.')
assert.match(mainCss, /\.archive-record-open-action\s*\{[^}]*width: min\(9\.75rem, calc\(100% - 2rem\)\);[^}]*min-height: 2\.75rem;[^}]*padding-inline: 0\.1875rem;[^}]*border-width: 0\.5rem;/s, 'Landing exhibition actions must keep a small, genuinely inset frame with minimal padding.')
assert.match(landingExhibitionCard, /ref="recordTitleViewport"[^>]*overflow-hidden/, 'Landing exhibition titles must stay on one clipped line.')
assert.match(landingExhibitionCard, /archive-record-title-marquee/, 'Overflowing landing exhibition titles must use the measured marquee treatment.')
assert.match(landingExhibitionCard, /ResizeObserver/, 'Landing exhibition title overflow must respond to live card width.')
assert.match(landingExhibitionCard, /\[ record-title-tooltip \][^\n]*archive-record-title-tooltip/, 'Overflowing landing exhibition titles must expose the custom archival tooltip.')
assert.match(landingExhibitionCard, /\[ record-location-line \][^\n]*leading-\[1\.15\][^\n]*compact:leading-\[1\.05\]/, 'Landing exhibition locations must use compact desktop and mobile metadata line-heights.')
assert.match(mainCss, /@keyframes archive-record-title-scroll[\s\S]*\.archive-record-title-marquee/, 'The landing exhibition title marquee animation must be globally defined.')
assert.match(relatedExhibitionCard, /<ExhibitionFrameCard/, 'Related exhibition cards must use the shared generated cut-corner frame.')
assert.match(relatedExhibitionCard, /\$t\('cards\.openExhibition'\)/, 'Related exhibition cards must use the shared exhibition label.')
assert.equal(englishMessages.cards.openExhibition, 'Open Exhibition', 'English exhibition actions must use the requested label.')
assert.equal(germanMessages.cards.openExhibition, 'Ausstellung öffnen', 'German exhibition actions must use the equivalent localized label.')
assert.equal(englishMessages.cards.enterExhibition, 'Enter Exhibition', 'The featured exhibition action must use the requested English label.')
assert.equal(germanMessages.cards.enterExhibition, 'Ausstellung betreten', 'The featured exhibition action must use the equivalent localized label.')
assert(![exhibitionCard, landingExhibitionCard, relatedExhibitionCard].some((source) => /openRecord/.test(source)), 'Exhibition cards must not retain the old open-record action keys.')
assert.match(exhibitionDetail, /localePath\('\/exhibitions\/'\)/, 'Exhibition detail breadcrumbs must return to the exhibition index.')
assert.match(exhibitionDetail, /galleryPath/, 'Exhibition detail routes must derive their owning gallery route.')

for (const navigation of [header, footerMenu]) {
  assert.match(navigation, /localePath\('\/locations\/'\)/, 'Gallery navigation must target the real gallery index.')
  assert.match(navigation, /localePath\('\/exhibitions\/'\)/, 'Exhibition navigation must target the real exhibition index.')
}

console.log(`Directory routes are valid (${locations.length} galleries across nine states; ${exhibitions.length} exhibition records).`)

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
assert.match(exhibitionDetail, /localePath\('\/exhibitions\/'\)/, 'Exhibition detail breadcrumbs must return to the exhibition index.')
assert.match(exhibitionDetail, /galleryPath/, 'Exhibition detail routes must derive their owning gallery route.')

for (const navigation of [header, footerMenu]) {
  assert.match(navigation, /localePath\('\/locations\/'\)/, 'Gallery navigation must target the real gallery index.')
  assert.match(navigation, /localePath\('\/exhibitions\/'\)/, 'Exhibition navigation must target the real exhibition index.')
}

console.log(`Directory routes are valid (${locations.length} galleries across nine states; ${exhibitions.length} exhibition records).`)

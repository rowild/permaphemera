// scripts/check-conventions.mjs — the code conventions of the site that a test of behaviour cannot
// see (offline, fast; part of `pnpm verify`). Behaviour lives in test/unit, test/nuxt and
// test/e2e; data facts in check-data-integrity; class names are never pinned here.
import { readdir, readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const vueFiles = async (dir) => (await readdir(new URL(`../${dir}`, import.meta.url), { recursive: true })).filter((file) => file.endsWith('.vue')).map((file) => `${dir}/${file}`)
const pages = await vueFiles('app/pages')
const components = await vueFiles('app/components')
const source = Object.fromEntries(await Promise.all([...pages, ...components, 'app/app.vue', 'app/error.vue', 'app/layouts/default.vue', 'app/composables/useRecordBySlug.ts'].map(async (file) => [file, await read(file)])))

const failures = []
const check = (label, ok) => { if (!ok) failures.push(label) }

// SEO: every page applies its entry from shared/seo.mjs (the same one the deploy snapshots); a page
// that set its own meta would contradict its snapshot. Pages that only redirect or only answer 404
// never render.
for (const file of pages) {
  const text = source[file]
  const rendersNothing = /definePageMeta\(\{\s*redirect:/.test(text) || file.endsWith('[...slug].vue') && !file.includes('locations')
  check(`${file} calls usePageSeo()`, rendersNothing || /usePageSeo\(/.test(text) || /<ExhibitionGroupPage/.test(text))
}
for (const file of [...pages, ...components]) check(`${file} sets no meta of its own (useSeoMeta); usePageSeo does`, !/useSeoMeta\(/.test(source[file]))

// A browser-only app: an unknown slug must throw a *fatal* 404 during setup, and the page must
// render nothing until its record exists.
check('useRecordBySlug throws a fatal 404', /createError\(\{ statusCode: 404, statusMessage: [^}]*, fatal: true \}\)/.test(source['app/composables/useRecordBySlug.ts']))
for (const name of ['exhibitions', 'venues', 'persons', 'organisations', 'sponsors', 'news', 'events']) {
  const text = source[`app/pages/${name}/[slug].vue`]
  check(`${name}/[slug].vue finds its record with useRecordBySlug`, /useRecordBySlug\(/.test(text))
  check(`${name}/[slug].vue guards its template with v-if on the record`, /<template>\s*<(div|main) v-if="/.test(text))
}

// Frames: overflow-clip, never overflow-hidden (hidden makes a scroll box; the sticky header breaks).
for (const file of ['app/layouts/default.vue', 'app/pages/index.vue']) check(`${file}: the frame uses overflow-clip`, /\[ site-shell \][^"]*overflow-clip/.test(source[file]) && !/\[ site-shell \][^"]*overflow-hidden/.test(source[file]))

// Language, privacy and consent.
check('app.vue mounts the cookie notice for every page', /<ArchiveCookieNotice\s*\/>/.test(source['app/app.vue']))
check('app.vue and error.vue set the document language', ['app/app.vue', 'app/error.vue'].every((file) => /useDocumentLang\(\)/.test(source[file])))
check('the footer can reopen the cookie settings', /showCookieNotice/.test(source['app/components/ArchiveFooterMenu.vue']))
check('the privacy page describes Umami and the prepared Maps/YouTube consent', /id: 'umami-analytics'/.test(source['app/pages/privacy.vue']) && /id:\s*'external-media'/.test(source['app/pages/privacy.vue']))
check('Matomo is gone (Umami since 2026-10-24)', Object.values(source).every((text) => !/matomo/i.test(text)))
check('the language switch navigates only through setLocale', /await setLocale\(/.test(source['app/components/ArchiveLanguageSwitch.vue']) && !/navigateTo\(/.test(source['app/components/ArchiveLanguageSwitch.vue']))

// Menus come from Directus (pp_navigations), never hard-coded routes.
for (const file of ['app/components/ArchiveHeader.vue', 'app/components/ArchiveFooterMenu.vue']) check(`${file} renders its links from useSiteNavigation()`, /useSiteNavigation\(\)/.test(source[file]))
check('the header popup shows the information and legal groups', /\['information', 'legal'\]/.test(source['app/components/ArchiveHeader.vue']))
for (const page of ['imprint', 'privacy', 'terms', 'accessibility']) check(`${page}.vue uses the shared legal page`, /<ArchiveLegalPage/.test(source[`app/pages/${page}.vue`]))

// An organisation's name is one verbatim string, never split or inverted (owner).
check('organisation entries show the title verbatim', !/formatArtistName|split\(/.test(source['app/components/OrganisationDirectoryEntry.vue']))

// Centred means centred (owner's rule, 2026-11-09, for ever; frontend/AGENTS.md rule 4). Every close
// button is ArchiveCloseButton, whose × is measured in the middle by the e2e test; a loose ×, ✕ or ☰
// in a template would be a second, unmeasured symbol button.
const SYMBOL_CHARACTERS = /&#215;|&times;|&#x2715;|&#10005;|&#9776;|[×✕✖☰]/
for (const file of [...pages, ...components, 'app/app.vue', 'app/error.vue', 'app/layouts/default.vue']) {
  const template = source[file].match(/<template>[\s\S]*<\/template>/)?.[0] ?? ''
  check(`${file}: no loose symbol character (× ✕ ☰ …); close buttons are ArchiveCloseButton (rule 4: centred means centred)`, !SYMBOL_CHARACTERS.test(template))
}

// Three.js loads with the wheel (utils/threeRuntime.ts), never with the start page's first chunk.
const appSources = (await readdir(new URL('../app', import.meta.url), { recursive: true })).filter((file) => /\.(vue|ts)$/.test(file))
for (const file of appSources) {
  const text = await read(`app/${file}`)
  check(`app/${file} imports three only as types (loadThree() at runtime)`, !/^import (?!type )[^\n]*from 'three'/m.test(text))
}

if (failures.length) {
  console.error('Conventions failed:')
  for (const label of failures) console.error(`  - ${label}`)
  process.exitCode = 1
} else {
  console.log(`Conventions hold (${pages.length} pages, ${components.length} components).`)
}

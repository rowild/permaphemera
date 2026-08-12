import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const readJson = async (path) => JSON.parse(await readText(path))

const collectLeafKeys = (value, prefix = '', keys = []) => {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (child && typeof child === 'object' && !Array.isArray(child)) {
      collectLeafKeys(child, path, keys)
    } else {
      keys.push(path)
    }
  }

  return keys
}

const englishMessages = await readJson('i18n/locales/en.json')
const germanMessages = await readJson('i18n/locales/de.json')
const englishKeys = collectLeafKeys(englishMessages).sort()
const germanKeys = collectLeafKeys(germanMessages).sort()

assert.deepEqual(germanKeys, englishKeys, 'English and German UI locale files must expose identical message keys.')

// German overlay files under app/data/translations/de/ are gone: German text
// now lives inline in each record's translations[] array, alongside entries
// for other languages_code values. Two intents from the old overlay-file
// check carry over onto that inline shape:
//   1. Coverage is no longer "every record has German" (the four legacy demo
//      exhibitions and the ten promoted venues have no German prose to copy —
//      see task-2/task-6 reports) but it must still be internally consistent:
//      any record that does have a `de` entry must also have an `en` entry,
//      and every record must resolve in at least English.
//   2. Stable, non-translatable fields must never appear inside a `de` entry.
const germanCoverage = {}

for (const collection of ['exhibitions', 'venues', 'locations']) {
  const records = await readJson(`app/data/${collection}.json`)
  let withDe = 0

  for (const record of records) {
    const codes = new Set((record.translations ?? []).map(({ languages_code }) => languages_code))
    const hasEn = codes.has('en')
    const hasDe = codes.has('de')
    if (hasDe) withDe += 1

    assert(hasEn, `${collection}.${record.id} must have at least an English translation entry.`)
    if (hasDe) {
      assert(hasEn, `${collection}.${record.id} has a German translation entry but no English fallback.`)
    }

    for (const entry of record.translations ?? []) {
      if (entry.languages_code !== 'de') continue
      for (const immutableField of ['id', 'slug', 'location_id', 'venue_slug', 'start_date', 'end_date', 'image', 'hero_image', 'source_pdf', 'website_url']) {
        assert(!(immutableField in entry), `${collection}.${record.id} must not translate stable field ${immutableField}.`)
      }
    }
  }

  germanCoverage[collection] = `${withDe}/${records.length}`
}

const nuxtConfig = await readText('nuxt.config.ts')
assert.match(nuxtConfig, /'@nuxtjs\/i18n'/, 'Nuxt i18n must remain enabled.')
assert.match(nuxtConfig, /defaultLocale:\s*'de'/, 'German must remain the default locale.')
assert.match(nuxtConfig, /strategy:\s*'prefix_except_default'/, 'German must stay unprefixed and English prefixed.')
assert.match(nuxtConfig, /detectBrowserLanguage:\s*{[\s\S]*?useCookie:\s*true/, 'Browser-language detection must remain enabled with locale persistence.')
assert.match(nuxtConfig, /cookieKey:\s*'permaphemera-locale'/, 'Browser detection and the explicit language switch must share the necessary locale cookie.')
assert.match(nuxtConfig, /redirectOn:\s*'root'/, 'Browser-language detection must be limited to the root entry route.')
assert.match(nuxtConfig, /fallbackLocale:\s*'de'/, 'German must remain the browser-detection fallback locale.')

const languageSwitch = await readText('app/components/ArchiveLanguageSwitch.vue')
assert.match(languageSwitch, /useSwitchLocalePath\(\)/, 'The language switch must resolve the equivalent localized route.')
assert.match(languageSwitch, /useCookie<string>\('permaphemera-locale'/, 'The language switch must remember an explicit locale preference.')
assert.match(languageSwitch, /await setLocale\(localeCode\)/, 'The language switch must update the active locale.')
assert.match(languageSwitch, /await navigateTo\(targetPath\)/, 'The language switch must navigate to the localized route.')

const privacyNotice = await readText('app/components/ArchiveCookieNotice.vue')
const cookieNoticeState = await readText('app/composables/useCookieNotice.ts')
const appShell = await readText('app/app.vue')
const landingPage = await readText('app/pages/index.vue')
const footerMenu = await readText('app/components/ArchiveFooterMenu.vue')

assert.match(appShell, /<ArchiveCookieNotice\s*\/>/, 'The privacy notice must be mounted globally.')
assert.match(appShell, /htmlAttrs/, 'The active locale must set the document language attributes.')
assert.match(appShell, /localeProperties\.value\.language/, 'The document language must follow the active locale.')
assert.match(landingPage, /site\.seoDescription/, 'The landing-page description must be localized.')
assert.match(landingPage, /:to="artistLetterRoute\(letter\)"/, 'Landing-page alphabet letters must open the filtered artist directory.')
assert.match(landingPage, /<ArchiveAlphabetRail[\s\S]*?controls/, 'The landing-page alphabet must expose scroll controls.')
assert.doesNotMatch(landingPage, /\[ alphabet-filter \][^"\n]*border-b/, 'The landing-page alphabet must not retain its lower divider line.')
assert.match(cookieNoticeState, /permaphemera-cookie-notice-dismissed/, 'Privacy notice dismissal must be remembered locally.')
assert.match(privacyNotice, /privacyNotice\.actions\.accept/, 'The privacy notice must expose its localized dismissal action.')
assert.match(footerMenu, /showCookieNotice/, 'The footer must be able to reopen the privacy notice.')

const coverageSummary = Object.entries(germanCoverage).map(([name, ratio]) => `${name} ${ratio} de`).join(', ')
console.log(`i18n/privacy check passed (${englishKeys.length} shared UI messages; German coverage — ${coverageSummary}).`)

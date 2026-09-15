// directus/scripts/apply-settings.mjs
// Project settings that are not environment variables, plus branding assets.
//   node scripts/apply-settings.mjs
import { resolve } from 'node:path'
import { loadEnv, login } from './lib.mjs'
import { COLOR } from './schema.mjs'
import { uploadFile } from './files.mjs'

const env = loadEnv()
const session = await login(env)
const { api } = session
const svgRoot = resolve(import.meta.dirname, '..', '..', 'frontend', 'public', 'media', 'svg')
// The temple mark lives under svg/brand/; the seal lives directly under svg/.
const brand = (file) => resolve(svgRoot, 'brand', file)
const svg = (file) => resolve(svgRoot, file)

// The admin paints the logo box in the project colour (archive red), so the logo is the same temple mark in the site's paper colour.
const logo = await uploadFile(session, { localPath: brand('archive-temple-light.svg'), folderPath: 'branding', title: 'PERMAPHEMERA temple mark, light' })
const seal = await uploadFile(session, { localPath: svg('permaphemera_seal.svg'), folderPath: 'branding', title: 'PERMAPHEMERA seal' })
console.log(`${logo.created ? '+' : '='} logo ${logo.id}`)
console.log(`${seal.created ? '+' : '='} seal ${seal.id}`)

const settings = await api('PATCH', '/settings', {
  project_name: env.PROJECT_NAME || 'PERMAPHEMERA',
  project_descriptor: 'Exhibition archive',
  project_color: COLOR,
  default_language: 'en-US',
  project_url: 'http://localhost:4991',
  project_logo: logo.id,
  public_foreground: seal.id,
  public_note: 'PERMAPHEMERA exhibition archive',
})
console.log(`settings: ${settings.project_name} · ${settings.project_color} · ${settings.default_language} · logo ${settings.project_logo ? 'set' : 'missing'}`)

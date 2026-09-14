// directus/scripts/apply-settings.mjs
// Project settings that are not environment variables.
//   node scripts/apply-settings.mjs
import { loadEnv, login } from './lib.mjs'
import { COLOR } from './schema.mjs'

const env = loadEnv()
const { api } = await login(env)
const settings = await api('PATCH', '/settings', {
  project_name: env.PROJECT_NAME || 'PERMAPHEMERA',
  project_descriptor: 'Exhibition archive',
  project_color: COLOR,
  default_language: 'en-US',
  project_url: 'http://localhost:4991',
})
console.log(`settings: ${settings.project_name} · ${settings.project_color} · ${settings.default_language}`)

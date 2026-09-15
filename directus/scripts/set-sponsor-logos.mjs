// directus/scripts/set-sponsor-logos.mjs
// Attach each sponsor's logo PNG (from the frontend checkout) to its pp_sponsors record.
// Idempotent: uploadFile skips re-uploading an existing file, and the PATCH only runs
// when logo is still null. Run twice to confirm — second run prints all `=`.
//   node scripts/set-sponsor-logos.mjs
import { resolve } from 'node:path'
import { loadEnv, login } from './lib.mjs'
import { uploadFile } from './files.mjs'

const env = loadEnv()
const session = await login(env)
const { api } = session
const sponsorsRoot = resolve(import.meta.dirname, '..', '..', 'frontend', 'public', 'media', 'images', 'landing', 'sponsors')

const sponsors = await api('GET', '/items/pp_sponsors?limit=-1&fields=id,slug,logo')
for (const sponsor of sponsors) {
  const file = await uploadFile(session, {
    localPath: resolve(sponsorsRoot, `${sponsor.slug}.png`),
    folderPath: 'media/images/landing/sponsors',
    title: `${sponsor.slug} logo`,
  })
  if (sponsor.logo === null) {
    await api('PATCH', `/items/pp_sponsors/${sponsor.id}`, { logo: file.id })
    console.log(`+ ${sponsor.slug} ${file.id}`)
  } else {
    console.log(`= ${sponsor.slug} ${file.id}`)
  }
}

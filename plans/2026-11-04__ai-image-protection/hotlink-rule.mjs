// Hotlink protection for every image and tour file, whatever its ending (2026-11-09).
// Cloudflare's own Hotlink Protection covers only .jpg/.jpeg/.png/.gif/.ico: Directus images
// (/cms/assets/<id>, no ending) and the tour tiles (.webp) were open. This custom firewall rule
// blocks /cms/assets/ and /media/ when another site is the referer. An empty referer (direct
// visits, crawlers, link previews) and our own hosts stay allowed.
//   node plans/2026-11-04__ai-image-protection/hotlink-rule.mjs [--apply]
import { readFileSync } from 'node:fs'
const env = Object.fromEntries(readFileSync(new URL('../../frontend/.env.deploy.local', import.meta.url), 'utf8').split('\n')
  .filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const base = `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/rulesets/phases/http_request_firewall_custom/entrypoint`
const headers = { Authorization: `Bearer ${env.CLOUDFLARE_SETTINGS_TOKEN}`, 'Content-Type': 'application/json' }

const DESCRIPTION = 'PERMAPHEMERA hotlink protection: images and tours only on our own pages (2026-11-09)'
const OWN = ['https://permaphemera.at/', 'https://www.permaphemera.at/', 'https://permaphemera.project-backends.info/']
const expression = '(starts_with(http.request.uri.path, "/cms/assets/") or starts_with(http.request.uri.path, "/media/"))'
  + ' and http.referer ne ""'
  + ` and not (${OWN.map((host) => `starts_with(http.referer, "${host}")`).join(' or ')})`

const current = await (await fetch(base, { headers })).json()
const others = (current.result?.rules ?? []).filter((rule) => rule.description !== DESCRIPTION)
  .map(({ action, expression: e, description, enabled }) => ({ action, expression: e, description, enabled }))
const rules = [...others, { action: 'block', expression, description: DESCRIPTION, enabled: true }]
console.log(`rules after: ${rules.length}\n${expression}`)
if (process.argv.includes('--apply')) {
  const response = await (await fetch(base, { method: 'PUT', headers, body: JSON.stringify({ rules }) })).json()
  console.log(response.success ? 'applied' : `FAILED ${JSON.stringify(response.errors)}`)
}

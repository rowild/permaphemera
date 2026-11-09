// kultur-im-puls (owner, 2026-11-09): impulscenter.at blocks every visit, so it cannot be a source.
// The two details only it backed ("Impuls Center", "owner of the Impuls Center") leave the text;
// the sources become the reachable kultur-impuls.com pages. Backup: backup-kultur-im-puls.json.
import { readFileSync } from 'node:fs'
const env = Object.fromEntries(readFileSync(new URL('../../frontend/.env', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const headers = { Authorization: `Bearer ${env.DIRECTUS_TOKEN}`, 'Content-Type': 'application/json' }
const url = `${env.NUXT_PUBLIC_DIRECTUS_URL}/items/pp_organisations/0a004d03-d556-4f92-bfca-e9a79ad5e2de`
const record = (await (await fetch(`${url}?fields=translations.id,translations.languages_code,translations.about_html`, { headers })).json()).data
const edits = {
  en: [
    ['runs the Galerie im Stiegenhaus in the staircase of the Impuls Center in Seeboden,', 'runs the Galerie im Stiegenhaus, a staircase gallery in Seeboden,'],
    ['Peter Kleinfercher, owner of the Impuls Center, is its honorary chairman.', 'Peter Kleinfercher is its honorary chairman.'],
    ['<li>impulscenter.at</li>', '<li><a href="https://kultur-impuls.com/vorstand-und-team/">“Vorstand und Team”, kultur-impuls.com</a></li><li><a href="https://kultur-impuls.com/unsere-galerie/">“Unsere Galerie”, kultur-impuls.com</a></li>']
  ],
  de: [
    ['betreibt die Galerie im Stiegenhaus im Impuls Center in Seeboden,', 'betreibt die Galerie im Stiegenhaus in Seeboden,'],
    ['Ehrenobmann ist Peter Kleinfercher, der Eigentümer des Impuls Centers.', 'Ehrenobmann ist Peter Kleinfercher.'],
    ['<li>impulscenter.at</li>', '<li><a href="https://kultur-impuls.com/vorstand-und-team/">„Vorstand und Team“, kultur-impuls.com</a></li><li><a href="https://kultur-impuls.com/unsere-galerie/">„Unsere Galerie“, kultur-impuls.com</a></li>']
  ]
}
const update = record.translations.map((t) => {
  let html = t.about_html
  for (const [from, to] of edits[t.languages_code] ?? []) {
    if (!html.includes(from)) throw new Error(`${t.languages_code}: not found: ${from}`)
    html = html.replace(from, to)
  }
  return { id: t.id, about_html: html, language: t.languages_code }
})
const english = update.find((u) => u.language === 'en').about_html
const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ about_html: english, translations: { update: update.map(({ language, ...rest }) => rest) } }) })
console.log(res.status)

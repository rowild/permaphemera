// Removes the hand-written, dated 360° tour sentence from summary and description.
// Input: before.json (backup). Output: the update payloads, one per record.
import { readFileSync } from 'node:fs'

const patterns = [
  / ?The 360° tour will be available here from [^.]+\./g,
  / ?Die 360°-Tour ist ab .+? hier zu sehen\./g,
  / ?PERMAPHEMERA (?:will record|records) (?:the exhibition|it) as a 360° tour,? (?:that will be )?available here from [^.]+\./g,
  / ?PERMAPHEMERA dokumentiert (?:die Ausstellung|sie) als 360°-Tour, die ab .+? hier online zu sehen sein wird\./g
]
const strip = (text) => {
  if (!text) return text
  let out = text
  for (const pattern of patterns) out = out.replace(pattern, '')
  return out.replace(/ {2,}/g, ' ').trim()
}

const { data } = JSON.parse(readFileSync(new URL('./before.json', import.meta.url)))
const payloads = data.map((record) => ({
  id: record.id,
  slug: record.slug,
  summary: strip(record.summary),
  description: strip(record.description),
  translations: record.translations.map((t) => ({ id: t.id, languages_code: t.languages_code, summary: strip(t.summary), description: strip(t.description) }))
}))
for (const p of payloads) {
  for (const text of [p.summary, p.description, ...p.translations.flatMap((t) => [t.summary, t.description])]) {
    if (/360°[- ]tour|360°-Tour/i.test(text)) throw new Error(`left over in ${p.slug}: ${text}`)
  }
}
console.log(JSON.stringify(payloads, null, 1))

// Corrections after reading the records back. Run from directus/ with DIRECTUS_ENV_FILE=.env.remote.
import { loadEnv, login } from '../../directus/scripts/lib.mjs'
const { api } = await login(loadEnv())
const en = 'Wolfgang Daborer, who lives in Spittal an der Drau, shows works from his cycle “Atemzüge” of 2025 and 2026 in the Wallnerhaus: mixed media on paper, 49.5 × 34.5 cm, and on linen, 200 × 35 cm. According to the flyer, the title refers to the line as a trace of breath. The lines come together, separate and open up space, with some accents of colour. The linen strips hang freely in the room. The exhibition opened on 21 May 2026 in the presence of Mayor Manfred Fleißner. Source: kleblach-lind.at, radio-osttirol.at'
const de = 'Wolfgang Daborer, der in Spittal an der Drau lebt, zeigt im Wallnerhaus Arbeiten aus seinem Zyklus „Atemzüge“ von 2025 und 2026: Mischtechnik auf Papier, 49,5 × 34,5 cm, und auf Leinen, 200 × 35 cm. Laut Flyer verweist der Titel auf die Linie als Spur des Atems. Die Linien verdichten sich, lösen sich und öffnen Räume, mit einzelnen farbigen Akzenten. Die Leinenbahnen hängen frei im Raum. Eröffnet wurde die Ausstellung am 21. Mai 2026 im Beisein von Bürgermeister Manfred Fleißner. Quelle: kleblach-lind.at, radio-osttirol.at'
await api('PATCH', '/items/pp_exhibitions/4bac4c8e-299c-49ad-92f4-29bd58d841f8', { description: en, translations: { create: [], update: [{ id: 73, description: en }, { id: 74, description: de }], delete: [] } })
// The photo of Anita Wiegele shows a performance with a second figure, not a portrait: no person photo.
const anita = await api('GET', '/items/pp_persons/d45fe7f6-306b-4ae6-93eb-02a7bf40e730?fields=translations.id')
await api('PATCH', '/items/pp_persons/d45fe7f6-306b-4ae6-93eb-02a7bf40e730', { image: null, image_alt: null, image_caption: null, translations: { create: [], update: anita.translations.map((row) => ({ id: row.id, image_alt: null, image_caption: null })), delete: [] } })
console.log('fixed')

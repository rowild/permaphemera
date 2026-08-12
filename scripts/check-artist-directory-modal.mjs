import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readProjectFile = (path) => readFile(resolve(projectRoot, path), 'utf8')

const [entry, modal, artistsPage, landingPage, artistDirectory] = await Promise.all([
  readProjectFile('app/components/ArtistDirectoryEntry.vue'),
  readProjectFile('app/components/ArtistExhibitionModal.vue').catch(() => ''),
  readProjectFile('app/pages/artists/index.vue'),
  readProjectFile('app/pages/index.vue'),
  readProjectFile('app/utils/artistDirectory.ts')
])

const entryButtons = [...entry.matchAll(/<button[\s\S]*?<\/button>/g)].map(([button]) => button)
const nameButton = entryButtons.find((button) => button.includes('artist-name-button')) ?? ''
const infoButton = entryButtons.find((button) => button.includes('artist-info-button')) ?? ''

const checks = [
  ['artist rows render the shared modal', /<ArtistExhibitionModal\b/.test(entry)],
  ['artist names never route to a directory query filter', !entry.includes('query: { q: props.artist.name }')],
  ['artist names open the modal only when routed records exist', nameButton.includes('v-if="records.length"') && nameButton.includes('@click="requestToggle(\'name\')"')],
  ['artists without routed records render as strongly muted non-interactive names', /<span[\s\S]{0,160}v-else[\s\S]{0,220}artist-name\b[\s\S]{0,220}text-archive-muted[\s\S]{0,80}opacity-60/.test(entry)],
  ['name and info controls expose the same modal relationship', [nameButton, infoButton].every((button) => button.includes(':aria-controls="modalId"') && button.includes(':aria-expanded="props.open"'))],
  ['info controls require at least one routed record', infoButton.includes('v-if="records.length"') && infoButton.includes('@click="requestToggle(\'info\')"')],
  ['modal focus returns to the control that opened it', /lastTrigger/.test(entry) && /nameButtonRef/.test(entry) && /infoButtonRef/.test(entry)],
  ['the obsolete in-column dropdown is absent', !entry.includes('artist-info-dropdown')],
  ['the modal teleports to the document body', /<Teleport\s+to="body">/.test(modal)],
  ['the modal exposes dialog semantics', /role="dialog"/.test(modal) && /aria-modal="true"/.test(modal)],
  ['the backdrop uses the archive dark-red token', /bg-archive-backdrop/.test(modal)],
  ['the modal closes from Escape and backdrop input', /@keydown\.esc/.test(modal) && /@click\.self/.test(modal)],
  ['keyboard focus stays inside the open modal', /@keydown\.tab="trapFocus"/.test(modal)],
  ['modal actions use framed archive buttons', /<ArchiveButton[\s\S]{0,220}v-for="record in props\.records"[\s\S]{0,260}:to="localePath\(record\.href\)"/.test(modal)],
  ['artist records point only to routed exhibition detail pages', !artistDirectory.includes("href: '/#exhibitions'") && /href: `\/exhibitions\/\$\{exhibition\.slug\}\/`/.test(artistDirectory)],
  ['the directory builder accepts only routed, resolved exhibitions', /exhibitions: ResolvedExhibition\[\]/.test(artistDirectory) && !artistDirectory.includes("href: '/#exhibitions'")],
  ['both artist surfaces share the routed directory builder', artistsPage.includes('buildArtistDirectory(artists.value, locationExhibitions.value, exhibitionsArtists as ExhibitionArtistLink[])') && landingPage.includes('buildArtistDirectory(artists.value, locationExhibitions.value, exhibitionsArtists as ExhibitionArtistLink[])')]
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Artist modal contract failed:')
  failures.forEach(([label]) => console.error(`  - ${label}`))
  process.exitCode = 1
} else {
  console.log('Artist modal routing, visibility, framing, and accessibility are valid.')
}

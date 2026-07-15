import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readProjectFile = (path) => readFile(resolve(projectRoot, path), 'utf8')

const [component, breadcrumb, locationPage, exhibitionPage, artistsPage, artistGroup] = await Promise.all([
  readProjectFile('app/components/ArchiveTextLink.vue'),
  readProjectFile('app/components/ArchiveBreadcrumb.vue'),
  readProjectFile('app/pages/locations/[slug].vue'),
  readProjectFile('app/pages/exhibitions/[slug].vue'),
  readProjectFile('app/pages/artists/index.vue'),
  readProjectFile('app/components/ArtistDirectoryGroup.vue')
])

const checks = [
  ['paper links use archive red', /paper: 'text-archive-red'/.test(component)],
  ['night links retain warm light ink', /night: 'text-archive-light-ink'/.test(component) && !component.includes('hover:text-archive-red')],
  ['paper underlines strengthen on hover and focus', /paper: '[^']*after:opacity-50[^']*group-hover\/archive-text-link:after:opacity-100[^']*group-focus-visible\/archive-text-link:after:opacity-100'/.test(component)],
  ['night underlines become archive red on hover and focus', component.includes('group-hover/archive-text-link:after:bg-archive-red') && component.includes('group-focus-visible/archive-text-link:after:bg-archive-red')],
  ['external-link icons move diagonally', /external: '[^']*translate-x-0\.5[^']*-translate-y-0\.5'/.test(component)],
  ['breadcrumbs delegate link styling to the shared component', !breadcrumb.includes('[&_a]') && artistsPage.includes('<ArchiveTextLink :to="localePath(\'/\')">') && exhibitionPage.includes('<ArchiveTextLink :to="localePath(\'/locations/parkschloessl-spittal-drau/\')">') && locationPage.includes('<ArchiveTextLink :to="localePath(\'/#locations\')">')],
  ['paper action links use the shared component', locationPage.includes('icon-motion="external"') && exhibitionPage.includes('icon-motion="left"')],
  ['the image-overlay action uses the night variant', /<ArchiveTextLink[^>]*surface="night"/.test(locationPage)],
  ['directory continuation links use the shared component', /<ArchiveTextLink[\s\S]*artists\.showMoreUnder/.test(artistGroup)]
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Archive text-link contract failed:')
  failures.forEach(([label]) => console.error(`  - ${label}`))
  process.exitCode = 1
} else {
  console.log('Archive paper and night text-link variants are valid.')
}

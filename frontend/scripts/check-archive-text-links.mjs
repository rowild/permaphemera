import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readProjectFile = (path) => readFile(resolve(projectRoot, path), 'utf8')

const [component, breadcrumb, venuePage, exhibitionPage, artistGroup, directoryHero] = await Promise.all([
  readProjectFile('app/components/ArchiveTextLink.vue'),
  readProjectFile('app/components/ArchiveBreadcrumb.vue'),
  readProjectFile('app/pages/venues/[slug].vue'),
  readProjectFile('app/pages/exhibitions/[slug].vue'),
  readProjectFile('app/components/ArtistDirectoryGroup.vue'),
  readProjectFile('app/components/ArchiveDirectoryHero.vue')
])

const checks = [
  ['paper links use archive red', /paper: 'text-archive-red'/.test(component)],
  ['night links retain warm light ink', /night: 'text-archive-light-ink'/.test(component) && !component.includes('hover:text-archive-red')],
  ['paper underlines strengthen on hover and focus', /paper: '[^']*after:opacity-50[^']*group-hover\/archive-text-link:after:opacity-100[^']*group-focus-visible\/archive-text-link:after:opacity-100'/.test(component)],
  ['night underlines become archive red on hover and focus', component.includes('group-hover/archive-text-link:after:bg-archive-red') && component.includes('group-focus-visible/archive-text-link:after:bg-archive-red')],
  ['external-link icons move diagonally', /external: '[^']*translate-x-0\.5[^']*-translate-y-0\.5'/.test(component)],
    // Breadcrumbs are ArchiveBreadcrumb with `items` (behaviour: test/nuxt/ArchiveBreadcrumb.spec.ts); its links are ArchiveTextLink.
  ['breadcrumbs delegate link styling to the shared component', !breadcrumb.includes('[&_a]') && breadcrumb.includes('<ArchiveTextLink') && [directoryHero, exhibitionPage, venuePage].every((page) => /<ArchiveBreadcrumb[^>]*:items=/.test(page))],
  ['paper action links use the shared component', venuePage.includes('icon-motion="external"') && exhibitionPage.includes('icon-motion="external"')],
  ['the image-overlay action uses the night variant', /<ArchiveTextLink[^>]*surface="night"/.test(venuePage)],
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

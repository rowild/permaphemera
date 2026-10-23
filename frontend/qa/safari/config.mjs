// Shared settings for the website's Safari review kit. A dev tool only:
// nothing in app/ imports it, and the site stays a static build.
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

export const QA_DIR = dirname(fileURLToPath(import.meta.url))
export const FRONTEND_DIR = resolve(QA_DIR, '../..')
export const RESULTS_DIR = resolve(QA_DIR, 'results')

export const PORT = Number(process.env.QA_PORT || 4800)

/** The site under test. The kit's server relays it and adds the probe to
 *  every page: the live site by default, or a local build
 *  (`pnpm generate && pnpm preview`, then QA_TARGET=http://localhost:3000). */
export const TARGET = (process.env.QA_TARGET || 'https://permaphemera.at').replace(/\/$/, '')

/** The pages every runner visits. `tasks` picks the probe's checks:
 *  fonts, gradients, cards, tour (open the 360° modal once). */
export const ROUTES = [
  { key: 'start', path: '/', tasks: ['fonts', 'gradients', 'cards'] },
  { key: 'exhibitions', path: '/exhibitions/', tasks: ['fonts', 'gradients', 'cards'] },
  // Has a published tour: the hero holds the tour button.
  { key: 'exhibition', path: '/exhibitions/farbe-trifft-struktur/', tasks: ['fonts', 'gradients', 'cards', 'tour'] },
  { key: 'venues', path: '/venues/', tasks: ['fonts', 'gradients', 'cards'] },
  { key: 'venue', path: '/venues/parkschloessl-spittal-drau/', tasks: ['fonts', 'gradients', 'cards'] },
  { key: 'artists', path: '/artists/', tasks: ['fonts', 'cards'] },
  { key: 'person', path: '/persons/katya-frei/', tasks: ['fonts', 'gradients', 'cards'] },
  { key: 'about', path: '/about/', tasks: ['fonts', 'gradients', 'cards'] },
]

/** Places where text sits on a gradient (or a gradient sits on an image).
 *  `scrollBy` scrolls the page first, so page content runs under a sticky part. */
export const GRADIENTS = [
  { key: 'header', selector: '.site-header', scrollBy: 640, note: 'sticky header, gradient to transparent over the scrolled page' },
  { key: 'exhibition-hero', selector: '.exhibition-hero', note: 'filtered hero image beside the dark copy gradient' },
  { key: 'exhibition-hero-copy', selector: '.exhibition-hero-copy', note: 'linear-gradient 90deg behind the title and summary' },
  { key: 'record-overlay', selector: '.archive-record-overlay', note: 'dark gradient over the featured exhibition image, text on top' },
  { key: 'venue-preview-shade', selector: '.venue-preview-shade', note: 'dark gradient over the venue preview image' },
  { key: 'ledger-selected', selector: '[class*="linear-gradient(90deg"]', note: 'selected exhibition row: red-to-transparent gradient' },
  { key: 'wheel-controls', selector: '.wheel-controls', note: 'hero wheel buttons: gradients + clip-path + drop-shadow + blend mode' },
]

/** Cards whose shadow and lift are checked at rest, during hover and after. */
export const CARDS = [
  { key: 'exhibition-card', selector: '.exhibition-frame-card' },
  { key: 'venue-card', selector: '.venue-card' },
  { key: 'gallery-card', selector: '.gallery-directory-card' },
  { key: 'action-tile', selector: '.exhibition-action-tile' },
]

/** Time points (ms after the pointer arrives) for the hover series. The card
 *  transitions run 200–700 ms, so the first two land mid-transition. */
export const HOVER_SERIES = [80, 260, 900]

/** What the probe gets, as window.__QA_CONFIG__ (server.mjs puts it in front). */
export const probeConfig = () => ({ gradients: GRADIENTS, cards: CARDS, hoverSeries: HOVER_SERIES })

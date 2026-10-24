<script setup lang="ts">
import {
  Landmark
} from '@lucide/vue'
import { gsap } from 'gsap'
import type { KaleidoscopeExhibitionItem } from '~/types/kaleidoscope'
import { MAX_SCHEDULE_SLIDES_PER_GROUP, selectExhibitionSchedule, selectFeaturedExhibition } from '~/utils/exhibitionSchedule'
import { buildHeroItems, HERO_BLADE_COUNT, selectOpenedExhibitions } from '~/utils/heroItems'
import type { ResolvedVenue } from '~/utils/resolveVenues'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'

// `directoryVenues` below doesn't hand out the full resolved records — it
// rebuilds a smaller landing-page card projection with a `location_id` field
// ResolvedVenue doesn't carry. This local type describes exactly what gets
// constructed. Exhibitions go to ExhibitionCard whole: the card needs the
// dates and the tour fields for its short date and its 360° tile.
interface Venue extends Pick<ResolvedVenue, 'id' | 'slug' | 'name' | 'city' | 'address' | 'website_url' | 'image' | 'featured' | 'archive_number'> {
  location_id: string
}
type Exhibition = ResolvedExhibition

// The start page renders before the archive arrives (app.vue): the hero shows
// at once, the wheel's arrows run faded, everything below waits for the data.
definePageMeta({ archiveOptional: true })

const { venues, venueExhibitions, artistDirectory: directoryArtists } = useArchiveData()
const archiveReady = useArchiveReady()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const archiveToday = useArchiveToday()

usePageSeo('/')

// Only galleries with a real photo are previewed here; the full list lives on /venues/.
const directoryVenues = computed<Venue[]>(() => venues.value.filter((venueRecord) => venueRecord.has_image).map((venueRecord) => ({
  id: `venue-${venueRecord.id}`,
  slug: venueRecord.slug,
  location_id: venueRecord.id,
  name: venueRecord.name,
  city: venueRecord.city_name,
  address: venueRecord.address,
  website_url: venueRecord.website_url,
  image: venueRecord.image,
  featured: venueRecord.featured,
  archive_number: venueRecord.archive_number
})))

const featuredVenue = computed(() => directoryVenues.value.find((venue) => venue.featured) ?? directoryVenues.value[0]!)
const otherVenues = computed(() => directoryVenues.value.filter((venue) => venue.id !== featuredVenue.value.id))
// The landing page shows the featured venue, then the next five published
// venues in archive order, then one more as the "stack" card. Nothing is
// hard-coded: whatever the owner publishes in Directus appears here.
const LANDING_VENUE_COUNT = 5
const archiveOrder = (left: Venue, right: Venue) =>
  (left.archive_number || '').localeCompare(right.archive_number || '', undefined, { numeric: true }) || left.name.localeCompare(right.name)
const orderedOtherVenues = computed(() => [...otherVenues.value].sort(archiveOrder))
const venueStackVenue = computed(() => venueSearchQuery.value.trim() ? undefined : orderedOtherVenues.value[LANDING_VENUE_COUNT])
const regularVenues = computed(() => venueSearchQuery.value.trim()
  ? otherVenues.value
  : orderedOtherVenues.value.slice(0, LANDING_VENUE_COUNT))
const orderedExhibitions = computed(() => [...venueExhibitions.value]
  .sort((left, right) => right.start_date.localeCompare(left.start_date)
    || right.end_date.localeCompare(left.end_date)
    || left.title.localeCompare(right.title)))
// "Selected exhibitions" shows what is on or has been on; announced exhibitions have their own section.
const openedExhibitions = computed(() => selectOpenedExhibitions(orderedExhibitions.value, archiveToday.value))
const featuredExhibitionRecord = computed(() => selectFeaturedExhibition(openedExhibitions.value, archiveToday.value))
const selectedExhibitions = computed<Exhibition[]>(() => {
  const featured = featuredExhibitionRecord.value
  const records = featured
    ? [featured, ...openedExhibitions.value.filter((exhibition) => exhibition.id !== featured.id)]
    : openedExhibitions.value

  return records.slice(0, 5)
})
const featuredExhibition = computed(() => selectedExhibitions.value.find((exhibition) => exhibition.id === featuredExhibitionRecord.value?.id) ?? selectedExhibitions.value[0]!)
const sideExhibitions = computed(() => selectedExhibitions.value.filter((exhibition) => exhibition.id !== featuredExhibition.value.id))
// Up to five per group for the mobile slider; the desktop columns show the first three.
const exhibitionSchedule = computed(() => selectExhibitionSchedule(venueExhibitions.value, archiveToday.value, MAX_SCHEDULE_SLIDES_PER_GROUP))
const currentExhibitions = computed(() => exhibitionSchedule.value.current)
const upcomingExhibitions = computed(() => exhibitionSchedule.value.upcoming)
const hasTimelyExhibitions = computed(() => currentExhibitions.value.length > 0 || upcomingExhibitions.value.length > 0)
const firstLandingSectionTarget = computed(() => hasTimelyExhibitions.value ? '#current-upcoming' : '#venues')
// The fan links only to open 360° experiences; galleries fill it up to twelve blades for now.
const heroExhibitionItems = computed<KaleidoscopeExhibitionItem[]>(() => buildHeroItems(
  venueExhibitions.value,
  venues.value,
  archiveToday.value,
  {
    exhibition: (slug) => localePath(`/exhibitions/${slug}/`),
    venue: (slug) => localePath(`/venues/${slug}/`)
  }
))
const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#']
const artistGroupOrder = ['B', 'E', 'J', 'K', 'L', 'R', 'W']
const venueStackItems = [
  '/media/images/landing/kaleidoscope/locations/location_07.png',
  '/media/images/landing/kaleidoscope/locations/location_08.png',
  '/media/images/landing/kaleidoscope/locations/location_09.png',
  '/media/images/landing/kaleidoscope/locations/location_10.png'
].map((image, index) => ({ id: `venue-stack-${index + 1}`, image, alt: '' }))
const artistStackItems = Array.from({ length: 5 }, (_, index) => ({ id: `artist-stack-${index + 1}` }))
const kaleidoscopeRef = ref<{
  rotateBy: (direction: number) => void
  replayIntro: () => void
} | null>(null)
const kaleidoscopeAnimating = ref(true)
const wheelControlsRevealed = ref(false)
const wheelControlsRef = ref<HTMLElement | null>(null)
const venueSearchQuery = ref('')
const exhibitionSearchQuery = ref('')
const artistSearchQuery = ref('')
const openLandingArtistSlug = ref('')
const preservedExhibitionCount = computed(() => venueExhibitions.value.length)
// The towns of the published galleries, the one with the most galleries first,
// then by name; at most five, the full list is on /venues/.
const SIDEBAR_CITY_COUNT = 5
const sidebarCities = computed(() => {
  const galleriesPerCity = new Map<string, number>()
  venues.value.forEach((venue) => galleriesPerCity.set(venue.city_name, (galleriesPerCity.get(venue.city_name) ?? 0) + 1))
  return [...galleriesPerCity]
    .sort(([cityA, countA], [cityB, countB]) => countB - countA || cityA.localeCompare(cityB, locale.value))
    .slice(0, SIDEBAR_CITY_COUNT)
    .map(([city]) => city)
})
const availableArtistLetters = computed(() => new Set(directoryArtists.value.map((artist) => artist.letter)))
const artistLetterRoute = (letter: string) => ({
  path: localePath('/artists/'),
  query: {
    ...(artistSearchQuery.value.trim() ? { q: artistSearchQuery.value.trim() } : {}),
    letter
  }
})

// Start page intro, header and hero together. The logo sets itself first,
// letter by letter, as type laid into a forme; the headline starts while the
// logo is still setting, the intro text follows in quicker letters, then the
// buttons. Meanwhile the header fills from left to right: the tagline, the
// menu rising letter by letter, the language switch, and the menu star
// spinning in. The wheel waits for all of it (`heroTextDone`). Only once the
// wheel is built, a letter here and there lets go and falls crooked
// (ArchiveLetters marks which; the logo's H falls last). Everything the intro
// shows is hidden here, before the first paint. Reduced motion: the hero
// blocks fade in, the header is there at once.
const pageRef = ref<HTMLElement | null>(null)
const heroCopyRef = ref<HTMLElement | null>(null)
const heroTextDone = ref(false)
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isVisible = (element: Element) => element.getClientRects().length > 0
const pickVisible = (root: ParentNode, selector: string) => gsap.utils.toArray<HTMLElement>(root.querySelectorAll(selector)).filter(isVisible)
// The letters are inline (kerning), so they rise by `top`, not by a transform.
const LETTER_HIDDEN = { opacity: 0, top: '0.3em', filter: 'blur(6px)' }
const LETTER_SHOWN = { opacity: 1, top: 0, filter: 'blur(0px)' }

function playPageIntro() {
  const page = pageRef.value
  const root = heroCopyRef.value
  if (!page || !root) return
  const headline = pickVisible(root, 'h1 [data-letter]')
  const lede = pickVisible(root, '[data-hero-lede] [data-letter]')
  const buttons = pickVisible(root, '[data-hero-button]')
  const done = () => { heroTextDone.value = true }

  if (prefersReducedMotion()) {
    done()
    gsap.from([root.querySelector('h1'), root.querySelector('[data-hero-lede]'), ...buttons], { opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power1.out' })
    return
  }

  const brandMark = pickVisible(page, '[data-header-brand-mark]')
  const brand = pickVisible(page, '[data-header-brand] [data-letter]')
  const tagline = pickVisible(page, '[data-header-tagline]')
  const menu = pickVisible(page, '[data-header-nav]')
  const language = pickVisible(page, '[data-header-language]')
  const menuStar = pickVisible(page, '[data-header-menu-icon]')
  gsap.set([...brand, ...headline, ...lede], LETTER_HIDDEN)
  gsap.set(menu, { opacity: 0 })
  gsap.set(language, { opacity: 0, y: 8 })
  gsap.set(menuStar, { opacity: 0, rotationY: -360, transformPerspective: 300 })
  gsap.set(buttons, { opacity: 0, y: 10 })

  // The menu links come with the archive, often after the intro has started:
  // the whole menu stays hidden, and its letters are taken only at its turn.
  // They share one window, whatever the language's word lengths. Links that
  // arrive after their turn simply appear.
  const MENU_WINDOW = 0.7
  const revealMenu = () => {
    const parts = menu.flatMap((list) => gsap.utils.toArray<HTMLElement>(list.querySelectorAll('[data-letter], [data-header-divider]')))
    const letters = parts.filter((part) => part.hasAttribute('data-letter'))
    const stagger = parts.length > 1 ? MENU_WINDOW / (parts.length - 1) : 0
    gsap.set(letters, LETTER_HIDDEN)
    gsap.set(parts.filter((part) => !letters.includes(part)), { scale: 0 })
    gsap.set(menu, { opacity: 1 })
    parts.forEach((part, index) => {
      gsap.to(part, letters.includes(part)
        ? { ...LETTER_SHOWN, duration: 0.5, ease: 'power3.out', delay: index * stagger }
        : { scale: 1, duration: 0.4, ease: 'back.out(2)', delay: index * stagger })
    })
  }

  const BRAND_STAGGER = 0.045
  const HEADLINE_START = 0.45
  const MENU_START = 0.55
  const LANGUAGE_START = 1.2
  const MENU_STAR_START = 1.3
  const LETTER_STAGGER = 0.028
  const LEDE_STAGGER = 0.007
  const timeline = gsap.timeline({ delay: 0.1, onComplete: done })
  // `from`: the temple mark keeps its own resting opacity.
  timeline.from(brandMark, { opacity: 0, y: 6, duration: 0.5, ease: 'power3.out' }, 0)
  brand.forEach((letter, index) => {
    timeline.to(letter, { ...LETTER_SHOWN, duration: 0.6, ease: 'power3.out' }, 0.1 + index * BRAND_STAGGER)
  })
  timeline.from(tagline, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 0.1 + brand.length * BRAND_STAGGER)
  timeline.call(revealMenu, undefined, MENU_START)
  timeline.to(language, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, LANGUAGE_START)
  timeline.to(menuStar, { opacity: 1, duration: 0.5, ease: 'power1.out' }, MENU_STAR_START)
  timeline.to(menuStar, { rotationY: 0, duration: 0.9, ease: 'power2.out' }, MENU_STAR_START)
  headline.forEach((letter, index) => {
    timeline.to(letter, { ...LETTER_SHOWN, duration: 0.6, ease: 'power3.out' }, HEADLINE_START + index * LETTER_STAGGER)
  })
  const ledeStart = HEADLINE_START + headline.length * LETTER_STAGGER * 0.55
  lede.forEach((letter, index) => {
    timeline.to(letter, { ...LETTER_SHOWN, duration: 0.45, ease: 'power3.out' }, ledeStart + index * LEDE_STAGGER)
  })
  timeline.to(buttons, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }, ledeStart + lede.length * LEDE_STAGGER + 0.1)
}
onMounted(playPageIntro)

// The page below the hero is built only after the hero text has set itself,
// one section per frame. Built all at once when the archive arrived, it cost
// one long frame (87 ms measured on a fast desktop; more on a phone) in the
// middle of the text, whatever the connection. A scroll, wheel, tap, click or
// key, or an address with a #target, builds everything at once, so nobody
// reaches an empty page.
const BELOW_HERO_SECTIONS = 6
const belowHeroStep = ref(0)
const visitorActed = ref(false)
let buildingBelowHero = false
async function buildBelowHero() {
  if (buildingBelowHero) return
  buildingBelowHero = true
  while (belowHeroStep.value < BELOW_HERO_SECTIONS) {
    belowHeroStep.value = visitorActed.value ? BELOW_HERO_SECTIONS : belowHeroStep.value + 1
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  }
}
watch([archiveReady, heroTextDone, visitorActed], ([ready, textDone, acted]) => {
  if (!ready) return
  if (acted) belowHeroStep.value = BELOW_HERO_SECTIONS
  if (acted || textDone) void buildBelowHero()
}, { immediate: true })
const VISITOR_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown', 'scroll'] as const
const onVisitorAction = () => {
  visitorActed.value = true
  VISITOR_EVENTS.forEach((type) => window.removeEventListener(type, onVisitorAction))
}
onMounted(() => {
  if (window.location.hash) {
    onVisitorAction()
    return
  }
  VISITOR_EVENTS.forEach((type) => window.addEventListener(type, onVisitorAction, { passive: true }))
})
onBeforeUnmount(() => VISITOR_EVENTS.forEach((type) => window.removeEventListener(type, onVisitorAction)))

// The wheel is built: the stuck letters let go, one shortly after the other,
// drop past their resting lean and settle into it, crooked and a little low.
// The logo's H falls last.
let stuckLettersDropped = false
function dropStuckLetters() {
  if (stuckLettersDropped || !pageRef.value || !heroCopyRef.value) return
  stuckLettersDropped = true
  const letters = [
    ...gsap.utils.toArray<HTMLElement>(heroCopyRef.value.querySelectorAll('h1 [data-stuck]')),
    ...gsap.utils.toArray<HTMLElement>(pageRef.value.querySelectorAll('[data-header-brand] [data-stuck]'))
  ]
  letters.forEach((letter) => gsap.set(letter, { transformOrigin: '20% 90%' }))

  if (prefersReducedMotion()) {
    letters.forEach((letter) => gsap.set(letter, { rotation: Number(letter.dataset.stuck) || 0, yPercent: 14 }))
    return
  }

  // Desktop and mobile set the headline twice; each pair of the same letter falls together.
  const DROP_STAGGER = 0.22
  const order = [...new Set(letters.map((letter) => letter.textContent))]
  letters.forEach((letter) => {
    const tilt = Number(letter.dataset.stuck) || 0
    gsap.timeline({ delay: order.indexOf(letter.textContent) * DROP_STAGGER })
      .to(letter, { rotation: tilt * 1.25, yPercent: 17, duration: 0.22, ease: 'power3.in' })
      .to(letter, { rotation: tilt, yPercent: 14, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
  })
}

function handleKaleidoscopeAnimationState(isAnimating: boolean) {
  kaleidoscopeAnimating.value = isAnimating

  // Fallback for interrupted/reduced-motion timelines. The normal entrance is
  // cued slightly before the kaleidoscope intro completes.
  if (!isAnimating) {
    revealWheelControls()
  }
}

function revealWheelControls() {
  if (wheelControlsRevealed.value || !wheelControlsRef.value) return

  const controls = gsap.utils.toArray<HTMLElement>(
    wheelControlsRef.value.querySelectorAll('.wheel-control')
  )
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  gsap.killTweensOf(controls)
  gsap.set(controls, {
    opacity: reduceMotion ? 1 : 0,
    '--wheel-control-reveal-y': reduceMotion ? '0rem' : '0.85rem'
  })
  wheelControlsRevealed.value = true

  if (reduceMotion) return

  gsap.to(controls, {
    opacity: 1,
    duration: 0.42,
    stagger: 0.12,
    ease: 'power2.out'
  })
  gsap.to(controls, {
    '--wheel-control-reveal-y': '0rem',
    duration: 1.1,
    stagger: 0.12,
    ease: 'elastic.out(1, 0.55)'
  })
}

const methodSteps = computed(() => [
  {
    icon: '/media/images/landing/method/steps/captured.png',
    number: '01',
    title: t('landing.method.steps.captured.title'),
    text: t('landing.method.steps.captured.text')
  },
  {
    icon: '/media/images/landing/method/steps/connected.png',
    number: '02',
    title: t('landing.method.steps.connected.title'),
    text: t('landing.method.steps.connected.text')
  },
  {
    icon: '/media/images/landing/method/steps/preserved.png',
    number: '03',
    title: t('landing.method.steps.preserved.title'),
    text: t('landing.method.steps.preserved.text')
  }
])

const methodFacts = computed(() => [
  { label: t('landing.method.facts.technology'), lines: [t('landing.method.facts.capture'), t('landing.method.facts.mapping')] },
  { label: t('landing.method.facts.curation'), lines: [t('landing.method.facts.selected'), t('landing.method.facts.austria')] },
  { label: t('landing.method.facts.status'), lines: [t('landing.method.facts.pilot'), t('landing.method.facts.development')] }
])

const artistsByLetter = computed(() => {
  const query = artistSearchQuery.value.trim().toLocaleLowerCase()

  return artistGroupOrder
    .map((letter) => ({
      letter,
      artists: directoryArtists.value
        .filter((artist) => {
          if (artist.letter !== letter) {
            return false
          }

          return !query || [
            artist.name,
            artist.displayName,
            artist.location,
            artist.years,
            ...artist.records.flatMap((record) => [record.title, record.venue, record.city])
          ]
            .some((value) => value.toLocaleLowerCase().includes(query))
        })
        .sort((left, right) => left.displayName.localeCompare(right.displayName))
    }))
    .filter((group) => group.artists.length)
})

const toggleLandingArtistDetails = (slug: string) => {
  openLandingArtistSlug.value = openLandingArtistSlug.value === slug ? '' : slug
}

watch(artistSearchQuery, () => {
  openLandingArtistSlug.value = ''
})

const venueMatchesSearch = (venue: Venue) => {
  const query = venueSearchQuery.value.trim().toLocaleLowerCase()

  return !query || [venue.name, venue.city, venue.address]
    .some((value) => value.toLocaleLowerCase().includes(query))
}

const exhibitionMatchesSearch = (exhibition: Exhibition) => {
  const query = exhibitionSearchQuery.value.trim().toLocaleLowerCase()

  return !query || [
    exhibition.title,
    exhibition.artist,
    exhibition.venue,
    exhibition.city,
    exhibition.date_range
  ].some((value) => value.toLocaleLowerCase().includes(query))
}

</script>

<template>
  <main ref="pageRef" class="[ site-shell ] archive-drafting-canvas relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader skip-target="top" intro />

    <section
      id="top"
      class="[ hero-section ] [ section-band ] relative mx-auto grid min-h-[calc(100vh-6.4rem)] max-w-[105rem] grid-cols-[minmax(22rem,0.82fr)_minmax(26rem,1.18fr)] items-center gap-[clamp(2.5rem,5vw,6rem)] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3rem,4vw,4.5rem)] pb-[clamp(5.2rem,7vw,6.5rem)] tablet:min-h-[calc(100svh-6rem)] tablet:grid-cols-1 tablet:content-center tablet:gap-3 tablet:pt-2 tablet:pb-20 tablet-landscape:grid-cols-[minmax(16rem,0.82fr)_minmax(19rem,1.18fr)] tablet-landscape:gap-8 tablet-landscape:pt-6 compact:min-h-[calc(100svh-4rem)] compact:gap-2 compact:px-4 compact:pt-1 compact:pb-20"
    >
      <div ref="heroCopyRef" class="[ hero-copy ] relative tablet:row-start-2 tablet-landscape:col-start-1 tablet-landscape:row-start-1 tablet-portrait:mx-auto tablet-portrait:max-w-3xl tablet-portrait:text-center compact:text-center">
        <h1 class="m-0 max-w-124 font-display text-hero font-light leading-[0.98] tracking-normal tablet-landscape:max-w-96 tablet-landscape:text-h2-lg tablet-portrait:max-w-none tablet-portrait:text-center tablet-portrait:text-h1-steep tablet-portrait:leading-none compact:max-w-none compact:text-center compact:text-3xl compact:leading-none">
          <span class="tablet-portrait:hidden compact:hidden">
            <span class="block"><ArchiveLetters :text="$t('landing.hero.line1')" stuck /></span>
            <span class="block text-archive-red"><ArchiveLetters :text="$t('landing.hero.line1Accent')" /></span>
            <span class="block"><ArchiveLetters :text="$t('landing.hero.line2')" /></span>
            <span class="block text-archive-red"><ArchiveLetters :text="$t('landing.hero.line2Accent')" stuck /></span>
          </span>
          <span class="hidden tablet-portrait:block compact:block">
            <span class="block"><ArchiveLetters :text="$t('landing.hero.line1')" stuck /> <span class="text-archive-red"><ArchiveLetters :text="$t('landing.hero.line1Accent')" /></span></span>
            <span class="block"><ArchiveLetters :text="$t('landing.hero.line2')" /> <span class="text-archive-red"><ArchiveLetters :text="$t('landing.hero.line2Accent')" stuck /></span></span>
          </span>
        </h1>
        <p class="mx-0 mt-[1.55rem] mb-[2.2rem] max-w-116 font-display text-lede leading-tight font-normal text-archive-muted tablet-landscape:mt-4 tablet-landscape:mb-6 tablet-landscape:text-base tablet-portrait:mx-auto tablet-portrait:mt-3 tablet-portrait:mb-4 tablet-portrait:max-w-lg tablet-portrait:text-center tablet-portrait:text-base tablet-portrait:leading-snug compact:mx-auto compact:mt-3 compact:mb-4 compact:max-w-64 compact:text-center compact:text-sm" data-hero-lede><ArchiveLetters :text="$t('landing.hero.lede')" /></p>
        <div class="flex flex-wrap items-center gap-[1.3rem] tablet-landscape:gap-3 tablet-portrait:w-full tablet-portrait:flex-nowrap tablet-portrait:justify-center tablet-portrait:gap-2 compact:w-full compact:flex-nowrap compact:justify-center compact:gap-2">
          <ArchiveButton class="tablet-landscape:px-3 tablet-portrait:w-fit tablet-portrait:flex-none tablet-portrait:min-w-0 tablet-portrait:px-2 compact:w-fit compact:flex-none compact:min-w-0 compact:px-2" href="#venues" data-hero-button>
            <span class="[ button-icon ] svg-icon svg-icon-archive inline-block size-[1.45rem] flex-none bg-current" aria-hidden="true" />
            <span class="tablet-portrait:hidden compact:hidden">{{ $t('landing.hero.explore') }}</span>
            <span class="hidden tablet-portrait:inline compact:inline">{{ $t('landing.hero.exploreCompact') }}</span>
          </ArchiveButton>
          <ArchiveButton class="min-w-[10.2rem] tablet-landscape:min-w-0 tablet-landscape:px-3 tablet-portrait:w-fit tablet-portrait:flex-none tablet-portrait:min-w-0 tablet-portrait:px-2 compact:w-fit compact:flex-none compact:min-w-0 compact:px-2" variant="secondary" href="#method" data-hero-button>
            <Landmark :size="22" />
            <span class="tablet-portrait:hidden compact:hidden">{{ $t('navigation.howItWorks') }}</span>
            <span class="hidden tablet-portrait:inline compact:inline">{{ $t('landing.hero.details') }}</span>
          </ArchiveButton>
        </div>
      </div>

      <div class="[ hero-wheel-area ] grid self-center justify-items-center gap-[clamp(0.9rem,1.8vw,1.45rem)] tablet:row-start-1 tablet-landscape:col-start-2">
        <HeroKaleidoscope
          ref="kaleidoscopeRef"
          :items="heroExhibitionItems.slice(0, HERO_BLADE_COUNT)"
          :item-pool="heroExhibitionItems"
          :pending="!archiveReady"
          :hold-intro="!heroTextDone"
          @animation-state-change="handleKaleidoscopeAnimationState"
          @controls-reveal="revealWheelControls"
          @intro-complete="dropStuckLetters"
        />

        <div
          ref="wheelControlsRef"
          class="[ wheel-controls ] relative z-4 mt-[0.7rem] grid min-h-[4.1rem] items-center justify-center perspective-[24rem] perspective-origin-[50%_-35%] tablet:mt-[0.45rem] compact:min-h-12"
          :aria-label="$t('landing.hero.kaleidoscopeAria')"
        >
          <div class="[ wheel-control-deck ] flex items-center justify-center gap-[clamp(3.6rem,7vw,5.8rem)] transform-3d tablet:gap-12 compact:gap-9" :class="wheelControlsRevealed ? 'visible' : 'invisible'">
            <KaleidoscopeControl
              direction="left"
              :disabled="kaleidoscopeAnimating"
              :label="$t('landing.hero.rotateCounterclockwise')"
              @activate="kaleidoscopeRef?.rotateBy(1)"
            />
            <KaleidoscopeControl
              direction="up"
              :disabled="kaleidoscopeAnimating"
              :label="$t('landing.hero.replay')"
              @activate="kaleidoscopeRef?.replayIntro()"
            />
            <KaleidoscopeControl
              direction="right"
              :disabled="kaleidoscopeAnimating"
              :label="$t('landing.hero.rotateClockwise')"
              @activate="kaleidoscopeRef?.rotateBy(-1)"
            />
          </div>
        </div>
      </div>

      <ArchiveScrollCue
        v-if="belowHeroStep >= BELOW_HERO_SECTIONS"
        :target="firstLandingSectionTarget"
        :label="hasTimelyExhibitions ? $t('landing.hero.continueSchedule') : $t('landing.hero.continue')"
      />
    </section>

    <!-- Everything below the hero needs the archive. -->
    <template v-if="archiveReady">
      <LandingExhibitionSchedule
        v-if="belowHeroStep >= 1"
        :current="currentExhibitions"
        :upcoming="upcomingExhibitions"
      />

      <section v-if="belowHeroStep >= 2" id="venues" class="[ venues-section ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5">
        <div class="[ section-heading ] relative z-1 mb-8 compact:mb-4">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('landing.venues.eyebrow') }}</p>
          <h2 class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] tracking-normal compact:text-3xl">{{ $t('landing.venues.title') }} <span class="text-archive-red">{{ $t('landing.venues.accent') }}</span></h2>
          <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('landing.venues.intro') }}</p>
        </div>

        <ArchiveSearchForm
          v-model="venueSearchQuery"
          class="[ venue-search ]"
          id="venue-search"
          :label="$t('landing.venues.searchLabel')"
          :placeholder="$t('landing.venues.searchPlaceholder')"
        />

        <div class="[ venue-grid ] relative grid grid-cols-[minmax(24rem,1.55fr)_repeat(3,minmax(12rem,1fr))] items-stretch gap-[1.4rem] pb-[3.4rem] tablet:grid-cols-2 tablet:pb-0 compact:grid-cols-2 compact:gap-3">
          <VenueArchiveCard
            v-show="venueMatchesSearch(featuredVenue)"
            :venue="featuredVenue"
            featured
          />

          <VenueArchiveCard
            v-for="venue in regularVenues"
            :key="venue.id"
            v-show="venueMatchesSearch(venue)"
            :venue="venue"
          />

          <ArchivePaperStack
            v-if="venueStackVenue && !venueSearchQuery"
            stack-id="venue-discovery"
            :items="venueStackItems"
            :label="$t('common.more')"
            variant="venue"
            :to="localePath('/venues/')"
          />
        </div>

        <ArchiveExhibitionsDivider />
      </section>

      <section v-if="belowHeroStep >= 3" id="exhibitions" class="[ exhibitions-section ] [ section-band ] relative isolate mx-auto max-w-[105rem] overflow-hidden px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5">
        <div class="[ section-heading ] relative z-1 mb-8 compact:mb-4">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('landing.exhibitions.eyebrow') }}</p>
          <h2 class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] tracking-normal compact:text-3xl">{{ $t('landing.exhibitions.title') }} <span class="text-archive-red">{{ $t('landing.exhibitions.accent') }}</span></h2>
          <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('landing.exhibitions.intro') }}</p>
        </div>

        <ArchiveSearchForm
          v-model="exhibitionSearchQuery"
          class="[ exhibition-search ]"
          id="exhibition-search"
          :label="$t('landing.exhibitions.searchLabel')"
          :placeholder="$t('landing.exhibitions.searchPlaceholder')"
        />

        <div class="[ exhibition-layout ] grid grid-cols-[minmax(28rem,1.35fr)_minmax(23rem,0.85fr)] gap-8 tablet:grid-cols-1 compact:grid-cols-2 compact:gap-3">
          <ExhibitionCard
            class="[ featured-exhibition ] tablet:col-span-full"
            v-show="exhibitionMatchesSearch(featuredExhibition)"
            :exhibition="featuredExhibition"
            layout="hero"
          />

          <div class="[ record-list ] grid content-start gap-4 tablet:grid-cols-2 tablet:gap-5 compact:contents">
            <ExhibitionCard
              v-for="exhibition in sideExhibitions"
              :key="exhibition.id"
              v-show="exhibitionMatchesSearch(exhibition)"
              :exhibition="exhibition"
              layout="side"
            />
          </div>
        </div>

        <ArchiveExhibitionsDivider />
      </section>

      <section v-if="belowHeroStep >= 4" id="artists" class="[ artists-section ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(0,1fr)_18rem] gap-[clamp(2rem,5vw,4.5rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-5 compact:px-4 compact:py-5">
        <div class="[ artists-main ] min-w-0">
          <div class="[ section-heading ] relative z-1 mb-8 compact:mb-4">
            <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('landing.artists.eyebrow') }}</p>
            <h2 class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] tracking-normal compact:text-3xl">{{ $t('landing.artists.title') }} <span class="text-archive-red">{{ $t('landing.artists.accent') }}</span></h2>
            <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('landing.artists.intro') }}</p>
          </div>

          <ArchiveSearchForm
            v-model="artistSearchQuery"
            class="[ artist-search ]"
            id="artist-search"
            :label="$t('landing.artists.searchLabel')"
            :placeholder="$t('landing.artists.searchPlaceholder')"
          />

          <ArchiveAlphabetRail
            class="[ alphabet-filter ] mt-8 mb-0 gap-[clamp(0.55rem,1.2vw,1.35rem)] compact:mt-4 compact:gap-3"
            controls
            :label="$t('landing.artists.alphabetAria')"
          >
            <template v-for="letter in alphabet" :key="letter">
              <NuxtLink
                v-if="availableArtistLetters.has(letter)"
                class="inline-flex min-h-11 min-w-7 shrink-0 items-center justify-center text-button text-archive-muted no-underline transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red compact:text-sm"
                :to="artistLetterRoute(letter)"
                :aria-label="$t('landing.artists.openLetter', { letter })"
              >
                {{ letter }}
              </NuxtLink>
              <span
                v-else
                class="inline-flex min-h-11 min-w-7 shrink-0 cursor-not-allowed items-center justify-center text-button text-archive-muted opacity-28 compact:text-sm"
                aria-disabled="true"
              >
                {{ letter }}
              </span>
            </template>
          </ArchiveAlphabetRail>

          <div class="[ artist-columns ] archive-artist-column-rule columns-3 gap-10 tablet:columns-2 compact:columns-2 compact:gap-4">
            <LandingArtistGroup
              v-for="group in artistsByLetter"
              :key="group.letter"
              :letter="group.letter"
              :artists="group.artists"
              :open-artist-slug="openLandingArtistSlug"
              @toggle="toggleLandingArtistDetails"
              @close="openLandingArtistSlug = ''"
            />
          </div>
        </div>

        <aside class="[ archive-sidebar ] border-l border-archive-rule-brown/24 pl-10 tablet:border-t-0 tablet:border-l-0 tablet:pt-6 tablet:pl-0 compact:pt-4">
          <ArchiveFactLedger
            class="hidden tablet:grid"
            :items="[
              { label: $t('landing.sidebar.preserved'), value: preservedExhibitionCount },
              { label: $t('landing.sidebar.venues'), value: venues.length },
              { label: $t('landing.sidebar.directory'), value: 'A–Z' }
            ]"
          />
          <div class="tablet:hidden">
            <p class="[ eyebrow ] m-0 mb-3 font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase">{{ $t('landing.sidebar.preserved') }}</p>
            <strong class="[ archive-sidebar-count ] mt-[0.4rem] mb-10 block font-display text-title font-normal">{{ preservedExhibitionCount }}</strong>
            <p class="[ eyebrow ] m-0 mb-3 font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase">{{ $t('landing.sidebar.cities') }}</p>
            <ul class="[ archive-sidebar-locations ] m-0 mb-6 grid list-none gap-[0.45rem] p-0">
              <li v-for="city in sidebarCities" :key="city">{{ city }}</li>
            </ul>
            <a class="[ archive-sidebar-link ] flex items-center gap-2 font-display text-button text-archive-red" href="#venues">{{ $t('landing.sidebar.viewAll') }} <ArchiveArrow class="w-[1.65rem]" /></a>
            <ArchivePaperStack
              stack-id="artist-directory"
              :items="artistStackItems"
              :label="$t('landing.artists.showMore')"
              variant="artist"
              :to="localePath('/artists/')"
            />
          </div>
        </aside>

        <img
          class="[ artists-section-divider ] col-span-full mx-auto mt-2 -mb-8 w-[min(30rem,70vw)] opacity-68"
          src="/media/svg/dividers/artists-section-divider.svg"
          alt=""
          aria-hidden="true"
        />
      </section>

      <section v-if="belowHeroStep >= 5" id="method" class="[ method-section ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(20rem,0.58fr)_minmax(36rem,1.42fr)] gap-x-[clamp(2.5rem,4vw,4.5rem)] gap-y-0 px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:px-4 compact:py-5">
        <div class="[ method-copy ] relative z-1">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('landing.method.eyebrow') }}</p>
          <h2 class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] tracking-normal compact:text-3xl">{{ $t('landing.method.title') }} <span class="text-archive-red">{{ $t('landing.method.accent') }}</span></h2>
          <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('landing.method.intro') }}</p>
          <ArchiveButton class="mt-8 mb-0 w-fit tablet:mb-16 compact:mx-auto compact:mt-5 compact:mb-10 compact:flex" href="#exhibitions">
            {{ $t('landing.method.sample') }}
            <ArchiveArrow />
          </ArchiveButton>
        </div>

        <div class="[ method-image-stack ] relative z-3 isolate compact:mx-[-0.7rem]">
          <img
            class="block h-auto w-full compact:transform-none"
            src="/media/images/landing/method/archive-method-composition.png"
            :alt="$t('landing.method.imageAlt')"
          />
        </div>

        <div class="[ method-steps ] archive-method-steps-frame relative z-1 col-span-full mt-0 grid -translate-y-3.25 grid-cols-3 gap-0 border-16 border-transparent bg-transparent px-[0.6rem] py-[0.35rem] shadow-none compact:translate-y-1.5 compact:grid-cols-1">
          <ArchiveMethodStep
            v-for="(step, index) in methodSteps"
            :key="step.number"
            v-bind="step"
            :divider="index < methodSteps.length - 1"
          />
        </div>

        <div class="[ method-details ] col-span-full grid grid-cols-[minmax(18rem,1.15fr)_minmax(38rem,2.25fr)_8rem] items-center gap-[clamp(2rem,4vw,4.5rem)] px-11 pt-5 tablet:grid-cols-[minmax(16rem,0.8fr)_minmax(32rem,2fr)_6.5rem] tablet:gap-6 tablet:px-6 compact:mt-8 compact:grid-cols-1 compact:gap-4 compact:px-2 compact:pt-4">
          <blockquote class="[ method-quote ] m-0 grid grid-cols-[3rem_1fr] items-start gap-4 compact:mb-4">
            <img class="h-auto w-[2.6rem]" src="/media/images/landing/method/details/quote-mark.png" alt="" aria-hidden="true" />
            <p class="m-0 font-display text-h4 leading-[1.18] text-archive-copy italic">{{ $t('landing.method.quoteBefore') }}<br />{{ $t('landing.method.quoteMiddle') }} <em class="font-normal text-archive-red">{{ $t('landing.method.quoteAccent') }}</em></p>
          </blockquote>

          <dl class="[ method-facts ] m-0 grid grid-cols-3 compact:grid-cols-3 compact:gap-0">
            <ArchiveMethodFact
              v-for="(fact, index) in methodFacts"
              :key="fact.label"
              v-bind="fact"
              :divider="index < methodFacts.length - 1"
            />
          </dl>

          <img
            class="[ method-archive-stamp ] h-auto w-30 opacity-72 tablet:w-24 compact:mx-auto compact:mt-5 compact:mb-8 compact:justify-self-center"
            src="/media/images/landing/method/details/archive-stamp.png"
            :alt="$t('landing.sealAlt')"
          />
        </div>
      </section>

      <ArchiveFooter v-if="belowHeroStep >= 6" />
    </template>
  </main>
</template>

<script setup lang="ts">
import {
  Landmark
} from '@lucide/vue'
import { gsap } from 'gsap'
import { buildArtistDirectory } from '~/utils/artistDirectory'
import type { Exhibition, Venue } from '~/types/content'

const { artists, locations, locationExhibitions } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()
const directoryArtists = computed(() => buildArtistDirectory(artists.value, locationExhibitions.value))

useSeoMeta({
  title: 'PERMAPHEMERA',
  description: () => t('site.seoDescription')
})

const directoryVenues = computed<Venue[]>(() => locations.value.map((location) => ({
  id: `venue-${location.id}`,
  slug: location.slug,
  location_id: location.id,
  name: location.name,
  city: location.city_name,
  address: location.address,
  website_url: location.website_url,
  image: location.image,
  featured: location.featured,
  archive_number: location.archive_number
})))
const featuredVenue = computed(() => directoryVenues.value.find((venue) => venue.featured) ?? directoryVenues.value[0]!)
const otherVenues = computed(() => directoryVenues.value.filter((venue) => venue.id !== featuredVenue.value.id))
const defaultLandingVenueSlugs = new Set([
  'the-smallest-gallery-graz',
  'artelier-contemporary-graz',
  'citygalerie-linz',
  'galerie-verve-vienna',
  'kunstverein-baden'
])
const venueStackVenue = computed(() => otherVenues.value.find((venue) => venue.slug === 'kunstforum-montafon-schruns'))
const regularVenues = computed(() => locationSearchQuery.value.trim()
  ? otherVenues.value
  : otherVenues.value.filter((venue) => defaultLandingVenueSlugs.has(venue.slug)))
const selectedExhibitions = computed<Exhibition[]>(() => [...locationExhibitions.value]
  .sort((left, right) => {
    if (Boolean(left.featured) !== Boolean(right.featured)) return left.featured ? -1 : 1
    return left.start_date.localeCompare(right.start_date)
  })
  .slice(0, 5)
  .map((exhibition) => ({
    id: exhibition.id,
    slug: exhibition.slug,
    title: exhibition.title,
    artist: exhibition.artist,
    venue: exhibition.venue,
    city: exhibition.city,
    date_range: exhibition.date_range,
    image: exhibition.image,
    featured: exhibition.featured
  })))
const featuredExhibition = computed(() => selectedExhibitions.value.find((exhibition) => exhibition.featured) ?? selectedExhibitions.value[0]!)
const sideExhibitions = computed(() => selectedExhibitions.value.filter((exhibition) => exhibition.id !== featuredExhibition.value.id))
const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#']
const artistGroupOrder = ['B', 'E', 'J', 'K', 'L', 'R', 'W']
const locationImagePool = Array.from(
  { length: 40 },
  (_, index) => `/images/landing/locations/location_${String(index + 1).padStart(2, '0')}.png`
)
const heroImages = [
  '/images/landing/parkschloessl.jpg',
  ...locationImagePool.slice(0, 10),
  locationImagePool[0]
]
const venueStackItems = [
  '/images/landing/kaleidoscope/locations/location_07.png',
  '/images/landing/kaleidoscope/locations/location_08.png',
  '/images/landing/kaleidoscope/locations/location_09.png',
  '/images/landing/kaleidoscope/locations/location_10.png'
].map((image, index) => ({ id: `venue-stack-${index + 1}`, image, alt: '' }))
const artistStackItems = Array.from({ length: 5 }, (_, index) => ({ id: `artist-stack-${index + 1}` }))
const kaleidoscopeRef = ref<{
  rotateBy: (direction: number) => void
  replayIntro: () => void
} | null>(null)
const kaleidoscopeAnimating = ref(true)
const wheelControlsRevealed = ref(false)
const wheelControlsRef = ref<HTMLElement | null>(null)
const locationSearchQuery = ref('')
const exhibitionSearchQuery = ref('')
const artistSearchQuery = ref('')
const openLandingArtistSlug = ref('')
const preservedExhibitionCount = computed(() => locationExhibitions.value.length)
const availableArtistLetters = computed(() => new Set(directoryArtists.value.map((artist) => artist.letter)))
const artistLetterRoute = (letter: string) => ({
  path: localePath('/artists/'),
  query: {
    ...(artistSearchQuery.value.trim() ? { q: artistSearchQuery.value.trim() } : {}),
    letter
  }
})

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
    icon: '/images/landing/method/steps/captured.png',
    number: '01',
    title: t('landing.method.steps.captured.title'),
    text: t('landing.method.steps.captured.text')
  },
  {
    icon: '/images/landing/method/steps/connected.png',
    number: '02',
    title: t('landing.method.steps.connected.title'),
    text: t('landing.method.steps.connected.text')
  },
  {
    icon: '/images/landing/method/steps/preserved.png',
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
  const query = locationSearchQuery.value.trim().toLocaleLowerCase()

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
  <main class="[ site-shell ] archive-drafting-canvas relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader skip-target="top" />

    <section
      id="top"
      class="[ hero-section ] [ section-band ] relative mx-auto grid min-h-[calc(100vh-6.4rem)] max-w-[105rem] grid-cols-[minmax(22rem,0.82fr)_minmax(26rem,1.18fr)] items-center gap-[clamp(2.5rem,5vw,6rem)] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3rem,4vw,4.5rem)] pb-[clamp(5.2rem,7vw,6.5rem)] tablet:min-h-[calc(100svh-6rem)] tablet:grid-cols-1 tablet:content-center tablet:gap-3 tablet:pt-2 tablet:pb-20 tablet-landscape:grid-cols-[minmax(16rem,0.82fr)_minmax(19rem,1.18fr)] tablet-landscape:gap-8 tablet-landscape:pt-6 compact:min-h-[calc(100svh-4rem)] compact:gap-2 compact:px-4 compact:pt-1 compact:pb-20"
    >
      <div class="[ hero-copy ] relative tablet:row-start-2 tablet-landscape:col-start-1 tablet-landscape:row-start-1 tablet-portrait:mx-auto tablet-portrait:max-w-3xl tablet-portrait:text-center compact:text-center">
        <h1 class="m-0 max-w-124 font-display text-[clamp(3.35rem,5.35vw,5.85rem)] font-light leading-[0.98] tracking-normal tablet-landscape:max-w-96 tablet-landscape:text-[clamp(2.5rem,4.5vw,4.1rem)] tablet-portrait:max-w-none tablet-portrait:text-center tablet-portrait:text-[clamp(2.5rem,6.4vw,4rem)] tablet-portrait:leading-none compact:max-w-none compact:text-center compact:text-3xl compact:leading-none">
          <span class="tablet-portrait:hidden compact:hidden">
            {{ $t('landing.hero.line1') }}
            <span class="block text-archive-red">{{ $t('landing.hero.line1Accent') }}</span>
            {{ $t('landing.hero.line2') }}
            <span class="block text-archive-red">{{ $t('landing.hero.line2Accent') }}</span>
          </span>
          <span class="hidden tablet-portrait:block compact:block">
            <span class="block">{{ $t('landing.hero.line1') }} <span class="text-archive-red">{{ $t('landing.hero.line1Accent') }}</span></span>
            <span class="block">{{ $t('landing.hero.line2') }} <span class="text-archive-red">{{ $t('landing.hero.line2Accent') }}</span></span>
          </span>
        </h1>
        <p class="mx-0 mt-[1.55rem] mb-[2.2rem] max-w-116 font-display text-[clamp(1.1rem,1.45vw,1.32rem)] leading-tight font-normal text-archive-muted tablet-landscape:mt-4 tablet-landscape:mb-6 tablet-landscape:text-base tablet-portrait:mx-auto tablet-portrait:mt-3 tablet-portrait:mb-4 tablet-portrait:max-w-lg tablet-portrait:text-center tablet-portrait:text-base tablet-portrait:leading-snug compact:mx-auto compact:mt-3 compact:mb-4 compact:max-w-64 compact:text-center compact:text-sm">{{ $t('landing.hero.lede') }}</p>
        <div class="flex flex-wrap items-center gap-[1.3rem] tablet-landscape:gap-3 tablet-portrait:w-full tablet-portrait:flex-nowrap tablet-portrait:justify-center tablet-portrait:gap-2 compact:w-full compact:flex-nowrap compact:justify-center compact:gap-2">
          <ArchiveButton class="tablet-landscape:px-3 tablet-portrait:w-fit tablet-portrait:flex-none tablet-portrait:min-w-0 tablet-portrait:px-2 compact:w-fit compact:flex-none compact:min-w-0 compact:px-2" href="#locations">
            <span class="[ button-icon ] svg-icon svg-icon-archive inline-block size-[1.45rem] flex-none bg-current" aria-hidden="true" />
            <span class="tablet-portrait:hidden compact:hidden">{{ $t('landing.hero.explore') }}</span>
            <span class="hidden tablet-portrait:inline compact:inline">{{ $t('landing.hero.exploreCompact') }}</span>
          </ArchiveButton>
          <ArchiveButton class="min-w-[10.2rem] tablet-landscape:min-w-0 tablet-landscape:px-3 tablet-portrait:w-fit tablet-portrait:flex-none tablet-portrait:min-w-0 tablet-portrait:px-2 compact:w-fit compact:flex-none compact:min-w-0 compact:px-2" variant="secondary" href="#method">
            <Landmark :size="22" />
            <span class="tablet-portrait:hidden compact:hidden">{{ $t('navigation.howItWorks') }}</span>
            <span class="hidden tablet-portrait:inline compact:inline">{{ $t('landing.hero.details') }}</span>
          </ArchiveButton>
        </div>
      </div>

      <div class="[ hero-wheel-area ] grid self-center justify-items-center gap-[clamp(0.9rem,1.8vw,1.45rem)] tablet:row-start-1 tablet-landscape:col-start-2">
        <HeroKaleidoscope
          ref="kaleidoscopeRef"
          :images="heroImages"
          :image-pool="locationImagePool"
          @animation-state-change="handleKaleidoscopeAnimationState"
          @controls-reveal="revealWheelControls"
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
        target="#locations"
        :label="$t('landing.hero.continue')"
      />
    </section>

    <section id="locations" class="[ locations-section ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-8">
      <div class="[ section-heading ] relative z-1 mb-8 compact:mb-4">
        <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-[0.95rem] font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('landing.locations.eyebrow') }}</p>
        <h2 class="m-0 max-w-232 font-display text-[clamp(2.25rem,3.65vw,3.85rem)] font-normal leading-[0.98] tracking-normal compact:text-3xl">{{ $t('landing.locations.title') }} <span class="text-archive-red">{{ $t('landing.locations.accent') }}</span></h2>
        <p class="mt-[0.85rem] mb-0 max-w-216 text-[1.04rem] text-archive-muted compact:mt-2 compact:text-sm">{{ $t('landing.locations.intro') }}</p>
      </div>

      <ArchiveSearchForm
        v-model="locationSearchQuery"
        class="[ location-search ]"
        id="location-search"
        :label="$t('landing.locations.searchLabel')"
        :placeholder="$t('landing.locations.searchPlaceholder')"
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
          v-if="venueStackVenue && !locationSearchQuery"
          stack-id="venue-discovery"
          :items="venueStackItems"
          :label="$t('common.more')"
          variant="venue"
          :to="localePath('/locations/')"
        />
      </div>

      <ArchiveExhibitionsDivider />
    </section>

    <section id="exhibitions" class="[ exhibitions-section ] [ section-band ] relative isolate mx-auto max-w-[105rem] overflow-hidden px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-8">
      <div class="[ section-heading ] relative z-1 mb-8 compact:mb-4">
        <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-[0.95rem] font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('landing.exhibitions.eyebrow') }}</p>
        <h2 class="m-0 max-w-232 font-display text-[clamp(2.25rem,3.65vw,3.85rem)] font-normal leading-[0.98] tracking-normal compact:text-3xl">{{ $t('landing.exhibitions.title') }} <span class="text-archive-red">{{ $t('landing.exhibitions.accent') }}</span></h2>
        <p class="mt-[0.85rem] mb-0 max-w-216 text-[1.04rem] text-archive-muted compact:mt-2 compact:text-sm">{{ $t('landing.exhibitions.intro') }}</p>
      </div>

      <ArchiveSearchForm
        v-model="exhibitionSearchQuery"
        class="[ exhibition-search ]"
        id="exhibition-search"
        :label="$t('landing.exhibitions.searchLabel')"
        :placeholder="$t('landing.exhibitions.searchPlaceholder')"
      />

      <div class="[ exhibition-layout ] grid grid-cols-[minmax(28rem,1.35fr)_minmax(23rem,0.85fr)] gap-8 tablet:grid-cols-1 compact:grid-cols-2 compact:gap-3">
        <LandingExhibitionCard
          class="[ featured-exhibition ] tablet:col-span-full"
          v-show="exhibitionMatchesSearch(featuredExhibition)"
          :exhibition="featuredExhibition"
          variant="featured"
          :href="localePath(`/exhibitions/${featuredExhibition.slug}/`)"
        />

        <div class="[ record-list ] grid h-160 grid-rows-4 gap-[1.05rem] tablet:h-auto tablet:grid-cols-2 tablet:grid-rows-2 tablet:gap-5 compact:contents">
          <LandingExhibitionCard
            v-for="exhibition in sideExhibitions"
            :key="exhibition.id"
            v-show="exhibitionMatchesSearch(exhibition)"
            :exhibition="exhibition"
            :href="localePath(`/exhibitions/${exhibition.slug}/`)"
          />
        </div>
      </div>

      <ArchiveExhibitionsDivider />
    </section>

    <section id="artists" class="[ artists-section ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(0,1fr)_18rem] gap-[clamp(2rem,5vw,4.5rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-5 compact:px-4 compact:py-8">
      <div class="[ artists-main ] min-w-0">
        <div class="[ section-heading ] relative z-1 mb-8 compact:mb-4">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-[0.95rem] font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('landing.artists.eyebrow') }}</p>
          <h2 class="m-0 max-w-232 font-display text-[clamp(2.25rem,3.65vw,3.85rem)] font-normal leading-[0.98] tracking-normal compact:text-3xl">{{ $t('landing.artists.title') }} <span class="text-archive-red">{{ $t('landing.artists.accent') }}</span></h2>
          <p class="mt-[0.85rem] mb-0 max-w-216 text-[1.04rem] text-archive-muted compact:mt-2 compact:text-sm">{{ $t('landing.artists.intro') }}</p>
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
              class="inline-flex min-h-11 min-w-7 shrink-0 items-center justify-center text-[1.05rem] text-archive-muted no-underline transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red compact:text-sm"
              :to="artistLetterRoute(letter)"
              :aria-label="$t('landing.artists.openLetter', { letter })"
            >
              {{ letter }}
            </NuxtLink>
            <span
              v-else
              class="inline-flex min-h-11 min-w-7 shrink-0 cursor-not-allowed items-center justify-center text-[1.05rem] text-archive-muted opacity-28 compact:text-sm"
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
            { label: $t('landing.sidebar.locations'), value: locations.length },
            { label: $t('landing.sidebar.directory'), value: 'A–Z' }
          ]"
        />
        <div class="tablet:hidden">
          <p class="[ eyebrow ] m-0 mb-3 font-display text-[0.95rem] font-medium tracking-[0.06em] text-archive-red uppercase">{{ $t('landing.sidebar.preserved') }}</p>
          <strong class="[ archive-sidebar-count ] mt-[0.4rem] mb-10 block font-display text-[1.45rem] font-normal">{{ preservedExhibitionCount }}</strong>
          <p class="[ eyebrow ] m-0 mb-3 font-display text-[0.95rem] font-medium tracking-[0.06em] text-archive-red uppercase">{{ $t('landing.sidebar.locations') }}</p>
          <ul class="[ archive-sidebar-locations ] m-0 mb-6 grid list-none gap-[0.45rem] p-0">
            <li>{{ $t('landing.sidebar.vienna') }}</li>
            <li>Graz</li>
            <li>Linz</li>
            <li>Salzburg</li>
            <li>Innsbruck</li>
          </ul>
          <a class="[ archive-sidebar-link ] flex items-center gap-2 font-display text-[1.05rem] text-archive-red" href="#locations">{{ $t('landing.sidebar.viewAll') }} <ArchiveArrow class="w-[1.65rem]" /></a>
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
        src="/svg/dividers/artists-section-divider.svg"
        alt=""
        aria-hidden="true"
      />
    </section>

    <section id="method" class="[ method-section ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(20rem,0.58fr)_minmax(36rem,1.42fr)] gap-x-[clamp(2.5rem,4vw,4.5rem)] gap-y-0 px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:px-4 compact:py-8">
      <div class="[ method-copy ] relative z-1">
        <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-[0.95rem] font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('landing.method.eyebrow') }}</p>
        <h2 class="m-0 max-w-232 font-display text-[clamp(2.25rem,3.65vw,3.85rem)] font-normal leading-[0.98] tracking-normal compact:text-3xl">{{ $t('landing.method.title') }} <span class="text-archive-red">{{ $t('landing.method.accent') }}</span></h2>
        <p class="mt-[0.85rem] mb-0 max-w-216 text-[1.04rem] text-archive-muted compact:mt-2 compact:text-sm">{{ $t('landing.method.intro') }}</p>
        <ArchiveButton class="mt-8 mb-0 w-fit tablet:mb-16 compact:mx-auto compact:mt-5 compact:mb-10 compact:flex" href="#exhibitions">
          {{ $t('landing.method.sample') }}
          <ArchiveArrow />
        </ArchiveButton>
      </div>

      <div class="[ method-image-stack ] relative z-3 isolate compact:mx-[-0.7rem]">
        <img
          class="block h-auto w-full compact:transform-none"
          src="/images/landing/method/archive-method-composition.png"
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
          <img class="h-auto w-[2.6rem]" src="/images/landing/method/details/quote-mark.png" alt="" aria-hidden="true" />
          <p class="m-0 font-display text-[clamp(1.25rem,1.65vw,1.65rem)] leading-[1.18] text-[#493c2f] italic">{{ $t('landing.method.quoteBefore') }}<br />{{ $t('landing.method.quoteMiddle') }} <em class="font-normal text-archive-red">{{ $t('landing.method.quoteAccent') }}</em></p>
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
          src="/images/landing/method/details/archive-stamp.png"
          :alt="$t('landing.sealAlt')"
        />
      </div>
    </section>

    <ArchiveFooter />
  </main>
</template>

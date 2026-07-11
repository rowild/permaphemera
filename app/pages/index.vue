<script setup lang="ts">
import {
  Landmark,
  Search
} from '@lucide/vue'
import { gsap } from 'gsap'

const { artists, exhibitions, sponsors, venues } = useArchiveData()

const featuredVenue = venues.find((venue) => venue.featured) ?? venues[0]
const otherVenues = venues.filter((venue) => venue.id !== featuredVenue.id)
const featuredExhibition = exhibitions.find((exhibition) => exhibition.featured) ?? exhibitions[0]
const sideExhibitions = exhibitions.filter((exhibition) => exhibition.id !== featuredExhibition.id)
const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#']
const highlightedLetters = ['A', 'B', 'K', 'L', 'R', 'V', 'W']
const artistGroupOrder = ['A', 'B', 'G', 'K', 'L', 'R', 'V', 'W']
const artistGroupBySlug: Record<string, string> = {
  'anselm-kiefer': 'A',
  'brigitte-kowanz': 'B',
  'birgit-juergenssen': 'B',
  'guenter-brus': 'G',
  'oskar-kokoschka': 'K',
  'maria-lassnig': 'L',
  'raqs-media-collective': 'R',
  'valie-export': 'V',
  'franz-west': 'W'
}
const heroImages = [
  '/images/landing/parkschloessl.jpg',
  ...Array.from(
    { length: 10 },
    (_, index) => `/images/landing/kaleidoscope/locations/location_${String(index + 1).padStart(2, '0')}.png`
  ),
  '/images/landing/kaleidoscope/locations/location_01.png'
]
const venueStackImages = [
  '/images/landing/kaleidoscope/locations/location_07.png',
  '/images/landing/kaleidoscope/locations/location_08.png',
  '/images/landing/kaleidoscope/locations/location_09.png',
  '/images/landing/kaleidoscope/locations/location_10.png'
]
const kaleidoscopeRef = ref<{ rotateBy: (direction: number) => void } | null>(null)
const venueStackRef = ref<HTMLElement | null>(null)
const artistStackRef = ref<HTMLElement | null>(null)
const sponsorStripRef = ref<HTMLElement | null>(null)
let sponsorDragStartX = 0
let sponsorDragStartScroll = 0
let sponsorDragging = false
const locationSearchQuery = ref('')
const exhibitionSearchQuery = ref('')
const artistSearchQuery = ref('')
const preservedExhibitionCount = exhibitions.length
const methodSteps = [
  {
    icon: '/images/landing/method/steps/captured.png',
    number: '01',
    title: 'Captured',
    text: 'Panoramas, perspectives, and details are recorded on site with care and precision.'
  },
  {
    icon: '/images/landing/method/steps/connected.png',
    number: '02',
    title: 'Connected',
    text: 'Viewpoints are linked to recreate how the exhibition unfolded in space.'
  },
  {
    icon: '/images/landing/method/steps/preserved.png',
    number: '03',
    title: 'Preserved',
    text: 'The experience remains navigable long after the exhibition has ended.'
  }
]

const startSponsorDrag = (event: PointerEvent) => {
  const strip = sponsorStripRef.value
  if (!strip) return

  sponsorDragging = true
  sponsorDragStartX = event.clientX
  sponsorDragStartScroll = strip.scrollLeft
  strip.setPointerCapture(event.pointerId)
  strip.classList.add('is-dragging')
}

const moveSponsorDrag = (event: PointerEvent) => {
  const strip = sponsorStripRef.value
  if (!strip || !sponsorDragging) return

  strip.scrollLeft = sponsorDragStartScroll - (event.clientX - sponsorDragStartX)
}

const endSponsorDrag = (event: PointerEvent) => {
  const strip = sponsorStripRef.value
  if (!strip || !sponsorDragging) return

  sponsorDragging = false
  if (strip.hasPointerCapture(event.pointerId)) strip.releasePointerCapture(event.pointerId)
  strip.classList.remove('is-dragging')
}

const artistsByLetter = computed(() => {
  const query = artistSearchQuery.value.trim().toLocaleLowerCase()

  return artistGroupOrder
    .map((letter) => ({
      letter,
      artists: artists.filter((artist) => {
        if (artistGroupBySlug[artist.slug] !== letter) {
          return false
        }

        return !query || [artist.name, artist.location, artist.years]
          .some((value) => value.toLocaleLowerCase().includes(query))
      })
    }))
    .filter((group) => group.artists.length)
})

const venueMatchesSearch = (venue: (typeof venues)[number]) => {
  const query = locationSearchQuery.value.trim().toLocaleLowerCase()

  return !query || [venue.name, venue.city, venue.address]
    .some((value) => value.toLocaleLowerCase().includes(query))
}

const exhibitionMatchesSearch = (exhibition: (typeof exhibitions)[number]) => {
  const query = exhibitionSearchQuery.value.trim().toLocaleLowerCase()

  return !query || [
    exhibition.title,
    exhibition.artist,
    exhibition.venue,
    exhibition.city,
    exhibition.date_range
  ].some((value) => value.toLocaleLowerCase().includes(query))
}

const setVenueStackRef = (element: unknown, slug: string) => {
  if (slug === 'kunsthalle-innsbruck') {
    venueStackRef.value = element instanceof HTMLElement ? element : null
  }
}

const stackFrameRest = [
  { x: -12, y: 7, rotate: -5 },
  { x: 11, y: 8, rotate: 4.5 },
  { x: -6, y: -6, rotate: -2.5 },
  { x: 7, y: -3, rotate: 2 }
]

const stackFrameHover = [
  { x: -24, y: 13, rotate: -7.2 },
  { x: 23, y: 11, rotate: 6.2 },
  { x: -11, y: -13, rotate: -4 },
  { x: 16, y: -9, rotate: 3.4 }
]

const getVenueStackFrames = () => {
  if (!venueStackRef.value) {
    return []
  }

  return gsap.utils.toArray<HTMLElement>(venueStackRef.value.querySelectorAll('.venue-stack-frame'))
}

const getVenuePaperclips = () => {
  if (!venueStackRef.value) {
    return []
  }

  return gsap.utils.toArray<HTMLElement>(venueStackRef.value.querySelectorAll('.venue-paperclip'))
}

const spreadVenueStack = () => {
  if (!venueStackRef.value) {
    return
  }

  const frames = getVenueStackFrames()
  const paperclips = getVenuePaperclips()
  gsap.killTweensOf(frames)
  gsap.killTweensOf(paperclips)
  gsap.to(frames, {
    x: (index) => stackFrameHover[index]?.x ?? 0,
    y: (index) => stackFrameHover[index]?.y ?? 0,
    rotate: (index) => stackFrameHover[index]?.rotate ?? 0,
    duration: 0.34,
    ease: 'power2.out',
    stagger: 0.018
  })
  gsap.to(paperclips, {
    y: -6,
    rotate: 5,
    duration: 0.34,
    ease: 'power2.out'
  })
}

const settleVenueStack = () => {
  if (!venueStackRef.value) {
    return
  }

  const frames = getVenueStackFrames()
  const paperclips = getVenuePaperclips()
  gsap.killTweensOf(frames)
  gsap.killTweensOf(paperclips)
  gsap.to(frames, {
    x: (index) => stackFrameRest[index]?.x ?? 0,
    y: (index) => stackFrameRest[index]?.y ?? 0,
    rotate: (index) => stackFrameRest[index]?.rotate ?? 0,
    duration: 0.28,
    ease: 'power2.out'
  })
  gsap.to(paperclips, {
    y: 0,
    rotate: 0,
    duration: 0.28,
    ease: 'power2.out'
  })
}

const artistStackRest = [
  { x: -8, y: 7, rotate: -4 },
  { x: 9, y: 6, rotate: 3.5 },
  { x: -4, y: -4, rotate: -1.8 },
  { x: 5, y: -2, rotate: 1.4 },
  { x: 0, y: 0, rotate: -0.4 }
]

const artistStackHover = [
  { x: -16, y: 12, rotate: -6 },
  { x: 18, y: 10, rotate: 5.5 },
  { x: -9, y: -10, rotate: -3 },
  { x: 11, y: -7, rotate: 2.6 },
  { x: 2, y: -2, rotate: 0 }
]

const animateArtistStack = (expanded: boolean) => {
  if (!artistStackRef.value) {
    return
  }

  const sheets = gsap.utils.toArray<HTMLElement>(artistStackRef.value.querySelectorAll('.artist-stack-sheet'))
  const paperclips = gsap.utils.toArray<HTMLElement>(artistStackRef.value.querySelectorAll('.venue-paperclip'))
  const targets = expanded ? artistStackHover : artistStackRest

  gsap.killTweensOf([...sheets, ...paperclips])
  gsap.to(sheets, {
    x: (index) => targets[index]?.x ?? 0,
    y: (index) => targets[index]?.y ?? 0,
    rotate: (index) => targets[index]?.rotate ?? 0,
    duration: expanded ? 0.36 : 0.28,
    ease: 'power2.out',
    stagger: expanded ? 0.018 : 0
  })
  gsap.to(paperclips, {
    y: expanded ? -5 : 0,
    rotate: expanded ? 5 : 0,
    duration: expanded ? 0.36 : 0.28,
    ease: 'power2.out'
  })
}
</script>

<template>
  <main class="site-shell">
    <span class="global-right-ruler" aria-hidden="true" />
    <header class="site-header">
      <a class="brand" href="#top" aria-label="PERMAPHEMERA home">PERMAPHEMERA</a>
      <nav class="desktop-nav" aria-label="Primary navigation">
        <a href="#locations">Archive</a>
        <a href="#locations">Galleries</a>
        <a href="#artists">Artists</a>
        <a href="#exhibitions">Exhibitions</a>
        <a href="#method">About</a>
      </nav>
      <div class="header-actions">
        <div class="language-switch" aria-label="Language switcher">
          <a href="/" aria-current="page">EN</a>
          <span>/</span>
          <a href="/">DE</a>
        </div>
        <button class="icon-button mobile-menu" type="button" aria-label="Open menu">
          <span class="svg-icon svg-icon-menu" aria-hidden="true" />
        </button>
        <span class="desktop-compass svg-icon svg-icon-menu" aria-hidden="true" />
      </div>
    </header>

    <section id="top" class="hero-section section-band">
      <div class="hero-copy">
        <h1>
          Ephemeral
          <span>worlds.</span>
          Permanently
          <span>preserved.</span>
        </h1>
        <p class="hero-lede">A curated archive of temporary exhibitions and spatial memories.</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#locations">
            <span class="button-icon svg-icon svg-icon-archive" aria-hidden="true" />
            Explore the archive
          </a>
          <a class="button button-secondary" href="#method">
            <Landmark :size="22" />
            How it works
          </a>
        </div>
      </div>

      <div class="hero-wheel-area">
        <HeroKaleidoscope ref="kaleidoscopeRef" :images="heroImages" />

        <div class="wheel-controls" aria-label="Kaleidoscope navigation">
          <button
            class="wheel-control wheel-control-left"
            type="button"
            aria-label="Rotate kaleidoscope counterclockwise"
            @click="kaleidoscopeRef?.rotateBy(-1)"
          >
            <span class="wheel-control-plane" aria-hidden="true" />
          </button>
          <button
            class="wheel-control wheel-control-up"
            type="button"
            aria-label="Rotate kaleidoscope forward"
            @click="kaleidoscopeRef?.rotateBy(1)"
          >
            <span class="wheel-control-plane" aria-hidden="true" />
          </button>
          <button
            class="wheel-control wheel-control-right"
            type="button"
            aria-label="Rotate kaleidoscope clockwise"
            @click="kaleidoscopeRef?.rotateBy(1)"
          >
            <span class="wheel-control-plane" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>

    <section id="locations" class="section-band locations-section">
      <div class="section-heading">
        <p class="eyebrow">Locations</p>
        <h2>Galleries across <span>Austria.</span></h2>
        <p>Explore exhibition spaces and archives in cities and towns across the country.</p>
      </div>

      <form class="search-bar location-search" role="search" @submit.prevent>
        <div class="search-field-frame">
          <Search :size="24" />
          <label class="sr-only" for="location-search">Search locations</label>
          <input
            id="location-search"
            v-model="locationSearchQuery"
            name="location-search"
            type="search"
            placeholder="Search locations by gallery, city or town..."
          />
        </div>
        <button type="submit">
          <span>Search</span>
          <ArchiveArrow />
        </button>
      </form>

      <div class="venue-grid">
        <a
          v-show="venueMatchesSearch(featuredVenue)"
          class="venue-card venue-card-featured"
          href="#locations"
          :aria-label="`Open ${featuredVenue.name} archive`"
        >
          <span class="venue-card-media">
            <VenueMaskedImage :src="featuredVenue.image" :alt="featuredVenue.name" />
          </span>
          <div class="venue-card-body">
            <h3>{{ featuredVenue.name }}</h3>
            <p>{{ featuredVenue.city }}</p>
            <span class="venue-card-divider" aria-hidden="true" />
            <span class="venue-card-link">Open archive <ArchiveArrow /></span>
          </div>
          <VenueCardFrame />
        </a>

        <component
          v-for="venue in otherVenues"
          :key="venue.id"
          :is="venue.slug === 'kunsthalle-innsbruck' ? 'article' : 'a'"
          v-show="venueMatchesSearch(venue)"
          class="venue-card"
          :class="{ 'venue-card-stack': venue.slug === 'kunsthalle-innsbruck' }"
          :href="venue.slug === 'kunsthalle-innsbruck' ? undefined : '#locations'"
          :aria-label="venue.slug === 'kunsthalle-innsbruck' ? 'Show more locations' : `Open ${venue.name} archive`"
          :ref="(element) => setVenueStackRef(element, venue.slug)"
          @mouseenter="venue.slug === 'kunsthalle-innsbruck' && spreadVenueStack()"
          @mouseleave="venue.slug === 'kunsthalle-innsbruck' && settleVenueStack()"
        >
          <template v-if="venue.slug === 'kunsthalle-innsbruck'">
            <span class="venue-paperclip venue-paperclip-behind" aria-hidden="true" />
            <span
              v-for="(image, index) in venueStackImages"
              :key="image"
              class="venue-stack-frame"
              :class="`venue-stack-frame-${index + 1}`"
              aria-hidden="true"
            >
              <VenueMaskedImage :src="image" alt="" shape="frame" />
              <VenueCardFrame />
            </span>
            <button class="button button-primary venue-stack-button" type="button">
              Show more
              <ArchiveArrow />
            </button>
            <span class="venue-paperclip venue-paperclip-front" aria-hidden="true" />
          </template>
          <span v-if="venue.slug !== 'kunsthalle-innsbruck'" class="venue-card-media">
            <VenueMaskedImage :src="venue.image" :alt="venue.name" />
          </span>
          <div v-if="venue.slug !== 'kunsthalle-innsbruck'" class="venue-card-body">
            <h3>{{ venue.name }}</h3>
            <p>{{ venue.city }}</p>
            <span class="venue-card-link">Open archive <ArchiveArrow /></span>
          </div>
          <VenueCardFrame v-if="venue.slug !== 'kunsthalle-innsbruck'" />
        </component>
      </div>

      <button class="button button-primary section-cta" type="button">
        Show more
        <ArchiveArrow />
      </button>
    </section>

    <section id="exhibitions" class="section-band exhibitions-section">
      <div class="section-heading">
        <p class="eyebrow">Exhibitions</p>
        <h2>Temporary encounters. <span>Lasting traces.</span></h2>
        <p>Selected exhibitions preserved as navigable spatial records.</p>
      </div>

      <form class="search-bar exhibition-search" role="search" @submit.prevent>
        <div class="search-field-frame">
          <Search :size="24" />
          <label class="sr-only" for="exhibition-search">Search exhibitions</label>
          <input
            id="exhibition-search"
            v-model="exhibitionSearchQuery"
            name="exhibition-search"
            type="search"
            placeholder="Search exhibitions by title, artist or year..."
          />
        </div>
        <button type="submit">
          <span>Search</span>
          <ArchiveArrow />
        </button>
      </form>

      <div class="exhibition-layout">
        <ExhibitionFrameCard
          v-show="exhibitionMatchesSearch(featuredExhibition)"
          class="featured-record"
          href="#method"
          :aria-label="`Open ${featuredExhibition.title} record`"
        >
          <img :src="featuredExhibition.image" :alt="featuredExhibition.title" />
          <div class="record-overlay">
            <div>
              <h3>{{ featuredExhibition.title }}</h3>
              <p class="artist-name">{{ featuredExhibition.artist }}</p>
              <span class="record-divider" aria-hidden="true" />
              <p class="record-meta-line">
                <span class="record-meta-icon record-meta-icon-location" aria-hidden="true" />
                {{ featuredExhibition.venue }}, {{ featuredExhibition.city }}
              </p>
              <p class="record-meta-line">
                <span class="record-meta-icon record-meta-icon-calendar" aria-hidden="true" />
                {{ featuredExhibition.date_range }}
              </p>
            </div>
            <span class="button button-primary record-primary-label">
              Enter 360 record
              <ArchiveArrow />
            </span>
          </div>
          <span class="record-embellishment" aria-hidden="true" />
        </ExhibitionFrameCard>

        <div class="record-list">
          <ExhibitionFrameCard
            v-for="exhibition in sideExhibitions"
            :key="exhibition.id"
            v-show="exhibitionMatchesSearch(exhibition)"
            class="record-card"
            href="#exhibitions"
            :aria-label="`Open ${exhibition.title} record`"
          >
            <img class="record-card-image" :src="exhibition.image" :alt="exhibition.title" />
            <div class="record-card-copy">
              <h3>{{ exhibition.artist }}. {{ exhibition.title }}</h3>
              <p class="artist-name">{{ exhibition.artist }}</p>
              <p class="record-meta-line">
                <span class="record-meta-icon record-meta-icon-location" aria-hidden="true" />
                {{ exhibition.venue }}, {{ exhibition.city }}
              </p>
              <p class="record-meta-line">
                <span class="record-meta-icon record-meta-icon-calendar" aria-hidden="true" />
                {{ exhibition.date_range }}
              </p>
              <span class="record-link-label">Open record <ArchiveArrow /></span>
            </div>
            <span class="record-embellishment" aria-hidden="true" />
          </ExhibitionFrameCard>
        </div>
      </div>

      <img
        class="exhibitions-section-divider"
        src="/images/landing/exhibitions/background/exhibitions-section-divider.png"
        alt=""
        aria-hidden="true"
      />
    </section>

    <section id="artists" class="section-band artists-section">
      <div class="artists-main">
        <div class="section-heading">
          <p class="eyebrow">Artists</p>
          <h2>Artists in the <span>archive.</span></h2>
          <p>Browse practices documented across temporary exhibitions.</p>
        </div>

        <form class="search-bar artist-search" role="search" @submit.prevent>
          <div class="search-field-frame">
            <Search :size="22" />
            <label class="sr-only" for="artist-search">Search artists</label>
            <input
              id="artist-search"
              v-model="artistSearchQuery"
              name="artist-search"
              type="search"
              placeholder="Search artists by name..."
            />
          </div>
          <button type="submit"><span>Search</span> <ArchiveArrow /></button>
        </form>

        <div class="alphabet-filter" aria-label="Artist alphabet filter">
          <button
            v-for="letter in alphabet"
            :key="letter"
            type="button"
            :class="{ active: highlightedLetters.includes(letter) }"
          >
            {{ letter }}
          </button>
        </div>

        <div class="artist-columns">
          <div v-for="group in artistsByLetter" :key="group.letter" class="artist-group">
            <h3>{{ group.letter }}</h3>
            <article v-for="artist in group.artists" :key="artist.id" class="artist-row">
              <div>
                <a href="#artists">{{ artist.name }}</a>
                <p>{{ artist.location }} &middot; {{ artist.years }}</p>
              </div>
              <span>{{ artist.record_count }} {{ artist.record_count === 1 ? 'record' : 'records' }}</span>
              <ArchiveArrow />
            </article>
          </div>
        </div>
      </div>

      <aside class="archive-sidebar">
        <p class="eyebrow">Exhibitions preserved</p>
        <strong>{{ preservedExhibitionCount }}</strong>
        <p class="eyebrow">Locations</p>
        <ul>
          <li>Wien</li>
          <li>Graz</li>
          <li>Linz</li>
          <li>Salzburg</li>
          <li>Innsbruck</li>
        </ul>
        <a href="#locations">View all locations <ArchiveArrow /></a>
        <a
          ref="artistStackRef"
          class="artist-paper-stack"
          href="#artists"
          aria-label="Show more artists"
          @mouseenter="animateArtistStack(true)"
          @mouseleave="animateArtistStack(false)"
        >
          <span class="venue-paperclip venue-paperclip-behind artist-paperclip" aria-hidden="true" />
          <span v-for="sheet in 5" :key="sheet" class="artist-stack-sheet" aria-hidden="true">
            <VenueCardFrame />
          </span>
          <span class="artist-stack-label">Show more artists <ArchiveArrow /></span>
          <span class="venue-paperclip venue-paperclip-front artist-paperclip" aria-hidden="true" />
        </a>
      </aside>

      <img
        class="artists-section-divider"
        src="/images/landing/artists/section-divider.png"
        alt=""
        aria-hidden="true"
      />
    </section>

    <section id="method" class="section-band method-section">
      <div class="method-copy">
        <p class="eyebrow">The archive method</p>
        <h2>An exhibition, retained in <span>space.</span></h2>
        <p>We capture what cannot be kept: the atmosphere, the arrangement, the flow of an exhibition as it unfolded in time and space.</p>
        <a class="button button-primary" href="#exhibitions">
          Explore a sample record
          <ArchiveArrow />
        </a>
      </div>

      <div class="method-image-stack">
        <img
          src="/images/landing/method/archive-method-composition.png"
          alt="Layered archival papers framing a museum walkthrough with connected navigation points"
        />
      </div>

      <div class="method-steps">
        <article v-for="step in methodSteps" :key="step.number">
          <img class="method-step-icon" :src="step.icon" alt="" aria-hidden="true" />
          <div>
            <p class="method-step-number">
              {{ step.number }}
            </p>
            <h3>{{ step.title }}</h3>
            <span>{{ step.text }}</span>
          </div>
        </article>
      </div>

      <div class="method-details">
        <blockquote class="method-quote">
          <img src="/images/landing/method/details/quote-mark.png" alt="" aria-hidden="true" />
          <p>Not a replica.<br />A record of <em>presence.</em></p>
        </blockquote>

        <dl class="method-facts">
          <div>
            <dt>Technology</dt>
            <dd>360° Capture<br />&amp; Spatial Mapping</dd>
          </div>
          <div>
            <dt>Curation</dt>
            <dd>Selected Exhibitions<br />Across Austria</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Pilot Archive<br />In Development</dd>
          </div>
        </dl>

        <img
          class="method-archive-stamp"
          src="/images/landing/method/details/archive-stamp.png"
          alt="Permaphemera Archive"
        />
      </div>
    </section>

    <footer class="site-footer">
      <section class="supporters">
        <p class="eyebrow">Supporters & partners</p>
        <h2>Supported by institutions that care for <span>cultural memory.</span></h2>
        <div class="sponsor-frame">
          <div
            ref="sponsorStripRef"
            class="sponsor-strip"
            aria-label="Supporters and partners"
            @pointerdown="startSponsorDrag"
            @pointermove="moveSponsorDrag"
            @pointerup="endSponsorDrag"
            @pointercancel="endSponsorDrag"
          >
            <div class="sponsor-track">
              <template v-for="(sponsor, index) in sponsors" :key="sponsor.id">
                <div class="sponsor-mark">
                  <img
                    :src="`/images/landing/sponsors/${sponsor.id}.png`"
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                  />
                  <span>{{ sponsor.name }}</span>
                </div>
                <img
                  v-if="index < sponsors.length - 1"
                  class="sponsor-divider"
                  src="/images/landing/sponsors/divider.png"
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                />
              </template>
            </div>
          </div>
          <p class="sponsor-scroll-hint"><ArchiveArrow direction="left" /> Scroll to explore more partners <ArchiveArrow /></p>
        </div>
      </section>

      <section class="footer-links">
        <div class="footer-brand">
          <strong>PERMAPHEMERA</strong>
          <img class="footer-brand-rule" src="/images/landing/footer/details/brand-rule.png" alt="" aria-hidden="true" />
          <p>A curated Austrian archive of 360-degree exhibition documentation.</p>
          <div class="language-switch">
            <a href="/" aria-current="page">EN</a>
            <span>/</span>
            <a href="/">DE</a>
          </div>
        </div>
        <nav aria-label="Footer explore navigation">
          <p>Explore</p>
          <a href="#locations">Archive</a>
          <a href="#locations">Galleries</a>
          <a href="#artists">Artists</a>
          <a href="#exhibitions">Exhibitions</a>
        </nav>
        <nav aria-label="Footer information navigation">
          <p>Information</p>
          <a href="#method">About</a>
          <a href="#method">How it works</a>
          <a href="mailto:archive@example.test">Contact</a>
        </nav>
        <nav aria-label="Footer legal navigation">
          <p>Legal</p>
          <a href="/">Imprint</a>
          <a href="/">Privacy Policy</a>
          <a href="/">Terms & Conditions</a>
          <a href="/">Accessibility</a>
          <a href="/">Cookies</a>
        </nav>
        <img
          class="footer-seal"
          src="/images/landing/footer/permanently-preserved-stamp.png"
          alt="Permanently preserved, temporarily enduring"
        />
      </section>

      <div class="footer-bottom">
        <div class="footer-bottom-group footer-bottom-left">
          <span>&copy; 2026 PERMAPHEMERA. All rights reserved.</span>
        </div>
        <div class="footer-bottom-group footer-bottom-center-group">
          <img class="footer-bottom-center" src="/images/landing/footer/details/copyright-center.png" alt="" aria-hidden="true" />
        </div>
        <div class="footer-bottom-group footer-bottom-right">
          <span>Curated independently in Austria.</span>
          <img class="footer-bottom-end" src="/images/landing/footer/details/copyright-end.png" alt="" aria-hidden="true" />
        </div>
      </div>
    </footer>
  </main>
</template>

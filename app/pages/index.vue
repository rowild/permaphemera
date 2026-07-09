<script setup lang="ts">
import {
  Building2,
  CalendarDays,
  Eye,
  Landmark,
  Route,
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
const heroImages = [
  '/images/landing/parkschloessl.jpg',
  ...Array.from(
    { length: 10 },
    (_, index) => `/images/landing/kaleidoscope/locations/location_${String(index + 1).padStart(2, '0')}.png`
  ),
  '/images/landing/kaleidoscope/locations/location_01.png'
]
const kaleidoscopeRef = ref<{ rotateBy: (direction: number) => void } | null>(null)
const venueStackRef = ref<HTMLElement | null>(null)
const methodSteps = [
  {
    icon: Building2,
    number: '01',
    title: 'Captured',
    text: 'Panoramas, perspectives, and details are recorded on site with care and precision.'
  },
  {
    icon: Route,
    number: '02',
    title: 'Connected',
    text: 'Viewpoints are linked to recreate how the exhibition unfolded in space.'
  },
  {
    icon: Eye,
    number: '03',
    title: 'Preserved',
    text: 'The experience remains navigable long after the exhibition has ended.'
  }
]

const artistsByLetter = computed(() => {
  return highlightedLetters
    .map((letter) => ({
      letter,
      artists: artists.filter((artist) => artist.name.startsWith(letter))
    }))
    .filter((group) => group.artists.length)
})

const setVenueStackRef = (element: unknown, slug: string) => {
  if (slug === 'kunsthalle-innsbruck') {
    venueStackRef.value = element instanceof HTMLElement ? element : null
  }
}

const stackFrameRest = [
  { x: -12, y: 7, rotate: -5 },
  { x: 11, y: 8, rotate: 4.5 },
  { x: -6, y: -6, rotate: -2.5 },
  { x: 7, y: -3, rotate: 2 },
  { x: 0, y: 0, rotate: -0.6 }
]

const stackFrameHover = [
  { x: -24, y: 13, rotate: -7.2 },
  { x: 23, y: 11, rotate: 6.2 },
  { x: -11, y: -13, rotate: -4 },
  { x: 16, y: -9, rotate: 3.4 },
  { x: 3, y: -3, rotate: -0.2 }
]

const getVenueStackFrames = () => {
  if (!venueStackRef.value) {
    return []
  }

  return gsap.utils.toArray<HTMLElement>(venueStackRef.value.querySelectorAll('.venue-stack-frame'))
}

const spreadVenueStack = () => {
  if (!venueStackRef.value) {
    return
  }

  const frames = getVenueStackFrames()
  gsap.killTweensOf(frames)
  gsap.to(frames, {
    x: (index) => stackFrameHover[index]?.x ?? 0,
    y: (index) => stackFrameHover[index]?.y ?? 0,
    rotate: (index) => stackFrameHover[index]?.rotate ?? 0,
    duration: 0.34,
    ease: 'power2.out',
    stagger: 0.018
  })
}

const settleVenueStack = () => {
  if (!venueStackRef.value) {
    return
  }

  const frames = getVenueStackFrames()
  gsap.killTweensOf(frames)
  gsap.to(frames, {
    x: (index) => stackFrameRest[index]?.x ?? 0,
    y: (index) => stackFrameRest[index]?.y ?? 0,
    rotate: (index) => stackFrameRest[index]?.rotate ?? 0,
    duration: 0.28,
    ease: 'power2.out'
  })
}
</script>

<template>
  <main class="site-shell">
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

      <form class="search-bar" action="#locations">
        <div class="search-field-frame">
          <Search :size="24" />
          <label class="sr-only" for="archive-search">Search archive</label>
          <input id="archive-search" type="search" placeholder="Search by gallery, artist, exhibition, date..." />
        </div>
        <button type="submit">
          <span>Search</span>
          <ArchiveArrow />
        </button>
      </form>

      <div class="venue-grid">
        <article class="venue-card venue-card-featured">
          <span class="venue-card-media">
            <img :src="featuredVenue.image" :alt="featuredVenue.name" />
          </span>
          <div class="venue-card-body">
            <h3>{{ featuredVenue.name }}</h3>
            <p>{{ featuredVenue.city }}</p>
            <a href="#locations">Open archive <ArchiveArrow /></a>
          </div>
        </article>

        <article
          v-for="venue in otherVenues"
          :key="venue.id"
          class="venue-card"
          :class="{ 'venue-card-stack': venue.slug === 'kunsthalle-innsbruck' }"
          :aria-label="venue.slug === 'kunsthalle-innsbruck' ? venue.name : undefined"
          :ref="(element) => setVenueStackRef(element, venue.slug)"
          @mouseenter="venue.slug === 'kunsthalle-innsbruck' && spreadVenueStack()"
          @mouseleave="venue.slug === 'kunsthalle-innsbruck' && settleVenueStack()"
        >
          <template v-if="venue.slug === 'kunsthalle-innsbruck'">
            <span class="venue-paperclip venue-paperclip-behind" aria-hidden="true" />
            <span
              v-for="frameIndex in 5"
              :key="frameIndex"
              class="venue-stack-frame"
              aria-hidden="true"
            >
              <img :src="venue.image" alt="" />
            </span>
            <button class="button button-primary venue-stack-button" type="button">
              Show more
              <ArchiveArrow />
            </button>
            <span class="venue-paperclip venue-paperclip-front" aria-hidden="true" />
          </template>
          <span v-if="venue.slug !== 'kunsthalle-innsbruck'" class="venue-card-media">
            <img :src="venue.image" :alt="venue.name" />
          </span>
          <div v-if="venue.slug !== 'kunsthalle-innsbruck'" class="venue-card-body">
            <h3>{{ venue.name }}</h3>
            <p>{{ venue.city }}</p>
            <a href="#locations">Open archive <ArchiveArrow /></a>
          </div>
        </article>
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

      <div class="exhibition-layout">
        <article class="featured-record">
          <img :src="featuredExhibition.image" :alt="featuredExhibition.title" />
          <button class="record-arrow record-arrow-left" type="button" aria-label="Previous exhibition">
            <ArchiveArrow direction="left" />
          </button>
          <button class="record-arrow record-arrow-right" type="button" aria-label="Next exhibition">
            <ArchiveArrow />
          </button>
          <div class="record-overlay">
            <div>
              <h3>{{ featuredExhibition.title }}</h3>
              <p class="artist-name">{{ featuredExhibition.artist }}</p>
              <p>{{ featuredExhibition.venue }}, {{ featuredExhibition.city }}</p>
              <p class="date-line"><CalendarDays :size="18" /> {{ featuredExhibition.date_range }}</p>
            </div>
            <a class="button button-primary" href="#method">
              Enter 360 record
              <ArchiveArrow />
            </a>
          </div>
        </article>

        <div class="record-list">
          <article v-for="exhibition in sideExhibitions" :key="exhibition.id" class="record-card">
            <img :src="exhibition.image" :alt="exhibition.title" />
            <div>
              <h3>{{ exhibition.artist }}. {{ exhibition.title }}</h3>
              <p class="artist-name">{{ exhibition.artist }}</p>
              <p>{{ exhibition.venue }}, {{ exhibition.city }}</p>
              <p class="date-line"><CalendarDays :size="16" /> {{ exhibition.date_range }}</p>
              <a href="#exhibitions">Open record <ArchiveArrow /></a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="artists" class="section-band artists-section">
      <div class="artists-main">
        <div class="section-heading">
          <p class="eyebrow">Artists</p>
          <h2>Artists in the <span>archive.</span></h2>
          <p>Browse practices documented across temporary exhibitions.</p>
        </div>

        <form class="artist-search" action="#artists">
          <Search :size="22" />
          <label class="sr-only" for="artist-search">Search artists</label>
          <input id="artist-search" type="search" placeholder="Search artist, exhibition, gallery or year..." />
          <button type="submit">Search <ArchiveArrow /></button>
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
        <p class="eyebrow">Archive span</p>
        <strong>1926-2025</strong>
        <p class="eyebrow">Locations</p>
        <ul>
          <li>Wien</li>
          <li>Graz</li>
          <li>Linz</li>
          <li>Salzburg</li>
          <li>Innsbruck</li>
        </ul>
        <a href="#locations">View all locations <ArchiveArrow /></a>
        <button class="paper-note" type="button">
          Show more artists
          <ArchiveArrow />
        </button>
      </aside>
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
        <div class="paper-layer paper-layer-back" />
        <div class="paper-layer paper-layer-mid" />
        <figure>
          <img :src="featuredVenue.image" alt="Archived exhibition room with navigation markers" />
          <figcaption>Viewpoint 05 / 18</figcaption>
          <span class="pano-marker marker-a" />
          <span class="pano-marker marker-b" />
          <span class="pano-marker marker-c" />
          <span class="pano-arrow"><ArchiveArrow direction="up" /></span>
        </figure>
      </div>

      <div class="method-steps">
        <article v-for="step in methodSteps" :key="step.number">
          <component :is="step.icon" :size="42" stroke-width="1.4" />
          <div>
            <p>{{ step.number }}</p>
            <h3>{{ step.title }}</h3>
            <span>{{ step.text }}</span>
          </div>
        </article>
      </div>
    </section>

    <footer class="site-footer">
      <section class="supporters">
        <p class="eyebrow">Supporters & partners</p>
        <h2>Supported by institutions that care for <span>cultural memory.</span></h2>
        <div class="sponsor-strip" aria-label="Supporters and partners">
          <img src="/svg/sponsor_strip_scrollable.svg" alt="" />
          <div class="sponsor-names">
            <span v-for="sponsor in sponsors" :key="sponsor.id">{{ sponsor.name }}</span>
          </div>
        </div>
      </section>

      <section class="footer-links">
        <div class="footer-brand">
          <strong>PERMAPHEMERA</strong>
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
        <img class="footer-seal" src="/svg/permaphemera_seal.svg" alt="" />
      </section>

      <div class="footer-bottom">
        <span>&copy; 2026 PERMAPHEMERA. All rights reserved.</span>
        <span>Curated independently in Austria.</span>
      </div>
    </footer>
  </main>
</template>

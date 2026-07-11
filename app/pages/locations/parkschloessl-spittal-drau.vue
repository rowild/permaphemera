<script setup lang="ts">
import { CalendarDays, ExternalLink, MapPin } from '@lucide/vue'

const { locationExhibitions } = useArchiveData()
const exhibitions = locationExhibitions.filter((item) => item.venue_slug === 'parkschloessl-spittal-drau')
const selectedExhibition = ref(exhibitions[0]!)
const previewExhibition = ref(exhibitions[0]!)
const previewLoading = ref(true)
const previewLoadFailed = ref(false)
const cachedPreviewImages = new Set<string>()
let previewRequestId = 0
let pendingPreviewImage = ''

const selectExhibition = (exhibition: (typeof exhibitions)[number]) => {
  selectedExhibition.value = exhibition
  previewLoadFailed.value = false

  if (cachedPreviewImages.has(exhibition.image)) {
    previewExhibition.value = exhibition
    previewLoading.value = false
    return
  }

  if (previewLoading.value && pendingPreviewImage === exhibition.image) return

  previewLoading.value = true
  pendingPreviewImage = exhibition.image
  const requestId = ++previewRequestId
  const image = new Image()

  image.onload = () => {
    cachedPreviewImages.add(exhibition.image)
    if (requestId !== previewRequestId) return
    pendingPreviewImage = ''
    previewExhibition.value = exhibition
    previewLoading.value = false
  }

  image.onerror = () => {
    if (requestId !== previewRequestId) return
    pendingPreviewImage = ''
    previewLoading.value = false
    previewLoadFailed.value = true
  }

  image.src = exhibition.image
}

onMounted(() => selectExhibition(exhibitions[0]!))

useSeoMeta({
  title: 'Parkschlössl, Spittal an der Drau · PERMAPHEMERA',
  description: 'Explore the 2026 exhibition records of Parkschlössl in Spittal an der Drau.'
})
</script>

<template>
  <main class="site-shell location-page">
    <span class="global-right-ruler" aria-hidden="true" />
    <ArchiveHeader active="galleries" />

    <div id="main-content">
      <section class="section-band location-hero" aria-labelledby="location-title">
        <div class="location-hero-copy">
          <nav class="archive-breadcrumb" aria-label="Breadcrumb">
            <NuxtLink to="/#locations">Locations</NuxtLink><span aria-hidden="true">/</span><span>Spittal an der Drau</span>
          </nav>
          <p class="eyebrow">Archive location · No. 01</p>
          <h1 id="location-title">Parkschlössl <span>Spittal an der Drau</span></h1>
          <p class="location-hero-lede">A small exhibition house in the park—temporary encounters gathered within a vividly remembered architectural shell.</p>

          <dl class="location-contact-list">
            <div>
              <dt><MapPin :size="19" aria-hidden="true" /> Address</dt>
              <dd>Bahnhofstraße 1a, 9800 Spittal an der Drau, Austria</dd>
            </div>
            <div>
              <dt><span class="record-meta-icon record-meta-icon-location" aria-hidden="true" /> Coordinates</dt>
              <dd>46.7983583° N, 13.4928504° E</dd>
            </div>
          </dl>

          <div class="location-hero-actions">
            <a class="button button-primary" href="#location-exhibitions">
              <CalendarDays :size="20" aria-hidden="true" />
              Browse exhibitions
              <ArchiveArrow />
            </a>
            <a
              class="location-map-link"
              href="https://www.google.com/maps/search/?api=1&query=46.7983583,13.4928504"
              target="_blank"
              rel="noreferrer"
            >
              View on map <ExternalLink :size="16" aria-hidden="true" />
            </a>
          </div>
        </div>

        <figure class="location-hero-figure">
          <div class="location-hero-image">
            <VenueMaskedImage
              src="/images/landing/parkschloessl.jpg"
              alt="Front façade of the striped ochre and rose Parkschlössl beneath mature trees"
              shape="frame"
            />
            <VenueCardFrame />
          </div>
          <figcaption>
            <span>Fig. I</span>
            The Parkschlössl, recorded from the city park
          </figcaption>
          <div class="location-plate" aria-hidden="true">
            <span>SP</span>
            <strong>01</strong>
            <small>46° 47′ 54″ N<br />13° 29′ 34″ E</small>
          </div>
        </figure>
      </section>

      <img class="location-section-divider" src="/svg/dividers/exhibitions-section-divider.svg" alt="" aria-hidden="true" />

      <section id="location-exhibitions" class="section-band location-exhibitions" aria-labelledby="location-exhibitions-title">
        <div class="location-exhibitions-intro">
          <div class="section-heading">
            <p class="eyebrow">Season ledger · 2026</p>
            <h2 id="location-exhibitions-title">Seven exhibitions. <span>One changing space.</span></h2>
            <p>A concise index of the season. Open a record for the exhibition story, practical details and—where available—the preserved spatial experience.</p>
          </div>
          <dl class="location-season-facts">
            <div><dt>Records</dt><dd>{{ String(exhibitions.length).padStart(2, '0') }}</dd></div>
            <div><dt>Season</dt><dd>June—August</dd></div>
            <div><dt>Admission</dt><dd>Free</dd></div>
          </dl>
        </div>

        <div class="location-exhibition-browser">
          <ol class="location-exhibition-list" aria-label="Parkschlössl exhibitions">
            <li
              v-for="(exhibition, index) in exhibitions"
              :key="exhibition.id"
              :class="{ 'is-active': selectedExhibition.id === exhibition.id }"
              @mouseenter="selectExhibition(exhibition)"
              @focusin="selectExhibition(exhibition)"
            >
              <article>
                <button
                  class="location-exhibition-select"
                  type="button"
                  :aria-pressed="selectedExhibition.id === exhibition.id"
                  :aria-label="`Preview ${exhibition.title}`"
                  @click="selectExhibition(exhibition)"
                >
                  <span class="location-list-number">{{ String(index + 1).padStart(2, '0') }}</span>
                  <span class="location-list-copy">
                    <time :datetime="exhibition.start_date">{{ exhibition.date_range }}</time>
                    <strong>{{ exhibition.title }}</strong>
                    <small>{{ exhibition.artist }}</small>
                  </span>
                </button>
                <NuxtLink
                  class="location-list-link"
                  :to="`/exhibitions/${exhibition.slug}`"
                  :aria-label="`Open the exhibition record for ${exhibition.title}`"
                >
                  <span class="sr-only">Open exhibition</span>
                  <ArchiveArrow />
                </NuxtLink>
              </article>
            </li>
          </ol>

          <aside class="location-preview-column" aria-label="Selected exhibition preview">
            <ExhibitionFrameCard class="location-active-preview">
              <img :src="previewExhibition.image" :alt="previewExhibition.image_alt" />
              <div class="location-preview-shade" />
              <div class="location-preview-copy" aria-live="polite">
                <p><time :datetime="previewExhibition.start_date">{{ previewExhibition.date_range }}</time></p>
                <h3>{{ previewExhibition.title }}</h3>
                <p class="artist-name">{{ previewExhibition.artist }}</p>
                <NuxtLink :to="`/exhibitions/${previewExhibition.slug}`">
                  Open exhibition <ArchiveArrow />
                </NuxtLink>
              </div>
              <div v-if="previewLoading" class="location-preview-loader" role="status" aria-live="polite">
                <span class="location-loader-symbol" aria-hidden="true" />
                <span>Loading record image</span>
              </div>
              <div v-else-if="previewLoadFailed" class="location-preview-error" role="status">
                Preview unavailable. Select another record or open the exhibition page.
              </div>
            </ExhibitionFrameCard>
          </aside>
        </div>
      </section>

      <section class="section-band location-about" aria-labelledby="location-about-title">
        <div class="location-about-ornament" aria-hidden="true">
          <img src="/images/landing/footer/permanently-preserved-stamp.png" alt="" />
        </div>
        <div class="location-about-copy">
          <p class="eyebrow">The venue</p>
          <h2 id="location-about-title">The building remains. <span>The exhibitions pass through.</span></h2>
          <p>Set among the trees of Spittal’s city park, the Parkschlössl gives each exhibition an intimate architectural frame. Its striped façade marks a stable point in the city; inside, the sequence of works, visitors and conversations is continually renewed.</p>
          <p>This location page keeps that distinction visible: the place is the anchor, while every exhibition has its own record.</p>
        </div>
        <blockquote>
          “A location is more than an address. It is the constant against which temporary worlds become legible.”
          <cite>— PERMAPHEMERA field note</cite>
        </blockquote>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

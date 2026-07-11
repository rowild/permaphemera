<script setup lang="ts">
import { CalendarDays, Clock3, FileText, MapPin } from '@lucide/vue'

const route = useRoute()
const { locationExhibitions } = useArchiveData()
const exhibition = locationExhibitions.find((item) => item.slug === route.params.slug)

if (!exhibition) {
  throw createError({ statusCode: 404, statusMessage: 'Exhibition record not found' })
}

const relatedExhibitions = locationExhibitions.filter((item) => item.slug !== exhibition.slug).slice(0, 3)

useSeoMeta({
  title: `${exhibition.title} · ${exhibition.artist} · PERMAPHEMERA`,
  description: exhibition.summary
})
</script>

<template>
  <main class="site-shell exhibition-detail-page">
    <span class="global-right-ruler" aria-hidden="true" />
    <ArchiveHeader active="exhibitions" />

    <div id="main-content">
      <section class="section-band exhibition-detail-hero" aria-labelledby="exhibition-title">
        <div class="exhibition-detail-visual">
          <div class="exhibition-detail-image">
            <VenueMaskedImage :src="exhibition.image" :alt="exhibition.image_alt" shape="frame" />
            <VenueCardFrame />
          </div>
          <p><span>Preserved record</span> · Parkschlössl season 2026</p>
        </div>

        <div class="exhibition-detail-copy">
          <nav class="archive-breadcrumb" aria-label="Breadcrumb">
            <NuxtLink to="/locations/parkschloessl-spittal-drau/">Parkschlössl</NuxtLink><span aria-hidden="true">/</span><span>{{ exhibition.title }}</span>
          </nav>
          <p class="eyebrow">Exhibition record</p>
          <h1 id="exhibition-title">{{ exhibition.title }}</h1>
          <p class="exhibition-detail-artist">{{ exhibition.artist }}</p>
          <p class="exhibition-detail-summary">{{ exhibition.summary }}</p>

          <dl class="exhibition-detail-meta">
            <div><dt><CalendarDays :size="18" aria-hidden="true" /> Dates</dt><dd>{{ exhibition.date_range }}</dd></div>
            <div><dt><MapPin :size="18" aria-hidden="true" /> Location</dt><dd>{{ exhibition.venue }}, {{ exhibition.city }}</dd></div>
            <div><dt><Clock3 :size="18" aria-hidden="true" /> Opening hours</dt><dd>{{ exhibition.opening_hours }}</dd></div>
          </dl>

          <div class="exhibition-detail-actions">
            <a class="button button-secondary" :href="exhibition.source_pdf" target="_blank" rel="noreferrer">
              <FileText :size="20" aria-hidden="true" /> View original invitation
            </a>
            <NuxtLink class="exhibition-back-link" to="/locations/parkschloessl-spittal-drau/">
              <ArchiveArrow direction="left" /> Back to Parkschlössl
            </NuxtLink>
          </div>
        </div>
      </section>

      <section class="section-band exhibition-detail-body" aria-labelledby="about-exhibition-title">
        <div class="exhibition-detail-prose">
          <p class="eyebrow">About the exhibition</p>
          <h2 id="about-exhibition-title">A temporary encounter, <span>held in the archive.</span></h2>
          <p>{{ exhibition.description || exhibition.summary }}</p>
        </div>
        <dl class="exhibition-detail-ledger">
          <div><dt>Artist / participants</dt><dd>{{ exhibition.artist }}</dd></div>
          <div v-if="exhibition.medium"><dt>Form</dt><dd>{{ exhibition.medium }}</dd></div>
          <div><dt>Opening</dt><dd>{{ exhibition.vernissage }}</dd></div>
          <div><dt>Admission</dt><dd>Free</dd></div>
        </dl>
      </section>

      <section id="spatial-record" class="exhibition-experience" aria-labelledby="spatial-record-title">
        <div class="exhibition-experience-image" :style="{ backgroundImage: `url('${exhibition.image}')` }" aria-hidden="true" />
        <div class="exhibition-experience-copy">
          <p class="eyebrow">360° spatial record</p>
          <h2 id="spatial-record-title">The exhibition, <span>entered through space.</span></h2>
          <p>This is where the navigable 360-degree record will open. The visual structure is prepared; the spatial capture itself is not yet connected to this prototype.</p>
          <button class="button button-primary" type="button" disabled>
            Start experience <ArchiveArrow />
          </button>
          <small>Spatial record in preparation</small>
        </div>
      </section>

      <section class="section-band exhibition-related" aria-labelledby="related-title">
        <div class="section-heading">
          <p class="eyebrow">Also at Parkschlössl</p>
          <h2 id="related-title">Other records from <span>the 2026 season.</span></h2>
        </div>
        <div class="exhibition-related-grid">
          <NuxtLink v-for="item in relatedExhibitions" :key="item.id" :to="`/exhibitions/${item.slug}`">
            <img :src="item.image" :alt="item.image_alt" loading="lazy" />
            <div><time :datetime="item.start_date">{{ item.date_range }}</time><h3>{{ item.title }}</h3><p>{{ item.artist }}</p><span>Open record <ArchiveArrow /></span></div>
          </NuxtLink>
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

<script setup lang="ts">
import { CalendarDays, ExternalLink, MapPin } from '@lucide/vue'
import type { LocationExhibition } from '~/types/content'

const route = useRoute()
const router = useRouter()
const { locationExhibitions, venues } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
const venue = computed(() => venues.value.find((item) => item.slug === slug))

if (!venue.value) {
  throw createError({ statusCode: 404, statusMessage: t('location.notFound') })
}

const exhibitions = computed(() => locationExhibitions.value.filter((item) => item.venue_slug === venue.value?.slug))
const locationSearchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const filteredExhibitions = computed(() => {
  const query = locationSearchQuery.value.trim().toLocaleLowerCase()

  if (!query) return exhibitions.value

  return exhibitions.value.filter((exhibition) => [
    exhibition.title,
    exhibition.artist,
    exhibition.date_range,
    exhibition.summary,
    exhibition.medium ?? ''
  ].some((value) => value.toLocaleLowerCase().includes(query)))
})
const selectedExhibition = ref<LocationExhibition | null>(exhibitions.value[0] ?? null)
const previewExhibition = ref<LocationExhibition | null>(exhibitions.value[0] ?? null)
const previewLoading = ref(Boolean(exhibitions.value.length))
const previewLoadFailed = ref(false)
const cachedPreviewImages = new Set<string>()
let previewRequestId = 0
let pendingPreviewImage = ''

const selectExhibition = (exhibition: LocationExhibition) => {
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

watch(filteredExhibitions, (matches) => {
  if (!matches.length) return
  if (selectedExhibition.value && matches.some((item) => item.id === selectedExhibition.value?.id)) return
  selectExhibition(matches[0]!)
})

watch(exhibitions, (records) => {
  selectedExhibition.value = records.find((item) => item.id === selectedExhibition.value?.id) ?? records[0] ?? null
  previewExhibition.value = records.find((item) => item.id === previewExhibition.value?.id) ?? selectedExhibition.value
})

watch(() => route.query.q, (query) => {
  locationSearchQuery.value = typeof query === 'string' ? query : ''
})

watch(locationSearchQuery, (query) => {
  const nextQuery = query.trim()
  const currentQuery = typeof route.query.q === 'string' ? route.query.q : ''
  if (currentQuery === nextQuery) return

  void router.replace({
    path: route.path,
    query: nextQuery ? { q: nextQuery } : {}
  })
})

onMounted(() => {
  const firstExhibition = filteredExhibitions.value[0]
  if (firstExhibition) selectExhibition(firstExhibition)
})

const venueIndex = computed(() => venues.value.findIndex((item) => item.id === venue.value?.id))
const archiveNumber = computed(() => venue.value?.archive_number ?? String(venueIndex.value + 1).padStart(2, '0'))
const plateCode = computed(() => venue.value?.city.slice(0, 2).toLocaleUpperCase() ?? '')
const locationMapUrl = computed(() => venue.value?.latitude !== undefined && venue.value.longitude !== undefined
  ? `https://www.google.com/maps/search/?api=1&query=${venue.value.latitude},${venue.value.longitude}`
  : undefined
)
const seasonYears = computed(() => [...new Set(exhibitions.value.map((exhibition) => exhibition.start_date.slice(0, 4)))].join(' · '))
const locationLedgerItems = computed(() => [
  { label: t('location.ledgerLabels.records'), value: String(exhibitions.value.length).padStart(2, '0') },
  { label: t('location.ledgerLabels.season'), value: seasonYears.value || t('common.pending') },
  { label: t('location.ledgerLabels.admission'), value: t('common.free') }
])

useSeoMeta({
  title: () => `${venue.value?.name}, ${venue.value?.city} · PERMAPHEMERA`,
  description: () => venue.value?.lede ?? t('location.seoDescription', { name: venue.value?.name, city: venue.value?.city })
})
</script>

<template>
  <main class="[ site-shell ] [ location-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="galleries" />

    <div id="main-content">
      <section
        class="[ location-hero ] [ section-band ] relative mx-auto grid min-h-[calc(100vh-6.4rem)] max-w-[105rem] grid-cols-[minmax(22rem,0.82fr)_minmax(30rem,1.18fr)] items-center gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:min-h-auto tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-16"
        aria-labelledby="location-title"
      >
        <div class="[ location-hero-copy ] relative z-2 tablet:row-start-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/#locations')">{{ $t('navigation.galleries') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ venue.city }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-[0.95rem] font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('location.archiveLocation', { number: archiveNumber }) }}</p>
          <h1 id="location-title" class="[ location-hero-title ] m-0 font-display text-[clamp(3.3rem,5.2vw,5.6rem)] font-light leading-[0.92] compact:text-5xl compact:leading-none">
            {{ venue.name }}
            <span class="mt-[0.35rem] block max-w-116 text-[0.54em] leading-[1.02] text-archive-red">{{ venue.city }}</span>
          </h1>
          <p class="[ location-hero-lede ] my-0 mt-[1.6rem] mb-[1.85rem] max-w-136 text-[clamp(1.1rem,1.45vw,1.32rem)] leading-[1.42] text-[#554b40] compact:mt-4 compact:mb-4 compact:text-base compact:leading-normal">{{ venue.lede ?? $t('location.fallbackLede', { city: venue.city }) }}</p>

          <dl class="[ location-contact-list ] m-0">
            <ArchiveMetadataRow :label="$t('location.address')" variant="location">
              <template #icon><MapPin :size="19" aria-hidden="true" /></template>
              {{ venue.address }}
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="venue.latitude !== undefined && venue.longitude !== undefined" :label="$t('location.coordinates')" variant="location">
              <template #icon><span class="record-meta-icon record-meta-icon-location" aria-hidden="true" /></template>
              {{ venue.latitude }}° N, {{ venue.longitude }}° E
            </ArchiveMetadataRow>
          </dl>

          <div class="[ location-hero-actions ] mt-8 flex flex-wrap items-center gap-[1.2rem] compact:mt-5 compact:flex-nowrap compact:gap-3">
            <ArchiveButton class="compact:flex-1" href="#location-exhibitions">
              <CalendarDays :size="20" aria-hidden="true" />
              {{ $t('location.browse') }}
              <ArchiveArrow />
            </ArchiveButton>
            <ArchiveTextLink
              v-if="locationMapUrl"
              class="[ location-map-link ] compact:min-h-11 compact:shrink-0 compact:text-sm"
              :href="locationMapUrl"
              target="_blank"
              rel="noreferrer"
              icon-motion="external"
            >
              {{ $t('location.viewMap') }}
              <template #icon><ExternalLink :size="16" /></template>
            </ArchiveTextLink>
          </div>
        </div>

        <figure class="[ location-hero-figure ] archive-location-hero-artwork relative m-0 pt-[1.1rem] pr-4 pb-10 pl-0 tablet:row-start-1 compact:mx-[-0.45rem] compact:pr-0">
          <ArchiveFramedImage
            class="[ location-hero-image ] aspect-[1.28] rotate-[0.65deg] tablet:aspect-[1.7] compact:aspect-[1.28] compact:rotate-0"
            :src="venue.hero_image ?? venue.image"
            :alt="venue.hero_image_alt ?? $t('location.fallbackAlt', { name: venue.name, city: venue.city })"
          />
          <figcaption class="[ location-hero-caption ] mt-[0.9rem] mr-0 mb-0 ml-[1.4rem] flex items-center gap-[0.65rem] text-[0.86rem] text-archive-muted italic">
            <span class="not-italic tracking-[0.08em] text-archive-red uppercase">{{ $t('location.figure') }}</span>
            {{ venue.image_caption ?? $t('location.fallbackCaption', { name: venue.name, city: venue.city }) }}
          </figcaption>
          <div class="[ location-plate ] archive-location-plate absolute -right-4 bottom-[-0.4rem] z-6 grid aspect-square w-[7.8rem] -rotate-7 place-content-center rounded-full border border-archive-red/43 bg-archive-paper/90 text-center text-archive-red compact:right-[-0.35rem] compact:bottom-[-0.8rem] compact:w-[6.4rem]" aria-hidden="true">
            <span class="text-[0.66rem] tracking-[0.12em] uppercase">{{ plateCode }}</span>
            <strong class="text-[2.2rem] leading-[0.9] font-normal">{{ archiveNumber }}</strong>
            <small class="max-w-24 text-[0.66rem] tracking-[0.12em] uppercase">{{ venue.coordinate_label ?? venue.city }}</small>
          </div>
        </figure>

        <ArchiveScrollCue target="#location-exhibitions" :label="$t('location.continue')" />
      </section>

      <section id="location-exhibitions" class="[ location-exhibitions ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(4rem,7vw,7rem)] pb-[clamp(3rem,5vw,5rem)] compact:px-4 compact:pt-8 compact:pb-8" aria-labelledby="location-exhibitions-title">
        <div class="[ location-exhibitions-intro ] mb-12 grid grid-cols-[minmax(0,1fr)_minmax(20rem,0.55fr)] items-start gap-[clamp(2.5rem,6vw,6rem)] tablet:grid-cols-1 compact:mb-5 compact:gap-4">
          <div class="[ section-heading ] relative z-1 mb-8 compact:mb-3">
            <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-[0.95rem] font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('location.ledger', { season: seasonYears || $t('location.recordsPending') }) }}</p>
            <h2 id="location-exhibitions-title" class="m-0 text-[clamp(2.55rem,4.2vw,4.35rem)] font-light leading-[0.98] compact:text-4xl">{{ $t('location.exhibitionCount', exhibitions.length) }}. <span class="text-archive-red">{{ $t('location.changingSpace') }}</span></h2>
            <p class="mt-[0.85rem] mb-0 max-w-216 text-[1.04rem] text-archive-muted compact:mt-2 compact:text-sm">{{ $t('location.searchIntro') }}</p>
          </div>
          <ArchiveFactLedger class="mt-9 tablet:mt-0" :items="locationLedgerItems" />
        </div>

        <ArchiveSearchForm
          v-model="locationSearchQuery"
          class="[ location-record-search ]"
          id="location-record-search"
          :label="$t('location.searchLabel', { name: venue.name })"
          :placeholder="$t('location.searchPlaceholder')"
        />

        <div class="[ location-search-status ] mb-8 flex min-h-8 items-center justify-between gap-4 text-[0.92rem] text-archive-muted compact:mb-4 compact:min-h-0 compact:gap-2 compact:text-xs">
          <p class="m-0" role="status" aria-live="polite">{{ $t('location.showing', { visible: filteredExhibitions.length, total: exhibitions.length }) }}</p>
          <button v-if="locationSearchQuery" class="border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="locationSearchQuery = ''">{{ $t('location.clearSearch') }}</button>
        </div>

        <div v-if="!filteredExhibitions.length" class="[ location-search-empty ] border-y border-archive-rule-deep/24 py-16 text-center">
          <p class="m-0 text-[1.45rem] text-archive-ink">{{ locationSearchQuery ? $t('location.noMatches', { query: locationSearchQuery }) : $t('location.noRecords', { name: venue.name }) }}</p>
          <button v-if="locationSearchQuery" class="mt-4 border-0 bg-transparent text-archive-red underline underline-offset-4" type="button" @click="locationSearchQuery = ''">{{ $t('location.showAll', { name: venue.name }) }}</button>
        </div>

        <div v-else class="[ location-exhibition-browser ] grid grid-cols-[minmax(24rem,0.72fr)_minmax(34rem,1.28fr)] items-start gap-[clamp(2rem,5vw,5rem)] tablet:grid-cols-[minmax(18rem,0.72fr)_minmax(28rem,1.28fr)] tablet:gap-8 medium:grid-cols-1">
          <ol class="[ location-exhibition-list ] m-0 list-none p-0 medium:row-start-2" :aria-label="$t('location.exhibitionsAria', { name: venue.name })">
            <LocationExhibitionLedgerRow
              v-for="(exhibition, index) in filteredExhibitions"
              :key="exhibition.id"
              :exhibition="exhibition"
              :index="index"
              :selected="selectedExhibition?.id === exhibition.id"
              @select="selectExhibition"
            />
          </ol>

          <aside v-if="previewExhibition" class="[ location-preview-column ] sticky top-32 min-w-0 medium:relative medium:top-0 medium:row-start-1" :aria-label="$t('location.previewAria')">
            <ExhibitionFrameCard class="[ location-active-preview ] archive-location-active-preview block min-h-[clamp(31rem,42vw,40rem)] w-full medium:min-h-124 compact:min-h-80" surface-class="bg-archive-night">
              <Transition name="archive-location-preview-image">
                <img
                  :key="previewExhibition.id"
                  class="[ location-preview-image ] archive-location-preview-image absolute inset-0 size-full object-cover brightness-76 saturate-88"
                  :src="previewExhibition.image"
                  :alt="previewExhibition.image_alt"
                />
              </Transition>
              <div class="[ location-preview-shade ] archive-location-preview-shade absolute inset-x-0 top-[35%] bottom-0" />
              <div class="[ location-preview-copy ] absolute right-[clamp(1.5rem,4vw,3rem)] bottom-[clamp(1.5rem,4vw,2.7rem)] left-[clamp(1.5rem,4vw,3rem)] z-2 text-archive-light-ink compact:right-[1.4rem] compact:bottom-[1.4rem] compact:left-[1.4rem]" aria-live="polite">
                <p class="[ location-preview-date ] mt-0 mb-[0.4rem] text-[0.76rem] tracking-[0.08em] text-archive-ochre uppercase"><time :datetime="previewExhibition.start_date">{{ previewExhibition.date_range }}</time></p>
                <h3 class="[ location-preview-title ] m-0 max-w-152 text-[clamp(2rem,3.4vw,3.35rem)] leading-[0.95] font-light">{{ previewExhibition.title }}</h3>
                <p class="[ artist-name ] mt-[0.4rem] mb-[1.15rem] font-display text-[1.12rem] text-archive-ochre">{{ previewExhibition.artist }}</p>
                <ArchiveTextLink class="[ location-preview-link ] gap-[0.65rem]" surface="night" :to="localePath(`/exhibitions/${previewExhibition.slug}`)">
                  {{ $t('location.openExhibition') }}
                  <template #icon><ArchiveArrow class="w-[1.65rem]" /></template>
                </ArchiveTextLink>
              </div>
              <div v-if="previewLoading" class="[ location-preview-loader ] absolute inset-0 z-4 grid place-content-center justify-items-center gap-[0.9rem] bg-archive-paper/92 text-center text-[0.74rem] tracking-[0.09em] text-archive-red uppercase" role="status" aria-live="polite">
                <span class="[ location-loader-symbol ] archive-location-loader-symbol relative block size-16 rounded-full border border-archive-red/20 border-t-archive-red" aria-hidden="true" />
                <span>{{ $t('location.loadingPreview') }}</span>
              </div>
              <div v-else-if="previewLoadFailed" class="[ location-preview-error ] absolute inset-0 z-4 grid place-content-center justify-items-center gap-[0.9rem] bg-archive-paper/92 p-8 text-center text-[0.74rem] tracking-[0.04em] text-archive-ink normal-case" role="status">
                {{ $t('location.previewUnavailable') }}
              </div>
            </ExhibitionFrameCard>
          </aside>
        </div>
      </section>

      <img class="[ location-section-divider ] pointer-events-none mx-auto block w-[min(46rem,84vw)] opacity-62" src="/svg/dividers/exhibitions-section-divider.svg" alt="" aria-hidden="true" />

      <section
        class="[ location-about ] [ section-band ] relative mx-auto mt-8 grid max-w-[105rem] grid-cols-[11rem_minmax(0,1.15fr)_minmax(18rem,0.85fr)] items-start gap-[clamp(2rem,5vw,5rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:mt-4 compact:gap-6 compact:px-4 compact:py-8"
        aria-labelledby="location-about-title"
      >
        <div class="[ location-about-ornament ] tablet:hidden" aria-hidden="true">
          <img class="w-42 -rotate-4 opacity-48" src="/images/landing/footer/permanently-preserved-stamp.png" alt="" />
        </div>
        <div class="[ location-about-copy ]">
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-[0.95rem] font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('location.venueEyebrow') }}</p>
          <h2 id="location-about-title" class="mb-[1.85rem] text-[clamp(2.55rem,4.2vw,4.35rem)] font-light leading-[0.98] compact:mb-4 compact:text-4xl">{{ $t('location.venueTitle') }} <span class="text-archive-red">{{ $t('location.venueAccent') }}</span></h2>
          <p v-for="paragraph in venue.about ?? [$t('location.fallbackAbout1', { name: venue.name, city: venue.city }), $t('location.fallbackAbout2')]" :key="paragraph" class="max-w-180 text-[1.06rem] leading-[1.58] text-archive-body compact:text-base compact:leading-normal">{{ paragraph }}</p>
        </div>
        <blockquote class="m-0 border-l border-archive-red/48 pl-8 text-[1.35rem] leading-[1.4] italic text-archive-copy-warm tablet:max-w-2xl compact:pl-4 compact:text-base">
          “{{ $t('location.quote') }}”
          <cite class="mt-4 block text-[0.76rem] not-italic tracking-[0.08em] text-archive-red uppercase">{{ $t('location.fieldNote') }}</cite>
        </blockquote>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

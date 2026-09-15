<script setup lang="ts">
import { Building2, CalendarDays, ExternalLink, LayoutGrid, MapPin } from '@lucide/vue'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import type { ResolvedVenue } from '~/utils/resolveVenues'

// `venue` below merges the routed ResolvedVenue with its optional dossier
// match into a page-local view-model — including a `location_id` field
// ResolvedVenue doesn't carry (kept from the pre-flip shape; read only in
// this file's own template, never passed to a child component). This local
// type describes exactly what gets constructed.
interface Venue extends Pick<ResolvedVenue, 'id' | 'slug' | 'name' | 'city' | 'address' | 'latitude' | 'longitude' | 'website_url' | 'image' | 'featured' | 'archive_number' | 'hero_image' | 'hero_image_alt' | 'lede' | 'image_caption' | 'coordinate_label' | 'about' | 'part_of' | 'spaces'> {
  location_id: string
}

const route = useRoute()
const router = useRouter()
const { venueExhibitions, venues } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
const venueRecord = computed(() => venues.value.find((item) => item.slug === slug))
// ResolvedVenue carries no `location_id` (it's already the resolved venue,
// not the raw record) — `venueDossier` re-finds the same record from the
// same `venues` collection `venueRecord` already matched by slug.
const venueDossier = computed(() => venues.value.find((item) => item.slug === slug))
// Throwing inside the computed (rather than returning undefined and guarding
// afterward) lets TypeScript see `venue.value` as always-`Venue` from here on
// — including in the template, which a separate post-hoc `if (!venue.value)`
// guard does not narrow for. Evaluation is still forced eagerly below via
// `void venue.value`, preserving the original synchronous 404-on-setup timing.
const venue = computed<Venue>(() => {
  const record = venueRecord.value
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: t('venue.notFound') })
  }

  const dossier = venueDossier.value

  return {
    id: dossier?.id ?? `venue-${record.id}`,
    slug: record.slug,
    location_id: record.id,
    name: record.name,
    city: record.city_name,
    address: record.address,
    latitude: record.latitude,
    longitude: record.longitude,
    website_url: dossier?.website_url || record.website_url,
    image: record.image,
    featured: record.featured,
    archive_number: record.archive_number,
    hero_image: dossier?.hero_image ?? record.image,
    hero_image_alt: dossier?.hero_image_alt ?? record.image_alt,
    lede: dossier?.lede ?? record.description,
    image_caption: dossier?.image_caption,
    coordinate_label: dossier?.coordinate_label,
    about: dossier?.about,
    part_of: record.part_of,
    spaces: record.spaces
  }
})

void venue.value

const exhibitions = computed(() => venueExhibitions.value.filter((item) => item.venue_slug === venue.value?.slug))
const venueSearchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const filteredExhibitions = computed(() => {
  const query = venueSearchQuery.value.trim().toLocaleLowerCase()

  if (!query) return exhibitions.value

  return exhibitions.value.filter((exhibition) => [
    exhibition.title,
    exhibition.artist,
    exhibition.date_range,
    exhibition.summary,
    exhibition.medium ?? ''
  ].some((value) => value.toLocaleLowerCase().includes(query)))
})
const selectedExhibition = ref<ResolvedExhibition | null>(exhibitions.value[0] ?? null)
const previewExhibition = ref<ResolvedExhibition | null>(exhibitions.value[0] ?? null)
const previewLoading = ref(Boolean(exhibitions.value.length))
const previewLoadFailed = ref(false)
const cachedPreviewImages = new Set<string>()
let previewRequestId = 0
let pendingPreviewImage = ''

const selectExhibition = (exhibition: ResolvedExhibition) => {
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
  venueSearchQuery.value = typeof query === 'string' ? query : ''
})

watch(venueSearchQuery, (query) => {
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

const venueIndex = computed(() => venues.value.findIndex((item) => item.id === venueRecord.value?.id))
const archiveNumber = computed(() => venue.value?.archive_number ?? String(venueIndex.value + 1).padStart(2, '0'))
const plateCode = computed(() => venue.value?.city.slice(0, 2).toLocaleUpperCase() ?? '')
const venueMapUrl = computed(() => {
  if (!venue.value) return undefined
  const query = venue.value.latitude !== undefined && venue.value.longitude !== undefined
    ? `${venue.value.latitude},${venue.value.longitude}`
    : venue.value.address

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
})
const websiteLabel = computed(() => {
  if (!venue.value?.website_url) return ''
  try {
    return new URL(venue.value.website_url).hostname.replace(/^www\./, '')
  } catch {
    return venue.value.website_url
  }
})
const seasonYears = computed(() => [...new Set(exhibitions.value.map((exhibition) => exhibition.start_date.slice(0, 4)))].join(' · '))
const venueLedgerItems = computed(() => [
  { label: t('venue.ledgerLabels.records'), value: String(exhibitions.value.length).padStart(2, '0') },
  { label: t('venue.ledgerLabels.season'), value: seasonYears.value || t('common.pending') },
  { label: t('venue.ledgerLabels.admission'), value: t('common.free') }
])

useSeoMeta({
  title: () => `${venue.value?.name}, ${venue.value?.city} · PERMAPHEMERA`,
  description: () => venue.value?.lede ?? t('venue.seoDescription', { name: venue.value?.name, city: venue.value?.city })
})
</script>

<template>
  <main class="[ site-shell ] [ venue-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="galleries" />

    <div id="main-content">
      <section
        class="[ venue-hero ] [ section-band ] relative mx-auto grid min-h-[calc(100vh-6.4rem)] max-w-[105rem] grid-cols-[minmax(22rem,0.82fr)_minmax(30rem,1.18fr)] items-center gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:min-h-auto tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-16"
        aria-labelledby="venue-title"
      >
        <div class="[ venue-hero-copy ] relative z-2 tablet:row-start-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/venues/')">{{ $t('navigation.galleries') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ venue.name }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('venue.archiveVenue', { number: archiveNumber }) }}</p>
          <h1 id="venue-title" class="[ venue-hero-title ] m-0 font-display text-hero font-light leading-[0.92] compact:text-5xl compact:leading-none">
            {{ venue.name }}
            <span class="mt-3 block max-w-116 text-city leading-[1.02] text-archive-red">{{ venue.city }}</span>
          </h1>
          <p class="[ venue-hero-lede ] my-0 mt-[1.6rem] mb-[1.85rem] max-w-136 text-lede leading-[1.42] text-archive-body compact:mt-4 compact:mb-4 compact:text-base compact:leading-normal">{{ venue.lede ?? $t('venue.fallbackLede', { city: venue.city }) }}</p>

          <dl class="[ venue-contact-list ] m-0">
            <ArchiveMetadataRow :label="$t('venue.address')" variant="venue">
              <template #icon><MapPin :size="19" aria-hidden="true" /></template>
              {{ venue.address }}
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="venue.part_of" :label="$t('venue.partOf')" variant="venue">
              <template #icon><Building2 :size="18" aria-hidden="true" /></template>
              <ArchiveTextLink :to="localePath(`/venues/${venue.part_of.slug}/`)">{{ venue.part_of.name }}</ArchiveTextLink>
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="venue.spaces.length" :label="$t('venue.spaces', venue.spaces.length)" variant="venue">
              <template #icon><LayoutGrid :size="18" aria-hidden="true" /></template>
              <template v-for="(space, index) in venue.spaces" :key="space.slug">
                <template v-if="index">, </template><ArchiveTextLink :to="localePath(`/venues/${space.slug}/`)">{{ space.name }}</ArchiveTextLink>
              </template>
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="venue.latitude !== undefined && venue.longitude !== undefined" :label="$t('venue.coordinates')" variant="venue">
              <template #icon><span class="record-meta-icon record-meta-icon-location" aria-hidden="true" /></template>
              {{ venue.latitude }}° N, {{ venue.longitude }}° E
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="venue.website_url" :label="$t('venue.website')" variant="venue">
              <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
              <ArchiveTextLink :href="venue.website_url" target="_blank" rel="noreferrer" icon-motion="external">{{ websiteLabel }}</ArchiveTextLink>
            </ArchiveMetadataRow>
          </dl>

          <div class="[ venue-hero-actions ] mt-8 flex flex-wrap items-center gap-[1.2rem] compact:mt-5 compact:flex-nowrap compact:gap-3">
            <ArchiveButton class="compact:flex-1" href="#venue-exhibitions">
              <CalendarDays :size="20" aria-hidden="true" />
              {{ $t('venue.browse') }}
              <ArchiveArrow />
            </ArchiveButton>
            <ArchiveTextLink
              v-if="venueMapUrl"
              class="[ venue-map-link ] compact:min-h-11 compact:shrink-0 compact:text-sm"
              :href="venueMapUrl"
              target="_blank"
              rel="noreferrer"
              icon-motion="external"
            >
              {{ $t('venue.viewMap') }}
              <template #icon><ExternalLink :size="16" /></template>
            </ArchiveTextLink>
          </div>
        </div>

        <figure class="[ venue-hero-figure ] archive-venue-hero-artwork relative m-0 pt-[1.1rem] pr-4 pb-10 pl-0 tablet:row-start-1 compact:mx-[-0.45rem] compact:pr-0">
          <ArchiveFramedImage
            class="[ venue-hero-image ] aspect-[1.28] rotate-[0.65deg] tablet:aspect-[1.7] compact:aspect-[1.28] compact:rotate-0"
            :src="venue.hero_image ?? venue.image"
            :alt="venue.hero_image_alt ?? $t('venue.fallbackAlt', { name: venue.name, city: venue.city })"
          />
          <figcaption class="[ venue-hero-caption ] mt-[0.9rem] mr-0 mb-0 ml-[1.4rem] flex items-center gap-[0.65rem] text-sm text-archive-muted italic">
            <span class="not-italic tracking-[0.08em] text-archive-red uppercase">{{ $t('venue.figure') }}</span>
            {{ venue.image_caption ?? $t('venue.fallbackCaption', { name: venue.name, city: venue.city }) }}
          </figcaption>
          <div class="[ venue-plate ] archive-venue-plate absolute -right-4 bottom-[-0.4rem] z-6 grid aspect-square w-[7.8rem] -rotate-7 place-content-center rounded-full border border-archive-red/43 bg-archive-paper/90 text-center text-archive-red compact:right-[-0.35rem] compact:bottom-[-0.8rem] compact:w-[6.4rem]" aria-hidden="true">
            <span class="text-2xs tracking-[0.12em] uppercase">{{ plateCode }}</span>
            <strong class="text-4xl leading-[0.9] font-normal">{{ archiveNumber }}</strong>
            <small class="max-w-24 text-2xs tracking-[0.12em] uppercase">{{ venue.coordinate_label ?? venue.city }}</small>
          </div>
        </figure>

        <ArchiveScrollCue target="#venue-exhibitions" :label="$t('venue.continue')" />
      </section>

      <section id="venue-exhibitions" class="[ venue-exhibitions ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(4rem,7vw,7rem)] pb-[clamp(3rem,5vw,5rem)] compact:px-4 compact:pt-8 compact:pb-8" aria-labelledby="venue-exhibitions-title">
        <div class="[ venue-exhibitions-intro ] mb-12 grid grid-cols-[minmax(0,1fr)_minmax(20rem,0.55fr)] items-start gap-[clamp(2.5rem,6vw,6rem)] tablet:grid-cols-1 compact:mb-5 compact:gap-4">
          <div class="[ section-heading ] relative z-1 mb-8 compact:mb-3">
            <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('venue.ledger', { season: seasonYears || $t('venue.recordsPending') }) }}</p>
            <h2 id="venue-exhibitions-title" class="m-0 text-h2-lg font-light leading-[0.98] compact:text-4xl">{{ $t('venue.exhibitionCount', exhibitions.length) }}. <span class="text-archive-red">{{ $t('venue.changingSpace') }}</span></h2>
            <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('venue.searchIntro') }}</p>
          </div>
          <ArchiveFactLedger class="mt-9 tablet:mt-0" :items="venueLedgerItems" />
        </div>

        <ArchiveSearchForm
          v-model="venueSearchQuery"
          class="[ venue-record-search ]"
          id="venue-record-search"
          :label="$t('venue.searchLabel', { name: venue.name })"
          :placeholder="$t('venue.searchPlaceholder')"
        />

        <div class="[ venue-search-status ] mb-8 flex min-h-8 items-center justify-between gap-4 text-eyebrow text-archive-muted compact:mb-4 compact:min-h-0 compact:gap-2 compact:text-xs">
          <p class="m-0" role="status" aria-live="polite">{{ $t('venue.showing', { visible: filteredExhibitions.length, total: exhibitions.length }) }}</p>
          <button v-if="venueSearchQuery" class="border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="venueSearchQuery = ''">{{ $t('venue.clearSearch') }}</button>
        </div>

        <div v-if="!filteredExhibitions.length" class="[ venue-search-empty ] border-y border-archive-rule-deep/24 py-16 text-center">
          <p class="m-0 text-title text-archive-ink">{{ venueSearchQuery ? $t('venue.noMatches', { query: venueSearchQuery }) : $t('venue.noRecords', { name: venue.name }) }}</p>
          <button v-if="venueSearchQuery" class="mt-4 border-0 bg-transparent text-archive-red underline underline-offset-4" type="button" @click="venueSearchQuery = ''">{{ $t('venue.showAll', { name: venue.name }) }}</button>
        </div>

        <div v-else class="[ venue-exhibition-browser ] grid grid-cols-[minmax(24rem,0.72fr)_minmax(34rem,1.28fr)] items-start gap-[clamp(2rem,5vw,5rem)] tablet:grid-cols-[minmax(18rem,0.72fr)_minmax(28rem,1.28fr)] tablet:gap-8 medium:grid-cols-1">
          <ol class="[ venue-exhibition-list ] m-0 list-none p-0 medium:row-start-2" :aria-label="$t('venue.exhibitionsAria', { name: venue.name })">
            <VenueExhibitionLedgerRow
              v-for="(exhibition, index) in filteredExhibitions"
              :key="exhibition.id"
              :exhibition="exhibition"
              :index="index"
              :selected="selectedExhibition?.id === exhibition.id"
              @select="selectExhibition"
            />
          </ol>

          <aside v-if="previewExhibition" class="[ venue-preview-column ] sticky top-32 min-w-0 medium:relative medium:top-0 medium:row-start-1" :aria-label="$t('venue.previewAria')">
            <ExhibitionFrameCard class="[ venue-active-preview ] archive-venue-active-preview block min-h-[clamp(31rem,42vw,40rem)] w-full medium:min-h-124 compact:min-h-80" surface-class="bg-archive-night">
              <Transition name="archive-venue-preview-image">
                <img
                  :key="previewExhibition.id"
                  class="[ venue-preview-image ] archive-venue-preview-image absolute inset-0 size-full object-cover brightness-76 saturate-88"
                  :src="previewExhibition.image"
                  :alt="previewExhibition.image_alt"
                />
              </Transition>
              <div class="[ venue-preview-shade ] archive-venue-preview-shade absolute inset-x-0 top-[35%] bottom-0" />
              <div class="[ venue-preview-copy ] absolute right-[clamp(1.5rem,4vw,3rem)] bottom-[clamp(1.5rem,4vw,2.7rem)] left-[clamp(1.5rem,4vw,3rem)] z-2 text-archive-light-ink compact:right-[1.4rem] compact:bottom-[1.4rem] compact:left-[1.4rem]" aria-live="polite">
                <p class="[ venue-preview-date ] mt-0 mb-[0.4rem] text-xs tracking-[0.08em] text-archive-ochre uppercase"><time :datetime="previewExhibition.start_date">{{ previewExhibition.date_range }}</time></p>
                <h3 class="[ venue-preview-title ] m-0 max-w-152 text-h2-sm leading-[0.95] font-light">{{ previewExhibition.title }}</h3>
                <p class="[ artist-name ] mt-[0.4rem] mb-[1.15rem] font-display text-lg text-archive-ochre">{{ previewExhibition.artist }}</p>
                <ArchiveTextLink class="[ venue-preview-link ] gap-[0.65rem]" surface="night" :to="localePath(`/exhibitions/${previewExhibition.slug}`)">
                  {{ $t('venue.openExhibition') }}
                  <template #icon><ArchiveArrow class="w-[1.65rem]" /></template>
                </ArchiveTextLink>
              </div>
              <div v-if="previewLoading" class="[ venue-preview-loader ] absolute inset-0 z-4 grid place-content-center justify-items-center gap-[0.9rem] bg-archive-paper/92 text-center text-xs tracking-[0.09em] text-archive-red uppercase" role="status" aria-live="polite">
                <span class="[ venue-loader-symbol ] archive-venue-loader-symbol relative block size-16 rounded-full border border-archive-red/20 border-t-archive-red" aria-hidden="true" />
                <span>{{ $t('venue.loadingPreview') }}</span>
              </div>
              <div v-else-if="previewLoadFailed" class="[ venue-preview-error ] absolute inset-0 z-4 grid place-content-center justify-items-center gap-[0.9rem] bg-archive-paper/92 p-8 text-center text-xs tracking-[0.04em] text-archive-ink normal-case" role="status">
                {{ $t('venue.previewUnavailable') }}
              </div>
            </ExhibitionFrameCard>
          </aside>
        </div>
      </section>

      <img class="[ venue-section-divider ] pointer-events-none mx-auto block w-[min(46rem,84vw)] opacity-62" src="/media/svg/dividers/exhibitions-section-divider.svg" alt="" aria-hidden="true" />

      <section
        class="[ venue-about ] [ section-band ] relative mx-auto mt-8 grid max-w-[105rem] grid-cols-[11rem_minmax(0,1.15fr)_minmax(18rem,0.85fr)] items-start gap-[clamp(2rem,5vw,5rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:mt-4 compact:gap-6 compact:px-4 compact:py-8"
        aria-labelledby="venue-about-title"
      >
        <div class="[ venue-about-ornament ] tablet:hidden" aria-hidden="true">
          <img class="w-42 -rotate-4 opacity-48" src="/media/images/landing/footer/permanently-preserved-stamp.png" alt="" />
        </div>
        <div class="[ venue-about-copy ]">
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('venue.venueEyebrow') }}</p>
          <h2 id="venue-about-title" class="mb-[1.85rem] text-h2-lg font-light leading-[0.98] compact:mb-4 compact:text-4xl">{{ $t('venue.venueTitle') }} <span class="text-archive-red">{{ $t('venue.venueAccent') }}</span></h2>
          <p v-for="paragraph in venue.about ?? [$t('venue.fallbackAbout1', { name: venue.name, city: venue.city }), $t('venue.fallbackAbout2')]" :key="paragraph" class="max-w-180 text-button leading-[1.58] text-archive-body compact:text-base compact:leading-normal">{{ paragraph }}</p>
        </div>
        <blockquote class="m-0 border-l border-archive-red/48 pl-8 text-title leading-[1.4] italic text-archive-copy-warm tablet:max-w-2xl compact:pl-4 compact:text-base">
          “{{ $t('venue.quote') }}”
          <cite class="mt-4 block text-xs not-italic tracking-[0.08em] text-archive-red uppercase">{{ $t('venue.fieldNote') }}</cite>
        </blockquote>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

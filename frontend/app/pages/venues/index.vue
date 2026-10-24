<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { venues, venueExhibitions } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()

const gallerySearchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const selectedState = ref(typeof route.query.state === 'string' ? route.query.state : '')
const normalize = (value: string) => value.trim().toLocaleLowerCase()

const states = computed(() => [...new Set(venues.value.map((venue) => venue.state))]
  .sort((left, right) => left.localeCompare(right)))
const stateCounts = computed(() => new Map(states.value.map((state) => [
  state,
  venues.value.filter((venue) => venue.state === state).length
])))
const recordsByGallery = computed(() => new Map(venues.value.map((venue) => [
  venue.slug,
  venueExhibitions.value.filter((exhibition) => exhibition.venue_slug === venue.slug).length
])))
const orderedVenues = computed(() => [...venues.value].sort((left, right) => {
  if (Boolean(left.featured) !== Boolean(right.featured)) return left.featured ? -1 : 1
  return left.name.localeCompare(right.name)
}))
const filteredVenues = computed(() => {
  const query = normalize(gallerySearchQuery.value)

  return orderedVenues.value.filter((venue) => {
    if (selectedState.value && venue.state !== selectedState.value) return false
    if (!query) return true

    return [
      venue.name,
      venue.city_name,
      venue.postal_code,
      venue.state,
      venue.country,
      venue.address,
      venue.description ?? ''
    ].some((value) => normalize(value).includes(query))
  })
})
const galleryLedgerItems = computed(() => [
  { label: t('galleries.ledgerGalleries'), value: venues.value.length },
  { label: t('galleries.ledgerStates'), value: states.value.length },
  { label: t('galleries.ledgerRecords'), value: venueExhibitions.value.length }
])
// Mobile: the ledger's three facts as one line in the eyebrow's place.
const galleryFacts = computed(() => [
  t('galleries.factGalleries', venues.value.length),
  t('galleries.factStates', states.value.length),
  t('galleries.factExhibitions', venueExhibitions.value.length)
].map((fact) => fact.replaceAll(' ', '\u00A0')).join(' · '))

const clearFilters = () => {
  gallerySearchQuery.value = ''
  selectedState.value = ''
}

watch(() => route.query, (query) => {
  gallerySearchQuery.value = typeof query.q === 'string' ? query.q : ''
  selectedState.value = typeof query.state === 'string' && states.value.includes(query.state) ? query.state : ''
})

watch([gallerySearchQuery, selectedState], ([query, state]) => {
  const nextQuery = query.trim()
  const currentQuery = typeof route.query.q === 'string' ? route.query.q : ''
  const currentState = typeof route.query.state === 'string' ? route.query.state : ''
  if (nextQuery === currentQuery && state === currentState) return

  void router.replace({
    path: localePath('/venues/'),
    query: {
      ...(nextQuery ? { q: nextQuery } : {}),
      ...(state ? { state } : {})
    }
  })
})

usePageSeo('/venues/')
</script>

<template>
  <main class="[ site-shell ] [ galleries-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="galleries" />

    <div id="main-content">
      <section class="[ galleries-page-intro ] [ section-band ] relative mx-auto grid min-h-120 max-w-[105rem] grid-cols-[minmax(0,1fr)_18rem] items-end gap-[clamp(3rem,8vw,8rem)] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3rem,6vw,6rem)] pb-[clamp(1.5rem,3vw,3rem)] tablet:grid-cols-[minmax(0,1fr)_16rem] tablet:gap-8 compact:min-h-0 compact:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-4" aria-labelledby="galleries-page-title">
        <div class="[ galleries-page-heading ]">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ $t('galleries.breadcrumb') }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow archive-routed-eyebrow-facts m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs"><span class="compact:hidden">{{ $t('galleries.eyebrow') }}</span><span class="hidden compact:inline">{{ galleryFacts }}</span></p>
          <h1 id="galleries-page-title" class="m-0 max-w-232 font-display text-hero font-light leading-[0.92] tablet:text-h1-steep compact:text-5xl compact:leading-none">{{ $t('galleries.title') }} <span class="text-archive-red">{{ $t('galleries.accent') }}</span></h1>
          <p class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">{{ $t('galleries.intro') }}</p>
        </div>

        <ArchiveFactLedger class="[ galleries-page-ledger ] compact:hidden" :items="galleryLedgerItems" desktop-layout="stacked" />
      </section>

      <section id="gallery-directory" class="[ gallery-directory ] [ section-band ] relative pb-[clamp(3rem,5vw,5rem)] compact:pb-6" :aria-label="$t('galleries.directory')">
        <div class="[ gallery-directory-controls ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4">
          <ArchiveSearchForm
            v-model="gallerySearchQuery"
            class="[ gallery-directory-search ]"
            id="gallery-directory-search"
            :label="$t('galleries.searchLabel')"
            :placeholder="$t('galleries.searchPlaceholder')"
          />

          <ArchiveAlphabetRail class="[ gallery-state-filter ] mt-7 gap-5 pb-4 compact:mt-4 compact:gap-4 compact:pb-3" :label="$t('galleries.stateFilterAria')">
            <button class="shrink-0 border-0 bg-transparent p-0 text-button text-archive-muted aria-pressed:font-medium aria-pressed:text-archive-red compact:text-sm" type="button" :aria-pressed="!selectedState" @click="selectedState = ''">{{ $t('common.all') }} <small class="ml-1 text-xs">{{ venues.length }}</small></button>
            <button v-for="state in states" :key="state" class="shrink-0 border-0 bg-transparent p-0 text-button text-archive-muted aria-pressed:font-medium aria-pressed:text-archive-red compact:text-sm" type="button" :aria-pressed="selectedState === state" @click="selectedState = selectedState === state ? '' : state">{{ state }} <small class="ml-1 text-xs">{{ stateCounts.get(state) }}</small></button>
          </ArchiveAlphabetRail>
        </div>

        <ArchiveInsetDivider />

        <div class="[ gallery-directory-results ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-3">
          <div class="[ gallery-directory-status ] my-7 flex min-h-8 items-center justify-between gap-4 text-eyebrow text-archive-muted compact:my-4 compact:min-h-0 compact:gap-2 compact:text-xs">
            <p class="m-0" role="status" aria-live="polite">{{ $t('galleries.status', { visible: filteredVenues.length, total: venues.length }) }}</p>
            <button v-if="gallerySearchQuery || selectedState" class="border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="clearFilters">{{ $t('galleries.clearFilters') }}</button>
          </div>

          <div v-if="!filteredVenues.length" class="[ gallery-directory-empty ] border-y border-archive-rule-deep/24 py-16 text-center">
            <p class="m-0 text-title text-archive-ink">{{ $t('galleries.noMatches') }}</p>
            <button class="mt-4 border-0 bg-transparent text-archive-red underline underline-offset-4" type="button" @click="clearFilters">{{ $t('galleries.returnAll') }}</button>
          </div>

          <div v-else class="[ gallery-directory-grid ] grid grid-cols-3 items-stretch gap-5 tablet:grid-cols-2 compact:grid-cols-2 compact:gap-2.5">
            <GalleryDirectoryCard
              v-for="venue in filteredVenues"
              :key="venue.id"
              :venue="venue"
              :record-count="recordsByGallery.get(venue.slug) ?? 0"
              :featured="Boolean(venue.featured)"
            />
          </div>
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

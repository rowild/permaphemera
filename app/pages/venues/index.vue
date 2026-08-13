<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { venues, locationExhibitions } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()

const gallerySearchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const selectedState = ref(typeof route.query.state === 'string' ? route.query.state : '')
const normalize = (value: string) => value.trim().toLocaleLowerCase()

const states = computed(() => [...new Set(venues.value.map((location) => location.state))]
  .sort((left, right) => left.localeCompare(right)))
const stateCounts = computed(() => new Map(states.value.map((state) => [
  state,
  venues.value.filter((location) => location.state === state).length
])))
const recordsByGallery = computed(() => new Map(venues.value.map((location) => [
  location.slug,
  locationExhibitions.value.filter((exhibition) => exhibition.venue_slug === location.slug).length
])))
const orderedLocations = computed(() => [...venues.value].sort((left, right) => {
  if (Boolean(left.featured) !== Boolean(right.featured)) return left.featured ? -1 : 1
  return left.name.localeCompare(right.name)
}))
const filteredLocations = computed(() => {
  const query = normalize(gallerySearchQuery.value)

  return orderedLocations.value.filter((location) => {
    if (selectedState.value && location.state !== selectedState.value) return false
    if (!query) return true

    return [
      location.name,
      location.city_name,
      location.postal_code,
      location.state,
      location.country,
      location.address,
      location.description ?? ''
    ].some((value) => normalize(value).includes(query))
  })
})
const galleryLedgerItems = computed(() => [
  { label: t('galleries.ledgerGalleries'), value: venues.value.length },
  { label: t('galleries.ledgerStates'), value: states.value.length },
  { label: t('galleries.ledgerRecords'), value: locationExhibitions.value.length }
])

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

useSeoMeta({
  title: () => t('galleries.seoTitle'),
  description: () => t('galleries.seoDescription')
})
</script>

<template>
  <main class="[ site-shell ] [ galleries-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="galleries" />

    <div id="main-content">
      <section class="[ galleries-page-intro ] [ section-band ] relative mx-auto grid min-h-132 max-w-[105rem] grid-cols-[minmax(0,1fr)_minmax(22rem,0.52fr)] items-end gap-[clamp(3rem,8vw,8rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,6vw,6rem)] tablet:grid-cols-[minmax(0,1fr)_18rem] tablet:gap-8 compact:min-h-0 compact:grid-cols-1 compact:gap-6 compact:px-4 compact:py-6" aria-labelledby="galleries-page-title">
        <div class="[ galleries-page-heading ]">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ $t('galleries.breadcrumb') }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('galleries.eyebrow') }}</p>
          <h1 id="galleries-page-title" class="m-0 max-w-232 font-display text-hero font-light leading-[0.92] tablet:text-h1-steep compact:text-5xl compact:leading-none">{{ $t('galleries.title') }} <span class="text-archive-red">{{ $t('galleries.accent') }}</span></h1>
          <p class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">{{ $t('galleries.intro') }}</p>
        </div>

        <div class="[ galleries-atlas-mark ] relative min-h-80 border-l border-archive-red/38 pl-8 tablet:min-h-64 compact:min-h-0 compact:border-t compact:border-l-0 compact:pt-4 compact:pl-0" aria-hidden="true">
          <p class="m-0 text-hero-xl font-light leading-[0.72] text-archive-red/88">{{ String(venues.length).padStart(2, '0') }}</p>
          <p class="mt-4 mb-0 max-w-48 text-xs tracking-widest text-archive-muted uppercase">{{ $t('galleries.atlasCaption') }}</p>
          <img class="pointer-events-none absolute right-0 bottom-0 w-36 -rotate-8 opacity-38 compact:hidden" src="/media/images/landing/footer/permanently-preserved-stamp.png" alt="" />
        </div>
      </section>

      <ArchiveInsetDivider class="compact:hidden" />

      <section id="gallery-directory" class="[ gallery-directory ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-3 compact:py-6" aria-labelledby="gallery-directory-title">
        <div class="[ gallery-directory-heading ] grid grid-cols-[minmax(0,1fr)_minmax(20rem,0.62fr)] items-start gap-[clamp(2.5rem,6vw,6rem)] tablet:grid-cols-1 compact:gap-4">
          <div class="[ section-heading ] relative z-1 mb-4">
            <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('galleries.directoryEyebrow') }}</p>
            <h2 id="gallery-directory-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('galleries.directoryTitle') }} <span class="text-archive-red">{{ $t('galleries.directoryAccent') }}</span></h2>
            <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('galleries.directoryIntro') }}</p>
          </div>
          <ArchiveFactLedger class="mt-9 tablet:mt-0" :items="galleryLedgerItems" />
        </div>

        <ArchiveSearchForm
          v-model="gallerySearchQuery"
          class="[ gallery-directory-search ]"
          id="gallery-directory-search"
          :label="$t('galleries.searchLabel')"
          :placeholder="$t('galleries.searchPlaceholder')"
        />

        <ArchiveAlphabetRail class="[ gallery-state-filter ] mt-7 gap-5 border-b border-archive-rule-warm/20 pb-4 compact:mt-4 compact:gap-4 compact:pb-3" :label="$t('galleries.stateFilterAria')">
          <button class="shrink-0 border-0 bg-transparent p-0 text-button text-archive-muted aria-pressed:font-medium aria-pressed:text-archive-red compact:text-sm" type="button" :aria-pressed="!selectedState" @click="selectedState = ''">{{ $t('common.all') }} <small class="ml-1 text-xs">{{ venues.length }}</small></button>
          <button v-for="state in states" :key="state" class="shrink-0 border-0 bg-transparent p-0 text-button text-archive-muted aria-pressed:font-medium aria-pressed:text-archive-red compact:text-sm" type="button" :aria-pressed="selectedState === state" @click="selectedState = selectedState === state ? '' : state">{{ state }} <small class="ml-1 text-xs">{{ stateCounts.get(state) }}</small></button>
        </ArchiveAlphabetRail>

        <div class="[ gallery-directory-status ] my-7 flex min-h-8 items-center justify-between gap-4 text-eyebrow text-archive-muted compact:my-4 compact:min-h-0 compact:gap-2 compact:text-xs">
          <p class="m-0" role="status" aria-live="polite">{{ $t('galleries.status', { visible: filteredLocations.length, total: venues.length }) }}</p>
          <button v-if="gallerySearchQuery || selectedState" class="border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="clearFilters">{{ $t('galleries.clearFilters') }}</button>
        </div>

        <div v-if="!filteredLocations.length" class="[ gallery-directory-empty ] border-y border-archive-rule-deep/24 py-16 text-center">
          <p class="m-0 text-title text-archive-ink">{{ $t('galleries.noMatches') }}</p>
          <button class="mt-4 border-0 bg-transparent text-archive-red underline underline-offset-4" type="button" @click="clearFilters">{{ $t('galleries.returnAll') }}</button>
        </div>

        <div v-else class="[ gallery-directory-grid ] grid grid-cols-3 items-stretch gap-5 tablet:grid-cols-2 compact:grid-cols-2 compact:gap-2.5">
          <GalleryDirectoryCard
            v-for="(location, index) in filteredLocations"
            :key="location.id"
            :location="location"
            :index="index"
            :record-count="recordsByGallery.get(location.slug) ?? 0"
            :featured="Boolean(location.featured)"
          />
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

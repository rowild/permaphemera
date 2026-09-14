<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { venueExhibitions } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()
const archiveToday = useArchiveToday()

const exhibitionSearchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const normalize = (value: string) => value.trim().toLocaleLowerCase()
const orderedExhibitions = computed(() => [...venueExhibitions.value].sort((left, right) => {
  return right.start_date.localeCompare(left.start_date)
    || right.end_date.localeCompare(left.end_date)
    || left.title.localeCompare(right.title)
}))
const filteredExhibitions = computed(() => {
  const query = normalize(exhibitionSearchQuery.value)
  if (!query) return orderedExhibitions.value

  return orderedExhibitions.value.filter((exhibition) => [
    exhibition.title,
    exhibition.artist,
    exhibition.venue,
    exhibition.city,
    exhibition.date_range,
    exhibition.summary,
    exhibition.description ?? '',
    exhibition.medium ?? ''
  ].some((value) => normalize(value).includes(query)))
})
const exhibitionYears = computed(() => [...new Set(venueExhibitions.value.map((exhibition) => exhibition.start_date.slice(0, 4)))].sort((left, right) => right.localeCompare(left)))
const exhibitionVenues = computed(() => new Set(venueExhibitions.value.map((exhibition) => exhibition.venue_slug)).size)
const exhibitionLedgerItems = computed(() => [
  { label: t('exhibitionsDirectory.ledgerRecords'), value: venueExhibitions.value.length },
  { label: t('exhibitionsDirectory.ledgerVenues'), value: exhibitionVenues.value },
  { label: t('exhibitionsDirectory.ledgerSeason'), value: exhibitionYears.value.join(' · ') }
])
const featuredExhibition = computed(() => selectFeaturedExhibition(orderedExhibitions.value, archiveToday.value))

watch(() => route.query.q, (query) => {
  exhibitionSearchQuery.value = typeof query === 'string' ? query : ''
})

watch(exhibitionSearchQuery, (query) => {
  const nextQuery = query.trim()
  const currentQuery = typeof route.query.q === 'string' ? route.query.q : ''
  if (nextQuery === currentQuery) return

  void router.replace({
    path: localePath('/exhibitions/'),
    query: nextQuery ? { q: nextQuery } : {}
  })
})

useSeoMeta({
  title: () => t('exhibitionsDirectory.seoTitle'),
  description: () => t('exhibitionsDirectory.seoDescription')
})
</script>

<template>
  <main class="[ site-shell ] [ exhibitions-directory-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="exhibitions" />

    <div id="main-content">
      <section class="[ exhibitions-directory-intro ] [ section-band ] relative mx-auto grid min-h-144 max-w-[105rem] grid-cols-[minmax(0,0.9fr)_minmax(25rem,1.1fr)] items-center gap-[clamp(3rem,8vw,8rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,6vw,6rem)] tablet:grid-cols-1 tablet:gap-10 compact:min-h-0 compact:gap-6 compact:px-4 compact:py-6" aria-labelledby="exhibitions-directory-title">
        <div class="[ exhibitions-directory-heading ] tablet:row-start-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ $t('exhibitionsDirectory.breadcrumb') }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('exhibitionsDirectory.eyebrow') }}</p>
          <h1 id="exhibitions-directory-title" class="m-0 max-w-232 font-display text-hero font-light leading-[0.92] compact:text-5xl compact:leading-none">{{ $t('exhibitionsDirectory.title') }} <span class="text-archive-red">{{ $t('exhibitionsDirectory.accent') }}</span></h1>
          <p class="mt-[1.4rem] mb-0 max-w-168 text-lg leading-[1.55] text-archive-body compact:mt-4 compact:text-base compact:leading-normal">{{ $t('exhibitionsDirectory.intro') }}</p>
          <ArchiveFactLedger class="mt-8" :items="exhibitionLedgerItems" />
        </div>

        <figure v-if="featuredExhibition" class="[ exhibitions-directory-hero-figure ] relative m-0 tablet:row-start-1">
          <ArchiveFramedImage class="aspect-[1.18] rotate-[0.6deg] compact:aspect-[1.3] compact:rotate-0" :src="featuredExhibition.image" :alt="featuredExhibition.image_alt" />
          <figcaption class="mt-3 ml-5 flex items-center gap-3 text-sm text-archive-muted compact:mt-2 compact:ml-2 compact:text-xs"><span class="tracking-widest text-archive-red uppercase">{{ $t('exhibitionsDirectory.figure') }}</span>{{ featuredExhibition.title }} · {{ featuredExhibition.artist }}</figcaption>
          <div class="absolute -right-5 -bottom-5 z-6 grid size-28 -rotate-6 place-content-center rounded-full border border-archive-red/42 bg-archive-paper/92 text-center text-archive-red compact:-right-1 compact:-bottom-3 compact:size-20" aria-hidden="true">
            <span class="text-xs tracking-widest uppercase">REC</span>
            <strong class="text-4xl leading-none font-light compact:text-3xl">{{ String(venueExhibitions.length).padStart(2, '0') }}</strong>
          </div>
        </figure>
      </section>

      <ArchiveInsetDivider />

      <section id="exhibitions-directory" class="[ exhibitions-directory ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-3 compact:py-6" aria-labelledby="exhibitions-index-title">
        <div class="[ section-heading ] relative z-1 mb-4">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('exhibitionsDirectory.indexEyebrow') }}</p>
          <h2 id="exhibitions-index-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('exhibitionsDirectory.indexTitle') }} <span class="text-archive-red">{{ $t('exhibitionsDirectory.indexAccent') }}</span></h2>
          <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('exhibitionsDirectory.indexIntro') }}</p>
        </div>

        <ArchiveSearchForm
          v-model="exhibitionSearchQuery"
          class="[ exhibitions-directory-search ]"
          id="exhibitions-directory-search"
          :label="$t('exhibitionsDirectory.searchLabel')"
          :placeholder="$t('exhibitionsDirectory.searchPlaceholder')"
        />

        <div class="[ exhibitions-directory-status ] my-7 flex min-h-8 items-center justify-between gap-4 text-eyebrow text-archive-muted compact:my-4 compact:min-h-0 compact:gap-2 compact:text-xs">
          <p class="m-0" role="status" aria-live="polite">{{ $t('exhibitionsDirectory.status', { visible: filteredExhibitions.length, total: venueExhibitions.length }) }}</p>
          <button v-if="exhibitionSearchQuery" class="border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="exhibitionSearchQuery = ''">{{ $t('exhibitionsDirectory.clearSearch') }}</button>
        </div>

        <div v-if="!filteredExhibitions.length" class="[ exhibitions-directory-empty ] border-y border-archive-rule-deep/24 py-16 text-center">
          <p class="m-0 text-title text-archive-ink">{{ $t('exhibitionsDirectory.noMatches') }}</p>
          <button class="mt-4 border-0 bg-transparent text-archive-red underline underline-offset-4" type="button" @click="exhibitionSearchQuery = ''">{{ $t('exhibitionsDirectory.returnAll') }}</button>
        </div>

        <div v-else class="[ exhibitions-directory-grid ] grid grid-cols-2 items-stretch gap-6 compact:grid-cols-2 compact:gap-2.5">
          <ExhibitionDirectoryCard
            v-for="(exhibition, index) in filteredExhibitions"
            :key="exhibition.id"
            :exhibition="exhibition"
            :index="index"
            :featured="exhibition.id === featuredExhibition?.id"
          />
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

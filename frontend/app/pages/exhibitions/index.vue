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
const searching = computed(() => Boolean(normalize(exhibitionSearchQuery.value)))
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
// Mobile: the ledger's counts as one line in the eyebrow's place.
const exhibitionFacts = computed(() => [
  t('exhibitionsDirectory.factExhibitions', venueExhibitions.value.length),
  t('exhibitionsDirectory.factVenues', exhibitionVenues.value)
].map((fact) => fact.replaceAll(' ', '\u00A0')).join(' · '))
const timeGroups = computed(() => groupExhibitionsByTime(venueExhibitions.value, archiveToday.value))
// Mobile: one slider per time group; current exhibitions in the larger cards.
const SLIDES = { current: 5, upcoming: 5, past: 10 } as const
const sliderGroups = computed(() => (['current', 'upcoming', 'past'] as const)
  .map((id) => ({ id, items: timeGroups.value[id], size: id === 'current' ? 'feature' as const : 'regular' as const }))
  .filter((group) => group.items.length))

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
      <section class="[ exhibitions-directory-intro ] [ section-band ] relative mx-auto grid min-h-120 max-w-[105rem] grid-cols-[minmax(0,1fr)_18rem] items-end gap-[clamp(3rem,8vw,8rem)] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3rem,6vw,6rem)] pb-[clamp(1.5rem,3vw,3rem)] tablet:grid-cols-[minmax(0,1fr)_16rem] tablet:gap-8 compact:min-h-0 compact:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-4" aria-labelledby="exhibitions-directory-title">
        <div class="[ exhibitions-directory-heading ]">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ $t('exhibitionsDirectory.breadcrumb') }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow archive-routed-eyebrow-facts m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs"><span class="compact:hidden">{{ $t('exhibitionsDirectory.eyebrow') }}</span><span class="hidden compact:inline">{{ exhibitionFacts }}</span></p>
          <h1 id="exhibitions-directory-title" class="m-0 max-w-232 font-display text-hero font-light leading-[0.92] tablet:text-h1-steep compact:text-5xl compact:leading-none">{{ $t('exhibitionsDirectory.title') }} <span class="text-archive-red">{{ $t('exhibitionsDirectory.accent') }}</span></h1>
          <p class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">{{ $t('exhibitionsDirectory.intro') }}</p>
        </div>

        <ArchiveFactLedger class="[ exhibitions-directory-ledger ] compact:hidden" :items="exhibitionLedgerItems" desktop-layout="stacked" />
      </section>

      <section id="exhibitions-directory" class="[ exhibitions-directory ] [ section-band ] relative pb-[clamp(3rem,5vw,5rem)] compact:pb-6" :aria-label="$t('exhibitionsDirectory.directory')">
        <div class="[ exhibitions-directory-controls ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4">
          <ArchiveSearchForm
            v-model="exhibitionSearchQuery"
            class="[ exhibitions-directory-search ]"
            id="exhibitions-directory-search"
            :label="$t('exhibitionsDirectory.searchLabel')"
            :placeholder="$t('exhibitionsDirectory.searchPlaceholder')"
          />
        </div>

        <ArchiveInsetDivider class="mt-8 compact:mt-4" />

        <div class="[ exhibitions-directory-results ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-3">
          <div class="[ exhibitions-directory-status ] my-7 flex min-h-8 items-center justify-between gap-4 text-eyebrow text-archive-muted compact:my-4 compact:min-h-0 compact:gap-2 compact:text-xs">
            <p class="m-0" role="status" aria-live="polite">{{ searching ? $t('exhibitionsDirectory.statusSearch', { visible: filteredExhibitions.length, total: venueExhibitions.length }) : $t('exhibitionsDirectory.statusAll', { total: venueExhibitions.length }) }}</p>
            <button v-if="exhibitionSearchQuery" class="border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="exhibitionSearchQuery = ''">{{ $t('exhibitionsDirectory.clearSearch') }}</button>
          </div>

          <!-- A search shows one flat list of every match, newest first, in pages. -->
          <template v-if="searching">
            <div v-if="!filteredExhibitions.length" class="[ exhibitions-directory-empty ] border-y border-archive-rule-deep/24 py-16 text-center">
              <p class="m-0 text-title text-archive-ink">{{ $t('exhibitionsDirectory.noMatches') }}</p>
              <button class="mt-4 border-0 bg-transparent text-archive-red underline underline-offset-4" type="button" @click="exhibitionSearchQuery = ''">{{ $t('exhibitionsDirectory.returnAll') }}</button>
            </div>
            <ExhibitionPagedList v-else :exhibitions="filteredExhibitions" anchor="exhibitions-directory-results" />
          </template>

          <!-- Without a search: current exhibitions first, then upcoming beside past.
               Mobile: current and upcoming as tabs over one slider each, then past. -->
          <div v-else class="[ exhibitions-time-groups ] grid gap-[clamp(3rem,5vw,5rem)] compact:gap-8">
            <ExhibitionTimeGroup group="current" class="compact:hidden" :exhibitions="timeGroups.current" />
            <section
              v-for="group in sliderGroups"
              :key="group.id"
              class="[ exhibitions-slider ] hidden min-w-0 compact:block"
              :aria-labelledby="`exhibitions-${group.id}-slider-title`"
            >
              <h3 :id="`exhibitions-${group.id}-slider-title`" class="m-0 mb-4 pb-0.5 font-display text-3xl font-normal leading-[1.12]">{{ $t(`exhibitionsDirectory.groups.${group.id}.title`) }}</h3>
              <ExhibitionSlideTrack :exhibitions="group.items.slice(0, SLIDES[group.id])" :size="group.size" />
              <ArchiveTextLink class="mt-3" :to="localePath(`/exhibitions/${group.id}/`)">
                {{ $t(`exhibitionsDirectory.groups.${group.id}.all`, { count: group.items.length }) }}
                <ArchiveArrow />
              </ArchiveTextLink>
            </section>
            <div class="[ exhibitions-time-columns ] grid grid-cols-2 items-start gap-[clamp(2rem,4vw,4rem)] tablet:grid-cols-1 tablet:gap-12 compact:gap-8">
              <ExhibitionTimeGroup group="upcoming" class="compact:hidden" :exhibitions="timeGroups.upcoming" />
              <ExhibitionTimeGroup group="past" class="compact:hidden" :exhibitions="timeGroups.past" />
            </div>
          </div>
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

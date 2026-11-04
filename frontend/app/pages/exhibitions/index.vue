<script setup lang="ts">
const { venueExhibitions } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()
const archiveToday = useArchiveToday()

const exhibitionSearchQuery = useQueryParam('q')
const orderedExhibitions = computed(() => [...venueExhibitions.value].sort((left, right) => {
  return right.start_date.localeCompare(left.start_date)
    || right.end_date.localeCompare(left.end_date)
    || left.title.localeCompare(right.title)
}))
const searching = computed(() => Boolean(normalizeSearch(exhibitionSearchQuery.value)))
const filteredExhibitions = computed(() => {
  if (!searching.value) return orderedExhibitions.value

  return orderedExhibitions.value.filter((exhibition) => matchesSearch(exhibitionSearchQuery.value, [
    exhibition.title,
    exhibition.artist,
    exhibition.venue,
    exhibition.city,
    exhibition.date_range,
    exhibition.summary,
    exhibition.description,
    exhibition.medium
  ]))
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

usePageSeo('/exhibitions/')
definePageMeta({ navActive: 'exhibitions' })
</script>

<template>
  <div class="[ exhibitions-directory-page ]">

      <ArchiveDirectoryHero
        class="[ exhibitions-directory-intro ]"
        title-id="exhibitions-directory-title"
        :breadcrumb="$t('exhibitionsDirectory.breadcrumb')"
        :eyebrow="$t('exhibitionsDirectory.eyebrow')"
        :facts="exhibitionFacts"
        :title="$t('exhibitionsDirectory.title')"
        :accent="$t('exhibitionsDirectory.accent')"
        :intro="$t('exhibitionsDirectory.intro')"
        :ledger="exhibitionLedgerItems"
      />

      <section id="exhibitions-directory" class="[ exhibitions-directory ] [ section-band ] relative pb-[clamp(3rem,5vw,5rem)] compact:pb-6" :aria-label="$t('exhibitionsDirectory.directory')">
        <div class="[ exhibitions-directory-controls ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4">
          <ArchiveSearchForm
            id="exhibitions-directory-search"
            v-model="exhibitionSearchQuery"
            class="[ exhibitions-directory-search ]"
            :label="$t('exhibitionsDirectory.searchLabel')"
            :placeholder="$t('exhibitionsDirectory.searchPlaceholder')"
          />
        </div>

        <ArchiveInsetDivider class="mt-8 compact:mt-4" />

        <div class="[ exhibitions-directory-results ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-3">
          <ArchiveDirectoryStatus class="[ exhibitions-directory-status ] my-7 compact:my-4" :show="searching" :text="$t('exhibitionsDirectory.statusSearch', { visible: filteredExhibitions.length, total: venueExhibitions.length })" :clear-label="$t('exhibitionsDirectory.clearSearch')" @clear="exhibitionSearchQuery = ''" />

          <!-- A search shows one flat list of every match, newest first, in pages. -->
          <template v-if="searching">
            <ArchiveEmptyState v-if="!filteredExhibitions.length" class="[ exhibitions-directory-empty ]" :message="$t('exhibitionsDirectory.noMatches')" :action-label="$t('exhibitionsDirectory.returnAll')" @action="exhibitionSearchQuery = ''" />
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
              <ExhibitionSlideTrack :exhibitions="group.items.slice(0, SLIDES[group.id])" :size="group.size">
                <template #link>
                  <ArchiveTextLink :to="localePath(`/exhibitions/${group.id}/`)">
                    {{ $t(`exhibitionsDirectory.groups.${group.id}.all`, { count: group.items.length }) }}
                    <ArchiveArrow />
                  </ArchiveTextLink>
                </template>
              </ExhibitionSlideTrack>
            </section>
            <div class="[ exhibitions-time-columns ] grid grid-cols-2 items-start gap-[clamp(2rem,4vw,4rem)] tablet:grid-cols-1 tablet:gap-12 compact:gap-8">
              <ExhibitionTimeGroup group="upcoming" class="compact:hidden" :exhibitions="timeGroups.upcoming" />
              <ExhibitionTimeGroup group="past" class="compact:hidden" :exhibitions="timeGroups.past" />
            </div>
          </div>
        </div>
      </section>
  </div>
</template>

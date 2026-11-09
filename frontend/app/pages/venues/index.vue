<script setup lang="ts">
const { venues, venueExhibitions } = useArchiveData()
const { t } = useI18n()

const stateName = useStateName()
const countryName = useCountryName()
const inCountry = useInCountry()

// All galleries, in Austria and abroad (text-rules §5a). Each country has its own count
// (owner, 2026-11-09): Austria first with its federal states, then each country with its regions.
const countryGroups = computed(() => venueCountryGroups(venues.value))
const states = computed(() => countryGroups.value.flatMap((group) => group.states.map(({ state }) => state)))
const federalStates = computed(() => countryGroups.value.find((group) => group.home)?.states.length ?? 0)
const gallerySearchQuery = useQueryParam('q')
// An unknown ?state= (an old or mistyped link) shows all galleries.
const selectedState = useQueryParam('state', { validate: (state) => (states.value.includes(state) ? state : '') })
const recordsByGallery = computed(() => new Map(venues.value.map((venue) => [
  venue.slug,
  venueExhibitions.value.filter((exhibition) => exhibition.venue_slug === venue.slug).length
])))
const orderedVenues = computed(() => [...venues.value].sort((left, right) => {
  if (Boolean(left.featured) !== Boolean(right.featured)) return left.featured ? -1 : 1
  return left.name.localeCompare(right.name)
}))
const filteredVenues = computed(() => orderedVenues.value.filter((venue) => {
  if (selectedState.value && venue.state !== selectedState.value) return false
  return matchesSearch(gallerySearchQuery.value, [
      venue.name,
      venue.city_name,
      venue.postal_code,
      stateName(venue.state),
      venue.country,
      countryName(venue.country),
      venue.address,
      venue.description
  ])
}))
const galleryLedgerItems = computed(() => [
  ...countryGroups.value.map((group) => ({ label: t('galleries.ledgerGalleriesIn', { place: inCountry(group.country) }), value: group.count })),
  { label: t('galleries.ledgerStates'), value: federalStates.value },
  { label: t('galleries.ledgerRecords'), value: venueExhibitions.value.length }
])
// Mobile: the ledger's facts as one line in the eyebrow's place.
const galleryFacts = computed(() => [
  ...countryGroups.value.map((group) => t('galleries.factGalleriesIn', { count: group.count, place: inCountry(group.country) }, group.count)),
  t('galleries.factStates', federalStates.value),
  t('galleries.factExhibitions', venueExhibitions.value.length)
])

const clearFilters = () => {
  gallerySearchQuery.value = ''
  selectedState.value = ''
}

usePageSeo('/venues/')
definePageMeta({ navActive: 'galleries' })
</script>

<template>
  <div class="[ galleries-page ]">

      <ArchiveDirectoryHero
        class="[ galleries-page-intro ]"
        title-id="galleries-page-title"
        :breadcrumb="$t('galleries.breadcrumb')"
        :eyebrow="$t('galleries.eyebrow')"
        :facts="galleryFacts"
        :title="$t('galleries.title')"
        :accent="$t('galleries.accent')"
        :intro="$t('galleries.intro')"
        :ledger="galleryLedgerItems"
      />

      <section id="gallery-directory" class="[ gallery-directory ] [ section-band ] relative pb-[clamp(3rem,5vw,5rem)] compact:pb-6" :aria-label="$t('galleries.directory')">
        <div class="[ gallery-directory-controls ] mx-auto max-w-band px-gutter compact:px-4">
          <ArchiveSearchForm
            id="gallery-directory-search"
            v-model="gallerySearchQuery"
            class="[ gallery-directory-search ]"
            :label="$t('galleries.searchLabel')"
            :placeholder="$t('galleries.searchPlaceholder')"
          />

          <ArchiveAlphabetRail class="[ gallery-state-filter ] mt-7 gap-8 pb-4 compact:mt-4 compact:gap-6 compact:pb-3" :label="$t('galleries.stateFilterAria')">
            <button class="shrink-0 self-end border-0 bg-transparent p-0 text-button text-archive-muted transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red aria-pressed:font-medium aria-pressed:text-archive-red compact:text-sm" type="button" :aria-pressed="!selectedState" @click="selectedState = ''">{{ $t('common.all') }} <small class="ml-1 text-xs">{{ venues.length }}</small></button>
            <!-- One column per country: its name as a small, light eyebrow (a label, not a filter), its states or regions below as filter links (owner, 2026-11-09). -->
            <template v-for="(group, index) in countryGroups" :key="group.country">
              <!-- Between two countries: a thin line over the full height of both lines, 65 % transparent. -->
              <span v-if="index > 0" class="[ gallery-state-divider ] w-px shrink-0 self-stretch bg-archive-rule-warm/35" aria-hidden="true" />
              <div class="[ gallery-state-group ] flex shrink-0 flex-col gap-1.5" role="group" :aria-label="countryName(group.country)">
                <span class="text-2xs leading-none tracking-widest text-archive-muted/65 uppercase" aria-hidden="true">{{ countryName(group.country) }}</span>
                <div class="flex gap-5 compact:gap-4">
                  <button v-for="{ state, count } in group.states" :key="state" class="shrink-0 border-0 bg-transparent p-0 text-button text-archive-muted transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red aria-pressed:font-medium aria-pressed:text-archive-red compact:text-sm" type="button" :aria-pressed="selectedState === state" @click="selectedState = selectedState === state ? '' : state">{{ stateName(state) }} <small class="ml-1 text-xs">{{ count }}</small></button>
                </div>
              </div>
            </template>
          </ArchiveAlphabetRail>
        </div>

        <ArchiveInsetDivider />

        <div class="[ gallery-directory-results ] mx-auto max-w-band px-gutter compact:px-3">
          <ArchiveDirectoryStatus class="[ gallery-directory-status ] my-7 compact:my-4" :show="Boolean(gallerySearchQuery || selectedState)" :text="$t('galleries.status', { visible: filteredVenues.length, total: venues.length })" :clear-label="$t('galleries.clearFilters')" @clear="clearFilters" />

          <ArchiveEmptyState v-if="!filteredVenues.length" class="[ gallery-directory-empty ]" :message="$t('galleries.noMatches')" :action-label="$t('galleries.returnAll')" @action="clearFilters" />

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
</template>

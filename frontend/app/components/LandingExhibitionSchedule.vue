<script setup lang="ts">
import { MAX_SCHEDULE_SLIDES_PER_GROUP } from '~/utils/exhibitionSchedule'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import type { ResolvedNews } from '~/utils/resolveNews'

// The first section below the hero (owner, 2026-11-11): the site is about 360° tours that come
// online on a certain day, by rule the last day of an exhibition. So it leads with the newest
// tours online (`tours`, newest first, see newestOnlineTours), up to four, in the left two
// thirds; the latest news keep the right third (sticky, beside everything below). Current and
// announced exhibitions, the secondary feature, follow in the left two thirds as two small rows
// of up to five that scroll sideways when they do not fit. Mobile: every group is a slider; the
// news sit further down the page.
const NEW_TOUR_COUNT = 4

const props = withDefaults(defineProps<{
  tours: ResolvedExhibition[]
  current: ResolvedExhibition[]
  upcoming: ResolvedExhibition[]
  news?: ResolvedNews[]
}>(), {
  news: () => []
})
const localePath = useLocalePath()
const { t } = useI18n()

const newTours = computed(() => props.tours.slice(0, NEW_TOUR_COUNT))
const rows = computed(() => [
  { id: 'current', label: t('landing.schedule.current'), items: props.current.slice(0, MAX_SCHEDULE_SLIDES_PER_GROUP), current: true },
  { id: 'upcoming', label: t('landing.schedule.upcoming'), items: props.upcoming.slice(0, MAX_SCHEDULE_SLIDES_PER_GROUP), current: false }
].filter((row) => row.items.length))
const hasNews = computed(() => props.news.length > 0)
const visible = computed(() => newTours.value.length > 0 || rows.value.length > 0)
</script>

<template>
  <section
    v-if="visible"
    id="new-tours"
    class="[ new-tours-section ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5"
    aria-labelledby="new-tours-title"
  >
    <div
      class="[ new-tours-layout ] grid gap-y-8 tablet:gap-8 compact:grid-cols-1 compact:gap-5"
      :class="hasNews ? 'grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-x-[clamp(2rem,4vw,4rem)] tablet:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : 'grid-cols-1'"
    >
      <!-- Heading row: only the left two thirds; the link closes that area, the news column below
           keeps its place (owner, 2026-11-11). -->
      <header class="[ new-tours-heading ] col-start-1 flex flex-wrap items-end justify-between gap-x-10 gap-y-3 self-start">
        <div>
          <ArchiveEyebrow ornament="section">{{ $t('landing.schedule.eyebrow') }}</ArchiveEyebrow>
          <ArchiveSectionHeading id="new-tours-title" class="max-w-144">
            {{ $t('landing.schedule.titleBefore') }} <span class="text-archive-red">{{ $t('landing.schedule.titleAccent') }}</span>
          </ArchiveSectionHeading>
        </div>
        <ArchiveTextLink class="compact:hidden" :to="localePath('/exhibitions/')">
          {{ $t('landing.schedule.viewAll') }}
          <ArchiveArrow />
        </ArchiveTextLink>
      </header>

      <div v-if="newTours.length" class="[ new-tours-main ] col-start-1 min-w-0" data-new-tours>
        <div class="[ schedule-tour-grid ] grid grid-cols-2 gap-x-6 gap-y-3 tablet:grid-cols-1 compact:hidden">
          <ExhibitionCard
            v-for="exhibition in newTours"
            :key="exhibition.id"
            :exhibition="exhibition"
            layout="side"
          />
        </div>
        <div class="hidden compact:block">
          <ExhibitionSlideTrack :exhibitions="newTours" size="feature" />
        </div>
        <div class="mt-4 hidden compact:block">
          <ArchiveTextLink :to="localePath('/exhibitions/')">
            {{ $t('landing.schedule.viewAll') }}
            <ArchiveArrow />
          </ArchiveTextLink>
        </div>
      </div>

      <LandingNewsList v-if="hasNews" class="col-start-2 row-span-2 row-start-2 compact:hidden" :news="props.news" />

      <div v-if="rows.length" class="[ schedule-rows ] col-start-1 grid min-w-0 gap-6 compact:gap-5">
        <section
          v-for="row in rows"
          :key="row.id"
          class="[ schedule-row ] min-w-0"
          :aria-labelledby="`schedule-row-${row.id}-title`"
          :data-schedule-row="row.id"
        >
          <h3
            :id="`schedule-row-${row.id}-title`"
            class="m-0 mb-3 pl-1 text-eyebrow font-medium tracking-widest uppercase compact:text-xs"
            :class="row.current ? 'text-archive-red' : 'text-archive-copy'"
          >
            {{ row.label }}
          </h3>
          <ExhibitionSlideTrack :exhibitions="row.items" contained />
        </section>
      </div>
    </div>
    <ArchiveExhibitionsDivider />
  </section>
</template>

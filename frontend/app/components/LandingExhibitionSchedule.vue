<script setup lang="ts">
import { MAX_SCHEDULE_EXHIBITIONS_PER_GROUP } from '~/utils/exhibitionSchedule'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'

// Desktop: current and upcoming exhibitions in two columns of up to three
// cards. Mobile: one slider per group, current exhibitions in the larger cards.
const props = defineProps<{
  current: ResolvedExhibition[]
  upcoming: ResolvedExhibition[]
}>()
const localePath = useLocalePath()
const { t } = useI18n()

const groups = computed(() => [
  {
    id: 'current',
    label: t('landing.schedule.current'),
    items: props.current,
    current: true
  },
  {
    id: 'upcoming',
    label: t('landing.schedule.upcoming'),
    items: props.upcoming,
    current: false
  }
].filter((group) => group.items.length))
const columnGroups = computed(() => groups.value
  .map((group) => ({ ...group, items: group.items.slice(0, MAX_SCHEDULE_EXHIBITIONS_PER_GROUP) })))
</script>

<template>
  <section
    v-if="groups.length"
    id="current-upcoming"
    class="[ current-upcoming-section ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5"
    aria-labelledby="current-upcoming-title"
  >
    <div class="[ current-upcoming-layout ] grid grid-cols-[minmax(18rem,0.55fr)_minmax(0,1.45fr)] gap-[clamp(2.5rem,5vw,5rem)] tablet:grid-cols-1 tablet:gap-8 compact:gap-5">
      <header class="[ current-upcoming-heading ] self-start">
        <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">
          {{ $t('landing.schedule.eyebrow') }}
        </p>
        <h2 id="current-upcoming-title" class="m-0 max-w-144 pb-1 font-display text-h2 font-normal leading-[1.08] compact:pb-0.5 compact:text-3xl compact:leading-[1.12]">
          {{ $t('landing.schedule.titleBefore') }} <span class="text-archive-red">{{ $t('landing.schedule.titleAccent') }}</span> {{ $t('landing.schedule.titleAfter') }}
        </h2>
        <ArchiveTextLink class="mt-5 compact:hidden" :to="localePath('/exhibitions/')">
          {{ $t('landing.schedule.viewAll') }}
          <ArchiveArrow />
        </ArchiveTextLink>
      </header>

      <div
        class="[ schedule-groups ] grid gap-6 compact:hidden"
        :class="columnGroups.length > 1 ? 'grid-cols-2' : 'grid-cols-1'"
      >
        <section v-for="group in columnGroups" :key="group.id" class="[ schedule-group ] min-w-0" :aria-labelledby="`schedule-${group.id}-title`">
          <div class="mb-4 flex items-baseline gap-4">
            <h3
              :id="`schedule-${group.id}-title`"
              class="m-0 pl-1 text-left text-eyebrow font-medium tracking-widest uppercase"
              :class="group.current ? 'text-archive-red' : 'text-archive-copy'"
            >
              {{ group.label }}
            </h3>
          </div>
          <div class="grid gap-3">
            <ExhibitionCard
              v-for="exhibition in group.items"
              :key="exhibition.id"
              :exhibition="exhibition"
              layout="side"
            />
          </div>
        </section>
      </div>

      <div class="[ schedule-sliders ] hidden gap-6 compact:grid">
        <section v-for="group in groups" :key="group.id" class="[ schedule-slider ] min-w-0" :aria-labelledby="`schedule-slider-${group.id}-title`">
          <h3
            :id="`schedule-slider-${group.id}-title`"
            class="m-0 mb-3 text-xs font-medium tracking-widest uppercase"
            :class="group.current ? 'text-archive-red' : 'text-archive-copy'"
          >
            {{ group.label }}
          </h3>
          <ExhibitionSlideTrack :exhibitions="group.items" :size="group.current ? 'feature' : 'regular'" />
        </section>
        <ArchiveTextLink class="justify-self-start" :to="localePath('/exhibitions/')">
          {{ $t('landing.schedule.viewAll') }}
          <ArchiveArrow />
        </ArchiveTextLink>
      </div>
    </div>
    <ArchiveExhibitionsDivider />
  </section>
</template>

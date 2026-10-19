<script setup lang="ts">
import type { ExhibitionTimeGroupId } from '~/utils/exhibitionSchedule'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'

// One time group on the exhibition overview: the first `limit` records and, when there
// are more, a link to the group's own page. Current exhibitions get the big stacked
// cards; upcoming and past share a column each, so they get the smaller side cards.
const props = withDefaults(defineProps<{
  group: ExhibitionTimeGroupId
  exhibitions: ResolvedExhibition[]
  limit?: number
}>(), {
  limit: 10
})

const localePath = useLocalePath()
const shown = computed(() => props.exhibitions.slice(0, props.limit))
const big = computed(() => props.group === 'current')
</script>

<template>
  <section class="[ exhibition-time-group ] min-w-0" :aria-labelledby="`exhibitions-${props.group}-title`">
    <h3
      :id="`exhibitions-${props.group}-title`"
      class="m-0 mb-4 pl-1 text-left font-display text-eyebrow font-medium tracking-widest uppercase compact:mb-3 compact:text-xs"
      :class="big ? 'text-archive-red' : 'text-archive-copy'"
    >
      {{ $t(`exhibitionsDirectory.groups.${props.group}.title`) }}
    </h3>

    <p v-if="!shown.length" class="m-0 border-y border-archive-rule-deep/24 py-8 text-center text-archive-muted compact:py-5 compact:text-sm">
      {{ $t(`exhibitionsDirectory.groups.${props.group}.empty`) }}
    </p>
    <div v-else class="grid" :class="big ? 'grid-cols-3 gap-6 tablet:grid-cols-2 compact:gap-2.5' : 'gap-3 tablet:grid-cols-2 compact:gap-2.5'">
      <ExhibitionCard
        v-for="exhibition in shown"
        :key="exhibition.id"
        :class="big ? '' : 'min-h-40'"
        :exhibition="exhibition"
        :layout="big ? 'stacked' : 'side'"
      />
    </div>

    <ArchiveTextLink v-if="props.exhibitions.length > props.limit" class="mt-5" :to="localePath(`/exhibitions/${props.group}/`)">
      {{ $t(`exhibitionsDirectory.groups.${props.group}.all`, { count: props.exhibitions.length }) }}
      <ArchiveArrow />
    </ArchiveTextLink>
  </section>
</template>

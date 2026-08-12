<script setup lang="ts">
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'

defineProps<{
  exhibition: ResolvedExhibition
}>()
const localePath = useLocalePath()
</script>

<template>
  <ExhibitionFrameCard
    class="[ related-exhibition-card ] min-h-100 compact:min-h-68"
    surface-class="grid grid-rows-[13rem_1fr] bg-archive-record-paper/45 compact:grid-rows-[8rem_1fr]"
    :href="localePath(`/exhibitions/${exhibition.slug}/`)"
    :aria-label="$t('cards.openExhibitionFor', { title: exhibition.title })"
  >
    <img class="size-full object-cover" :src="exhibition.image" :alt="exhibition.image_alt" loading="lazy" />
    <div class="flex flex-col p-5 compact:p-3">
      <time class="text-xs leading-normal tracking-[0.07em] text-archive-muted uppercase" :datetime="exhibition.start_date">
        {{ exhibition.date_range }}
      </time>
      <h3 class="mt-[0.3rem] mb-0 text-2xl font-normal leading-[1.05] compact:text-lg">{{ exhibition.title }}</h3>
      <p class="mt-1 mb-4 text-archive-red compact:mb-2 compact:text-sm">{{ exhibition.artist }}</p>
      <span class="mt-auto flex items-center gap-2 text-archive-red compact:text-sm">{{ $t('cards.openExhibition') }} <ArchiveArrow /></span>
    </div>
  </ExhibitionFrameCard>
</template>

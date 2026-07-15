<script setup lang="ts">
import type { LocationExhibition } from '~/types/content'

defineProps<{
  exhibition: LocationExhibition
}>()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    class="[ related-exhibition-card ] grid grid-rows-[13rem_1fr] border-t border-archive-red/48 bg-archive-record-paper/45 filter-[drop-shadow(0_0.5rem_0.6rem_rgba(75,52,29,0.08))] focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red compact:grid-rows-[8rem_1fr]"
    :to="localePath(`/exhibitions/${exhibition.slug}`)"
  >
    <img class="size-full object-cover" :src="exhibition.image" :alt="exhibition.image_alt" loading="lazy" />
    <div class="flex flex-col p-5 compact:p-3">
      <time class="text-xs leading-normal tracking-[0.07em] text-archive-muted uppercase" :datetime="exhibition.start_date">
        {{ exhibition.date_range }}
      </time>
      <h3 class="mt-[0.3rem] mb-0 text-[1.55rem] font-normal leading-[1.05] compact:text-lg">{{ exhibition.title }}</h3>
      <p class="mt-1 mb-4 text-archive-red compact:mb-2 compact:text-sm">{{ exhibition.artist }}</p>
      <span class="mt-auto flex items-center gap-2 text-archive-red compact:text-sm">{{ $t('cards.openRecordLabel') }} <ArchiveArrow /></span>
    </div>
  </NuxtLink>
</template>

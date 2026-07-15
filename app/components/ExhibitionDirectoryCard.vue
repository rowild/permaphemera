<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { LocationExhibition } from '~/types/content'
import { createOrnamentTransform } from '~/utils/seededLayout'

const props = withDefaults(defineProps<{
  exhibition: LocationExhibition
  index: number
  featured?: boolean
}>(), {
  featured: false
})

const active = ref(false)
const localePath = useLocalePath()
const ornament = computed(() => createOrnamentTransform(`exhibitions-directory:${props.exhibition.id}`, props.featured))
const ornamentStyle = computed<CSSProperties>(() => ({
  right: ornament.value.right,
  bottom: ornament.value.bottom,
  transform: active.value ? ornament.value.active : ornament.value.rest
}))
const sequence = computed(() => String(props.index + 1).padStart(2, '0'))
</script>

<template>
  <ExhibitionFrameCard
    class="[ exhibition-directory-card ]"
    :class="props.featured ? '[ exhibition-directory-card-featured ] col-span-2 min-h-160 tablet:min-h-132 compact:min-h-92' : 'min-h-132 compact:min-h-76'"
    :surface-class="props.featured
      ? 'bg-archive-night'
      : 'grid grid-rows-[16rem_1fr] bg-archive-record-paper compact:grid-rows-[8.5rem_1fr]'"
    :href="localePath(`/exhibitions/${props.exhibition.slug}/`)"
    :aria-label="$t('cards.openRecord', { title: props.exhibition.title })"
    @mouseenter="active = true"
    @mouseleave="active = false"
    @focusin="active = true"
    @focusout="active = false"
  >
    <template v-if="props.featured">
      <img class="absolute inset-0 size-full object-cover brightness-68 saturate-80 transition-transform duration-700 ease-archive-lift group-hover/exhibition:scale-[1.025] motion-reduce:transition-none" :src="props.exhibition.image" :alt="props.exhibition.image_alt" />
      <div class="archive-record-overlay absolute inset-x-0 bottom-0 z-1 min-h-80 px-[clamp(2rem,5vw,5rem)] pt-24 pb-[clamp(2rem,4vw,4rem)] text-archive-light-ink compact:min-h-0 compact:px-4 compact:pt-16 compact:pb-5">
        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-8 compact:grid-cols-1 compact:gap-3">
          <div>
            <p class="mt-0 mb-2 text-xs tracking-widest text-archive-ochre uppercase"><span aria-hidden="true">{{ sequence }} · </span><time :datetime="props.exhibition.start_date">{{ props.exhibition.date_range }}</time></p>
            <h3 class="m-0 max-w-208 text-[clamp(2.8rem,5.2vw,5.4rem)] font-light leading-[0.9] compact:text-4xl">{{ props.exhibition.title }}</h3>
            <p class="mt-2 mb-0 text-[1.35rem] text-archive-ochre compact:text-base">{{ props.exhibition.artist }}</p>
          </div>
          <span class="flex items-center gap-3 text-[1.08rem] compact:text-sm">{{ $t('cards.openRecordLabel') }} <ArchiveArrow /></span>
        </div>
      </div>
    </template>

    <template v-else>
      <img class="size-full object-cover transition-transform duration-700 ease-archive-lift group-hover/exhibition:scale-[1.025] motion-reduce:transition-none" :src="props.exhibition.image" :alt="props.exhibition.image_alt" loading="lazy" />
      <div class="relative z-2 flex min-w-0 flex-col px-6 pt-5 pb-6 compact:px-3 compact:pt-3 compact:pb-4">
        <p class="m-0 text-xs tracking-widest text-archive-red uppercase compact:text-[0.62rem]"><span aria-hidden="true">{{ sequence }} · </span><time :datetime="props.exhibition.start_date">{{ props.exhibition.date_range }}</time></p>
        <h3 class="mt-2 mb-0 text-[clamp(1.75rem,2.6vw,2.7rem)] font-normal leading-[0.98] compact:text-lg">{{ props.exhibition.title }}</h3>
        <p class="mt-1 mb-0 text-[1.08rem] text-archive-red compact:text-sm">{{ props.exhibition.artist }}</p>
        <p class="mt-4 mb-4 line-clamp-3 text-[0.98rem] leading-normal text-archive-body compact:hidden">{{ props.exhibition.summary }}</p>
        <div class="mt-auto flex items-end justify-between gap-4 border-t border-archive-rule-warm/22 pt-4 compact:pt-2">
          <p class="m-0 text-sm text-archive-muted compact:text-xs">{{ props.exhibition.venue }} · {{ props.exhibition.city }}</p>
          <span class="flex shrink-0 items-center gap-2 text-archive-red compact:gap-1 compact:text-xs"><span class="compact:hidden">{{ $t('common.open') }}</span><ArchiveArrow class="w-6 compact:w-5" /></span>
        </div>
      </div>
    </template>

    <span
      class="[ exhibition-directory-card-ornament ] archive-crosshair-ornament pointer-events-none absolute z-3 size-20 opacity-55 transition-[transform,opacity] duration-460 ease-archive-lift compact:size-12 motion-reduce:transition-none"
      :class="props.featured ? 'brightness-200 sepia' : ''"
      :style="ornamentStyle"
      aria-hidden="true"
    />
  </ExhibitionFrameCard>
</template>

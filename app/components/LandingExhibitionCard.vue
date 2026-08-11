<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { Exhibition } from '~/types/content'
import { createOrnamentTransform } from '~/utils/seededLayout'

const props = withDefaults(defineProps<{
  exhibition: Exhibition
  variant?: 'featured' | 'compact'
  href: string
}>(), {
  variant: 'compact'
})

const active = ref(false)
const ornament = computed(() => createOrnamentTransform(`exhibition:${props.exhibition.id}`, props.variant === 'featured'))
const ornamentStyle = computed<CSSProperties>(() => ({
  right: ornament.value.right,
  bottom: ornament.value.bottom,
  transform: active.value ? ornament.value.active : ornament.value.rest
}))
</script>

<template>
  <ExhibitionFrameCard
    class="[ landing-exhibition-card ]"
    :class="props.variant === 'featured' ? '[ featured-record ] min-h-160 tablet:min-h-128 compact:min-h-80' : '[ record-card ] tablet:min-h-96 compact:min-h-64'"
    :surface-class="props.variant === 'featured'
      ? 'bg-archive-record-night'
      : 'grid grid-cols-[49%_minmax(0,1fr)] bg-archive-record-paper tablet:grid-cols-1 tablet:grid-rows-[12.5rem_1fr] compact:grid-rows-[7rem_1fr]'"
    :href="props.href"
    :aria-label="$t('cards.openExhibitionFor', { title: props.exhibition.title })"
    @mouseenter="active = true"
    @mouseleave="active = false"
    @focusin="active = true"
    @focusout="active = false"
  >
    <template v-if="props.variant === 'featured'">
      <img
        class="[ featured-record-image ] size-full object-cover brightness-72 saturate-86 transition-transform duration-700 ease-archive-lift group-hover/exhibition:scale-[1.035] compact:min-h-80 motion-reduce:transition-none"
        :src="props.exhibition.image"
        :alt="props.exhibition.title"
      />
      <div class="[ record-overlay ] archive-record-overlay absolute inset-x-0 bottom-0 grid min-h-62 grid-cols-[minmax(0,1fr)_auto] items-end gap-6 px-10 pt-14 pb-8 text-archive-light-ink compact:min-h-0 compact:grid-cols-1 compact:gap-2 compact:px-4 compact:pt-8 compact:pb-5">
        <div>
          <h3 class="[ record-title ] m-0 font-display text-[clamp(1.75rem,2.7vw,2.55rem)] font-medium leading-[1.08] compact:text-lg">{{ props.exhibition.title }}</h3>
          <p class="[ artist-name ] mt-[0.2rem] mb-[0.45rem] font-display text-[1.2rem] text-archive-ochre compact:text-sm">{{ props.exhibition.artist }}</p>
          <span class="[ record-divider ] archive-record-divider mb-[0.4rem] block h-[0.7rem] w-[min(18rem,80%)] brightness-170 opacity-72" aria-hidden="true" />
          <p class="[ record-meta-line ] my-[0.18rem] flex items-center gap-[0.48rem] font-display text-inherit compact:text-xs">
            <span class="[ record-meta-icon ] archive-record-meta-icon record-meta-icon-location inline-block size-4 flex-none bg-current compact:size-3" aria-hidden="true" />
            {{ props.exhibition.venue }}, {{ props.exhibition.city }}
          </p>
          <p class="[ record-meta-line ] my-[0.18rem] flex items-center gap-[0.48rem] font-display text-inherit compact:text-xs">
            <span class="[ record-meta-icon ] archive-record-meta-icon record-meta-icon-calendar inline-block size-4 flex-none bg-current compact:size-3" aria-hidden="true" />
            {{ props.exhibition.date_range }}
          </p>
        </div>
        <ArchiveButton class="w-fit justify-self-center compact:min-h-10 compact:px-2" as="span" variant="primary">
          <span class="compact:hidden">{{ $t('cards.enter360') }}</span>
          <span class="hidden compact:inline">{{ $t('cards.enter') }}</span>
          <ArchiveArrow class="compact:hidden" />
        </ArchiveButton>
      </div>
    </template>

    <template v-else>
      <div class="[ record-card-media ] relative min-h-0 overflow-hidden">
        <img
          class="[ record-card-image ] size-full min-h-0 object-cover transition-transform duration-700 ease-archive-lift group-hover/exhibition:scale-[1.035] motion-reduce:transition-none"
          :src="props.exhibition.image"
          :alt="props.exhibition.title"
        />
        <div class="[ record-card-action ] pointer-events-none absolute inset-0 z-2 flex items-center justify-center p-3 compact:p-1">
          <ArchiveButton class="min-h-12 gap-2 px-2 text-[0.92rem] whitespace-nowrap compact:min-h-10 compact:gap-0 compact:px-0 compact:text-xs" as="span" variant="secondary">
            {{ $t('cards.openExhibition') }} <ArchiveArrow class="w-6 compact:hidden" />
          </ArchiveButton>
        </div>
      </div>
      <div class="[ record-card-copy ] archive-record-card-copy relative z-2 flex min-w-0 flex-col px-[1.35rem] pt-[1.1rem] pb-[0.85rem] compact:px-4 compact:pt-3 compact:pb-5">
        <h3 class="[ record-title ] m-0 max-w-80 font-display text-[1.18rem] font-medium leading-[1.08] compact:text-sm">{{ props.exhibition.title }}</h3>
        <p class="[ artist-name ] my-[0.08rem] mt-[0.18rem] font-display text-archive-red compact:text-sm">{{ props.exhibition.artist }}</p>
        <p class="[ record-meta-line ] my-[0.08rem] flex items-center gap-[0.48rem] font-display text-[0.88rem] text-archive-record-meta compact:text-xs">
          <span class="[ record-meta-icon ] archive-record-meta-icon record-meta-icon-location inline-block size-4 flex-none bg-current" aria-hidden="true" />
          {{ props.exhibition.venue }}, {{ props.exhibition.city }}
        </p>
        <p class="[ record-meta-line ] my-[0.08rem] flex items-center gap-[0.48rem] font-display text-[0.88rem] text-archive-record-meta compact:text-xs">
          <span class="[ record-meta-icon ] archive-record-meta-icon record-meta-icon-calendar inline-block size-4 flex-none bg-current" aria-hidden="true" />
          {{ props.exhibition.date_range }}
        </p>
      </div>
    </template>

    <span
      class="[ record-ornament ] archive-crosshair-ornament pointer-events-none absolute z-3 transition-[transform,opacity] duration-460 ease-archive-lift motion-reduce:transition-none"
      :class="props.variant === 'featured' ? 'size-[5.2rem] brightness-215 sepia-25 saturate-115 opacity-66 compact:size-12' : 'size-[5.4rem] opacity-62 compact:size-12'"
      :style="ornamentStyle"
      aria-hidden="true"
    />
  </ExhibitionFrameCard>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import { createOrnamentTransform } from '~/utils/seededLayout'

// Shared by the landing page's selected and timely exhibition sections.
// Picking just the fields this card reads keeps the prop type honest about
// what each collection actually needs to supply.
const props = withDefaults(defineProps<{
  exhibition: Pick<ResolvedExhibition, 'id' | 'title' | 'artist' | 'venue' | 'city' | 'date_range' | 'image'>
  variant?: 'featured' | 'compact'
  href: string
}>(), {
  variant: 'compact'
})

const active = ref(false)
const recordTitleViewport = ref<HTMLElement | null>(null)
const recordTitleText = ref<HTMLElement | null>(null)
const recordTitleOverflow = ref(false)
const recordTitleShift = ref(0)
let recordTitleResizeObserver: ResizeObserver | null = null

const ornament = computed(() => createOrnamentTransform(`exhibition:${props.exhibition.id}`, props.variant === 'featured'))
const ornamentStyle = computed<CSSProperties>(() => ({
  right: ornament.value.right,
  bottom: ornament.value.bottom,
  transform: active.value ? ornament.value.active : ornament.value.rest
}))
const recordTitleStyle = computed(() => ({
  '--archive-record-title-shift': `${-recordTitleShift.value}px`,
  '--archive-record-title-duration': `${Math.max(2.8, recordTitleShift.value / 42 + 1.7)}s`
} as CSSProperties))

const updateRecordTitleOverflow = () => {
  const viewport = recordTitleViewport.value
  const title = recordTitleText.value

  if (!viewport || !title) {
    recordTitleOverflow.value = false
    recordTitleShift.value = 0
    return
  }

  const overflow = Math.max(0, title.scrollWidth - viewport.clientWidth)
  recordTitleShift.value = Math.ceil(overflow)
  recordTitleOverflow.value = overflow > 2
}

onMounted(async () => {
  await nextTick()
  updateRecordTitleOverflow()

  if (!recordTitleViewport.value || !recordTitleText.value) {
    return
  }

  recordTitleResizeObserver = new ResizeObserver(updateRecordTitleOverflow)
  recordTitleResizeObserver.observe(recordTitleViewport.value)
  recordTitleResizeObserver.observe(recordTitleText.value)
})

watch(
  () => [props.exhibition.title, props.variant],
  async () => {
    await nextTick()
    updateRecordTitleOverflow()
  }
)

onBeforeUnmount(() => {
  recordTitleResizeObserver?.disconnect()
})
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
          <h3 class="[ record-title ] m-0 font-display text-h3 font-medium leading-[1.08] compact:text-lg">{{ props.exhibition.title }}</h3>
          <p class="[ artist-name ] mt-[0.2rem] mb-[0.45rem] font-display text-lg text-archive-ochre compact:text-sm">{{ props.exhibition.artist }}</p>
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
          <span class="compact:hidden">{{ $t('cards.enterExhibition') }}</span>
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
          <ArchiveButton class="archive-record-open-action text-sm whitespace-nowrap opacity-90 compact:text-xs" as="span" variant="secondary">
            <span class="inline-flex scale-85 items-center gap-2 transition-colors duration-200 ease-out group-hover/exhibition:text-archive-red group-focus-visible/exhibition:text-archive-red compact:gap-0 motion-reduce:transition-none">
              {{ $t('cards.openExhibition') }} <ArchiveArrow class="w-6 compact:hidden" />
            </span>
          </ArchiveButton>
        </div>
      </div>
      <div class="[ record-card-copy ] archive-record-card-copy relative z-2 flex min-w-0 flex-col px-[1.35rem] pt-[1.1rem] pb-[0.85rem] compact:px-4 compact:pt-3 compact:pb-5">
        <div class="[ record-title-shell ] group/title relative min-w-0">
          <div ref="recordTitleViewport" class="[ record-title-viewport ] overflow-hidden pb-0.5">
            <h3
              ref="recordTitleText"
              class="[ record-title ] m-0 w-max max-w-none font-display text-lg font-medium leading-[1.08] whitespace-nowrap compact:text-sm"
              :class="recordTitleOverflow && active ? 'archive-record-title-marquee' : ''"
              :style="recordTitleStyle"
            >{{ props.exhibition.title }}</h3>
          </div>
          <ArchiveTooltipFrame
            v-if="recordTitleOverflow"
            as="span"
            pointer-side="top"
            :pointer-offset="-50"
            class="[ record-title-tooltip ] pointer-events-none absolute inset-x-0 top-[calc(100%+0.3rem)] z-10 translate-y-1 scale-95 px-2 py-1 font-display text-sm leading-[1.12] text-archive-ink opacity-0 filter-[drop-shadow(0_0.38rem_0.42rem_rgba(75,52,29,0.18))] transition-[opacity,transform,translate,scale,rotate] duration-200 ease-out group-hover/title:translate-y-0 group-hover/title:scale-100 group-hover/title:opacity-100 group-focus-visible/exhibition:translate-y-0 group-focus-visible/exhibition:scale-100 group-focus-visible/exhibition:opacity-100 compact:text-xs motion-reduce:transition-none"
            aria-hidden="true"
          >
            <span class="mb-0.5 block text-3xs leading-none tracking-[0.09em] text-archive-red uppercase compact:text-4xs">{{ $t('cards.fullTitle') }}</span>
            <span class="block">{{ props.exhibition.title }}</span>
          </ArchiveTooltipFrame>
        </div>
        <p class="[ artist-name ] my-[0.08rem] mt-[0.18rem] font-display leading-[1.1] text-archive-red compact:text-sm">{{ props.exhibition.artist }}</p>
        <p class="[ record-location-line ] [ record-meta-line ] my-[0.08rem] flex items-start gap-[0.48rem] font-display text-sm leading-[1.15] text-archive-record-meta compact:text-xs compact:leading-[1.05]">
          <span class="[ record-meta-icon ] archive-record-meta-icon record-meta-icon-location mt-[0.08rem] inline-block size-4 flex-none bg-current" aria-hidden="true" />
          {{ props.exhibition.venue }}, {{ props.exhibition.city }}
        </p>
        <p class="[ record-date-line ] [ record-meta-line ] my-[0.08rem] flex items-center gap-[0.48rem] font-display text-sm leading-[1.15] text-archive-record-meta compact:text-xs compact:leading-[1.05]">
          <span class="[ record-meta-icon ] archive-record-meta-icon record-meta-icon-calendar inline-block size-4 flex-none bg-current" aria-hidden="true" />
          {{ props.exhibition.date_range }}
        </p>
      </div>
    </template>

    <span
      class="[ record-ornament ] archive-crosshair-ornament pointer-events-none absolute z-3 transition-[transform,translate,scale,rotate,opacity] duration-460 ease-archive-lift motion-reduce:transition-none"
      :class="props.variant === 'featured' ? 'size-[5.2rem] brightness-215 sepia-25 saturate-115 opacity-66 compact:size-12' : 'size-[5.4rem] opacity-62 compact:size-12'"
      :style="ornamentStyle"
      aria-hidden="true"
    />
  </ExhibitionFrameCard>
</template>

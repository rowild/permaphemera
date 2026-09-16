<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import { createOrnamentTransform } from '~/utils/seededLayout'

const props = withDefaults(defineProps<{
  exhibition: ResolvedExhibition
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
  // On the regular card the ornament rides on the divider above the footer
  // instead of sitting in the corner next to the link. 2.4rem puts its
  // lower ring on the line and keeps it clear of the "Visit" link below.
  bottom: props.featured ? ornament.value.bottom : `calc(${ornament.value.bottom} + 2.4rem)`,
  transform: active.value ? ornament.value.active : ornament.value.rest
}))
const sequence = computed(() => String(props.index + 1).padStart(2, '0'))

// The card has a fixed height, so the text can never push the footer. The
// title is one line with an ellipsis; the summary gets exactly as many lines as
// still fit above the footer (measured). Every cut ends in an ellipsis. When a clamp actually cuts text, a
// tooltip (the carousel's frame) shows the full text on hover.
const titleEl = ref<HTMLElement | null>(null)
const summaryBox = ref<HTMLElement | null>(null)
const summaryEl = ref<HTMLElement | null>(null)
const titleOverflow = ref(false)
const summaryOverflow = ref(false)
const summaryLines = ref(2)
let clampObserver: ResizeObserver | null = null

const isClipped = (el: HTMLElement | null) => Boolean(el) && (el!.scrollHeight > el!.clientHeight + 2 || el!.scrollWidth > el!.clientWidth + 2)
const updateClamps = () => {
  titleOverflow.value = isClipped(titleEl.value)
  const box = summaryBox.value
  const text = summaryEl.value
  if (box && text) {
    const lineHeight = Number.parseFloat(getComputedStyle(text).lineHeight) || 24
    summaryLines.value = Math.max(0, Math.floor(box.clientHeight / lineHeight))
  }
  requestAnimationFrame(() => { summaryOverflow.value = summaryLines.value > 0 && isClipped(summaryEl.value) })
}

onMounted(() => {
  updateClamps()
  clampObserver = new ResizeObserver(updateClamps)
  if (titleEl.value) clampObserver.observe(titleEl.value)
  if (summaryBox.value) clampObserver.observe(summaryBox.value)
})

onBeforeUnmount(() => {
  clampObserver?.disconnect()
})

const tooltipClass = 'pointer-events-none absolute inset-x-0 top-[calc(100%+0.3rem)] z-10 translate-y-1 scale-95 px-2 py-1 font-display text-sm leading-[1.2] text-archive-ink opacity-0 filter-[drop-shadow(0_0.38rem_0.42rem_rgba(75,52,29,0.18))] transition-[opacity,transform,translate,scale,rotate] duration-200 ease-out compact:text-xs motion-reduce:transition-none'
</script>

<template>
  <ExhibitionFrameCard
    class="[ exhibition-directory-card ]"
    :class="props.featured ? '[ exhibition-directory-card-featured ] col-span-2 min-h-160 tablet:min-h-132 compact:min-h-92' : 'min-h-132 compact:min-h-76'"
    :surface-class="props.featured
      ? 'bg-archive-night'
      : 'grid grid-rows-[16rem_1fr] bg-archive-record-paper compact:grid-rows-[8.5rem_1fr]'"
    :href="localePath(`/exhibitions/${props.exhibition.slug}/`)"
    :aria-label="$t('cards.openExhibitionFor', { title: props.exhibition.title })"
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
            <h3 class="m-0 max-w-208 text-h1-sm font-light leading-[0.9] compact:text-4xl">{{ props.exhibition.title }}</h3>
            <p class="mt-2 mb-0 text-title text-archive-ochre compact:text-base">{{ props.exhibition.artist }}</p>
          </div>
          <span class="flex items-center gap-3 text-button compact:text-sm">{{ $t('cards.openExhibition') }} <ArchiveArrow /></span>
        </div>
      </div>
    </template>

    <template v-else>
      <img class="size-full object-cover transition-transform duration-700 ease-archive-lift group-hover/exhibition:scale-[1.025] motion-reduce:transition-none" :src="props.exhibition.image" :alt="props.exhibition.image_alt" loading="lazy" />
      <div class="relative z-2 flex min-h-0 min-w-0 flex-col px-6 pt-5 pb-6 compact:px-3 compact:pt-3 compact:pb-4">
        <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <p class="m-0 text-xs tracking-widest text-archive-red uppercase compact:text-3xs"><span aria-hidden="true">{{ sequence }} · </span><time :datetime="props.exhibition.start_date">{{ props.exhibition.date_range }}</time></p>
          <div class="group/title relative min-w-0">
            <h3 ref="titleEl" class="mt-2 mb-0 truncate text-h3 font-normal leading-[1.3] compact:text-lg">{{ props.exhibition.title }}</h3>
            <ArchiveTooltipFrame v-if="titleOverflow" as="span" pointer-side="top" :pointer-offset="-50" :class="tooltipClass" class="group-hover/title:translate-y-0 group-hover/title:scale-100 group-hover/title:opacity-100" aria-hidden="true">
              <span class="mb-0.5 block text-3xs leading-none tracking-[0.09em] text-archive-red uppercase compact:text-4xs">{{ $t('cards.fullTitle') }}</span>
              <span class="block">{{ props.exhibition.title }}</span>
            </ArchiveTooltipFrame>
          </div>
          <p class="mt-1 mb-0 truncate text-button text-archive-red compact:text-sm">{{ props.exhibition.artist }}</p>
          <div ref="summaryBox" class="group/summary relative mt-4 mb-3 min-h-0 min-w-0 flex-1 overflow-hidden compact:hidden">
            <p v-show="summaryLines > 0" ref="summaryEl" class="m-0 line-clamp-2 text-eyebrow leading-normal text-archive-body" :style="{ WebkitLineClamp: summaryLines }">{{ props.exhibition.summary }}</p>
            <ArchiveTooltipFrame v-if="summaryOverflow" as="span" pointer-side="top" :pointer-offset="-50" :class="tooltipClass" class="group-hover/summary:translate-y-0 group-hover/summary:scale-100 group-hover/summary:opacity-100" aria-hidden="true">
              <span class="mb-0.5 block text-3xs leading-none tracking-[0.09em] text-archive-red uppercase compact:text-4xs">{{ $t('cards.fullSummary') }}</span>
              <span class="block text-eyebrow leading-normal">{{ props.exhibition.summary }}</span>
            </ArchiveTooltipFrame>
          </div>
        </div>
        <div class="mt-auto flex shrink-0 items-end justify-between gap-4 border-t border-archive-rule-warm/22 pt-4 compact:pt-2">
          <p class="m-0 text-sm text-archive-muted compact:text-xs">{{ props.exhibition.venue }} · {{ props.exhibition.city }}</p>
          <span class="flex shrink-0 items-center gap-2 text-archive-red compact:gap-1 compact:text-xs"><span class="compact:hidden">{{ $t('cards.openExhibition') }}</span><ArchiveArrow class="w-6 compact:w-5" /></span>
        </div>
      </div>
    </template>

    <span
      class="[ exhibition-directory-card-ornament ] archive-crosshair-ornament pointer-events-none absolute z-3 size-20 opacity-55 transition-[transform,translate,scale,rotate,opacity] duration-460 ease-archive-lift compact:size-12 motion-reduce:transition-none"
      :class="props.featured ? 'brightness-200 sepia' : ''"
      :style="ornamentStyle"
      aria-hidden="true"
    />
  </ExhibitionFrameCard>
</template>

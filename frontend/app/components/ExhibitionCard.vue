<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import { createCornerOrnament, createOrnamentTransform } from '~/utils/seededLayout'

// The one exhibition card. Every list of exhibition records renders this
// component; the page only decides the layout and the grid cell.
//
// - `stacked`: image above a fixed-height record sheet. The sheet never grows:
//   the title and the artist line are one line each with an ellipsis, the
//   summary gets exactly as many lines as still fit above the footer, and every
//   cut text shows in full in a framed tooltip on hover. Used by the exhibition
//   directory and the related records on an exhibition page.
// - `side`: image beside the copy (mockup "selected exhibitions", regular
//   records). The title stays on one clipped line and scrolls on hover when it
//   overflows. Used by the landing collection and the programme ledger.
// - `hero`: full-bleed image under a dark overlay with the primary action. Used
//   for the highlighted record on the landing page and in the directory.
export type ExhibitionCardLayout = 'stacked' | 'side' | 'hero'

const props = withDefaults(defineProps<{
  exhibition: Pick<ResolvedExhibition, 'id' | 'title' | 'artist' | 'venue' | 'city' | 'date_range' | 'image'>
    & Partial<Pick<ResolvedExhibition, 'slug' | 'start_date' | 'image_alt' | 'summary' | 'kind'>>
  layout?: ExhibitionCardLayout
  /** `stacked` only: hide the summary block. */
  summary?: boolean
  /** Overrides the route derived from the record's slug. */
  href?: string
}>(), {
  layout: 'stacked',
  summary: true,
  href: undefined
})

const localePath = useLocalePath()
const active = ref(false)
const href = computed(() => props.href ?? (props.exhibition.slug ? localePath(`/exhibitions/${props.exhibition.slug}/`) : undefined))
const imageAlt = computed(() => props.exhibition.image_alt ?? props.exhibition.title)
// Events say "Visit Event", exhibitions "Visit Exhibition".
const labels = computed(() => props.exhibition.kind === 'event'
  ? { open: 'cards.openEvent', enter: 'cards.enterEvent', enterShort: 'cards.enter', openFor: 'cards.openEventFor' }
  : { open: 'cards.openExhibition', enter: 'cards.enterExhibition', enterShort: 'cards.enter', openFor: 'cards.openExhibitionFor' })

// Seeded ornament: the stacked sheet carries it in the copy's top-right corner,
// the other layouts at the card's bottom-right.
const ornament = computed(() => createOrnamentTransform(`exhibition:${props.exhibition.id}`, props.layout === 'hero'))
const ornamentStyle = computed<CSSProperties>(() => ({
  right: ornament.value.right,
  bottom: ornament.value.bottom,
  transform: active.value ? ornament.value.active : ornament.value.rest
}))
const corner = computed(() => createCornerOrnament(`exhibition:${props.exhibition.id}`))
const cornerStyle = computed<CSSProperties>(() => ({
  top: corner.value.top,
  right: corner.value.right,
  width: corner.value.size,
  height: corner.value.size,
  opacity: corner.value.opacity,
  transform: active.value ? corner.value.active : corner.value.rest
}))

// Overflow measurement. Each ref exists only in the layout that renders it;
// one observer re-measures whatever is present when the card changes width.
const titleEl = ref<HTMLElement | null>(null)
const artistEl = ref<HTMLElement | null>(null)
const summaryBox = ref<HTMLElement | null>(null)
const summaryEl = ref<HTMLElement | null>(null)
const recordTitleViewport = ref<HTMLElement | null>(null)
const recordTitleText = ref<HTMLElement | null>(null)
const titleOverflow = ref(false)
const artistOverflow = ref(false)
const summaryOverflow = ref(false)
const summaryLines = ref(2)
const recordTitleOverflow = ref(false)
const recordTitleShift = ref(0)
let observer: ResizeObserver | null = null

// Which clipped text shows its tooltip. Hover of the text's own box sets it;
// keyboard focus on the card shows the title. The tooltip itself lives in
// <body> (ArchiveFloatingTooltip), so the card's clip-path cannot cut it.
type Tip = 'title' | 'artist' | 'summary' | null
const tip = ref<Tip>(null)
const show = (which: Tip) => { tip.value = which }
const hide = () => { tip.value = null }

const isClipped = (el: HTMLElement | null) => Boolean(el) && (el!.scrollHeight > el!.clientHeight + 2 || el!.scrollWidth > el!.clientWidth + 2)
const measure = () => {
  titleOverflow.value = isClipped(titleEl.value)
  artistOverflow.value = isClipped(artistEl.value)
  if (summaryBox.value && summaryEl.value) {
    const lineHeight = Number.parseFloat(getComputedStyle(summaryEl.value).lineHeight) || 24
    summaryLines.value = Math.max(0, Math.floor(summaryBox.value.clientHeight / lineHeight))
    requestAnimationFrame(() => { summaryOverflow.value = summaryLines.value > 0 && isClipped(summaryEl.value) })
  }
  if (recordTitleViewport.value && recordTitleText.value) {
    const overflow = Math.max(0, recordTitleText.value.scrollWidth - recordTitleViewport.value.clientWidth)
    recordTitleShift.value = Math.ceil(overflow)
    recordTitleOverflow.value = overflow > 2
  } else {
    recordTitleShift.value = 0
    recordTitleOverflow.value = false
  }
}
const observe = () => {
  observer?.disconnect()
  observer = new ResizeObserver(measure)
  for (const el of [titleEl, artistEl, summaryBox, recordTitleViewport, recordTitleText]) {
    if (el.value) observer.observe(el.value)
  }
}

onMounted(async () => {
  await nextTick()
  measure()
  observe()
})

watch(() => [props.exhibition.title, props.exhibition.artist, props.exhibition.summary, props.layout], async () => {
  await nextTick()
  measure()
  observe()
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

const recordTitleStyle = computed(() => ({
  '--archive-record-title-shift': `${-recordTitleShift.value}px`,
  '--archive-record-title-duration': `${Math.max(2.8, recordTitleShift.value / 42 + 1.7)}s`
} as CSSProperties))

const rootClass = {
  stacked: '[ exhibition-card-stacked ] min-h-132 compact:min-h-76',
  side: '[ exhibition-card-side ] [ record-card ] tablet:min-h-96 compact:min-h-64',
  hero: '[ exhibition-card-hero ] [ featured-record ] min-h-160 tablet:min-h-128 compact:min-h-80'
}
const surfaceClass = {
  stacked: 'grid grid-rows-[16rem_1fr] bg-archive-record-paper compact:grid-rows-[8.5rem_1fr]',
  side: 'grid grid-cols-[49%_minmax(0,1fr)] bg-archive-record-paper tablet:grid-cols-1 tablet:grid-rows-[12.5rem_1fr] compact:grid-rows-[7rem_1fr]',
  hero: 'bg-archive-record-night'
}
</script>

<template>
  <ExhibitionFrameCard
    class="[ exhibition-card ]"
    :class="rootClass[props.layout]"
    :surface-class="surfaceClass[props.layout]"
    :href="href"
    :aria-label="$t(labels.openFor, { title: props.exhibition.title })"
    @mouseenter="active = true"
    @mouseleave="active = false; hide()"
    @focusin="active = true; show('title')"
    @focusout="active = false; hide()"
  >
    <template v-if="props.layout === 'hero'">
      <img
        class="[ featured-record-image ] size-full object-cover brightness-72 saturate-86 transition-transform duration-700 ease-archive-lift group-hover/exhibition:scale-[1.035] compact:min-h-80 motion-reduce:transition-none"
        :src="props.exhibition.image"
        :alt="imageAlt"
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
            <span><time v-if="props.exhibition.start_date" :datetime="props.exhibition.start_date">{{ props.exhibition.date_range }}</time><template v-else>{{ props.exhibition.date_range }}</template></span>
          </p>
        </div>
        <ArchiveButton class="w-fit justify-self-center compact:min-h-10 compact:px-2" as="span" variant="primary">
          <span class="compact:hidden">{{ $t(labels.enter) }}</span>
          <span class="hidden compact:inline">{{ $t(labels.enterShort) }}</span>
          <ArchiveArrow class="compact:hidden" />
        </ArchiveButton>
      </div>
    </template>

    <template v-else-if="props.layout === 'side'">
      <div class="[ record-card-media ] relative min-h-0 overflow-hidden">
        <img
          class="[ record-card-image ] size-full min-h-0 object-cover transition-transform duration-700 ease-archive-lift group-hover/exhibition:scale-[1.035] motion-reduce:transition-none"
          :src="props.exhibition.image"
          :alt="imageAlt"
        />
        <div class="[ record-card-action ] pointer-events-none absolute inset-0 z-2 flex items-center justify-center p-3 compact:p-1">
          <ArchiveButton class="archive-record-open-action text-sm whitespace-nowrap opacity-90 compact:text-xs" as="span" variant="secondary">
            <span class="inline-flex scale-85 items-center gap-2 transition-colors duration-200 ease-out group-hover/exhibition:text-archive-red group-focus-visible/exhibition:text-archive-red compact:gap-0 motion-reduce:transition-none">
              {{ $t(labels.open) }} <ArchiveArrow class="w-6 compact:hidden" />
            </span>
          </ArchiveButton>
        </div>
      </div>
      <div class="[ record-card-copy ] archive-record-card-copy relative z-2 flex min-w-0 flex-col px-[1.35rem] pt-[1.1rem] pb-[0.85rem] compact:px-4 compact:pt-3 compact:pb-5">
        <div class="[ record-title-shell ] relative min-w-0" @mouseenter="show('title')" @mouseleave="hide()">
          <div ref="recordTitleViewport" class="[ record-title-viewport ] overflow-hidden pb-0.5">
            <h3
              ref="recordTitleText"
              class="[ record-title ] m-0 w-max max-w-none font-display text-lg font-medium leading-[1.08] whitespace-nowrap compact:text-sm"
              :class="recordTitleOverflow && active ? 'archive-record-title-marquee' : ''"
              :style="recordTitleStyle"
            >{{ props.exhibition.title }}</h3>
          </div>
          <ArchiveFloatingTooltip class="[ record-title-tooltip ]" :anchor="recordTitleViewport" :open="recordTitleOverflow && tip === 'title'" :label="$t('cards.fullTitle')">{{ props.exhibition.title }}</ArchiveFloatingTooltip>
        </div>
        <div class="relative min-w-0" @mouseenter="show('artist')" @mouseleave="hide()">
          <p ref="artistEl" class="[ artist-name ] my-[0.08rem] mt-[0.18rem] truncate font-display leading-[1.1] text-archive-red compact:text-sm">{{ props.exhibition.artist }}</p>
          <ArchiveFloatingTooltip :anchor="artistEl" :open="artistOverflow && tip === 'artist'" :label="$t('cards.fullArtists')"><span class="text-archive-red">{{ props.exhibition.artist }}</span></ArchiveFloatingTooltip>
        </div>
        <p class="[ record-location-line ] [ record-meta-line ] my-[0.08rem] flex min-w-0 items-center gap-[0.48rem] font-display text-sm leading-[1.15] text-archive-record-meta compact:text-xs compact:leading-[1.05]" :title="`${props.exhibition.venue}, ${props.exhibition.city}`">
          <span class="[ record-meta-icon ] archive-record-meta-icon record-meta-icon-location inline-block size-4 flex-none bg-current" aria-hidden="true" />
          <span class="min-w-0 truncate">{{ props.exhibition.venue }}, {{ props.exhibition.city }}</span>
        </p>
        <p class="[ record-date-line ] [ record-meta-line ] my-[0.08rem] flex items-center gap-[0.48rem] font-display text-sm leading-[1.15] text-archive-record-meta compact:text-xs compact:leading-[1.05]">
          <span class="[ record-meta-icon ] archive-record-meta-icon record-meta-icon-calendar inline-block size-4 flex-none bg-current" aria-hidden="true" />
          {{ props.exhibition.date_range }}
        </p>
      </div>
    </template>

    <template v-else>
      <img class="size-full object-cover transition-transform duration-700 ease-archive-lift group-hover/exhibition:scale-[1.025] motion-reduce:transition-none" :src="props.exhibition.image" :alt="imageAlt" loading="lazy" />
      <div class="[ record-sheet ] relative z-2 flex min-h-0 min-w-0 flex-col px-6 pt-5 pb-6 compact:px-3 compact:pt-3 compact:pb-4">
        <span
          class="[ record-ornament ] archive-crosshair-ornament pointer-events-none absolute transition-[transform,translate,scale,rotate,opacity] duration-460 ease-archive-lift compact:hidden motion-reduce:transition-none"
          :style="cornerStyle"
          aria-hidden="true"
        />
        <div class="[ record-sheet-body ] relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <p class="m-0 text-xs tracking-widest text-archive-red uppercase compact:text-3xs"><time v-if="props.exhibition.start_date" :datetime="props.exhibition.start_date">{{ props.exhibition.date_range }}</time><template v-else>{{ props.exhibition.date_range }}</template></p>
          <div class="relative min-w-0" @mouseenter="show('title')" @mouseleave="hide()">
            <h3 ref="titleEl" class="[ record-title ] mt-2 mb-0 truncate text-h3 font-normal leading-[1.3] compact:text-lg">{{ props.exhibition.title }}</h3>
            <ArchiveFloatingTooltip :anchor="titleEl" :open="titleOverflow && tip === 'title'" :label="$t('cards.fullTitle')">{{ props.exhibition.title }}</ArchiveFloatingTooltip>
          </div>
          <div class="relative min-w-0" @mouseenter="show('artist')" @mouseleave="hide()">
            <p ref="artistEl" class="[ artist-name ] mt-1 mb-0 truncate text-button text-archive-red compact:text-sm">{{ props.exhibition.artist }}</p>
            <ArchiveFloatingTooltip :anchor="artistEl" :open="artistOverflow && tip === 'artist'" :label="$t('cards.fullArtists')"><span class="text-button text-archive-red">{{ props.exhibition.artist }}</span></ArchiveFloatingTooltip>
          </div>
          <div v-if="props.summary && props.exhibition.summary" ref="summaryBox" class="relative mt-4 mb-3 min-h-0 min-w-0 flex-1 overflow-hidden compact:hidden" @mouseenter="show('summary')" @mouseleave="hide()">
            <p v-show="summaryLines > 0" ref="summaryEl" class="m-0 line-clamp-2 text-eyebrow leading-normal text-archive-body" :style="{ WebkitLineClamp: summaryLines }">{{ props.exhibition.summary }}</p>
            <ArchiveFloatingTooltip :anchor="summaryBox" :open="summaryOverflow && tip === 'summary'" :label="$t('cards.fullSummary')"><span class="text-eyebrow leading-normal">{{ props.exhibition.summary }}</span></ArchiveFloatingTooltip>
          </div>
        </div>
        <div class="[ record-sheet-footer ] mt-auto flex shrink-0 items-end justify-between gap-4 border-t border-archive-rule-warm/22 pt-4 compact:pt-2">
          <p class="m-0 text-sm text-archive-muted compact:text-xs">{{ props.exhibition.venue }} · {{ props.exhibition.city }}</p>
          <span class="flex shrink-0 items-center gap-2 text-archive-red compact:gap-1 compact:text-xs"><span class="compact:hidden">{{ $t(labels.open) }}</span><ArchiveArrow class="w-6 compact:w-5" /></span>
        </div>
      </div>
    </template>

    <span
      v-if="props.layout !== 'stacked'"
      class="[ record-ornament ] archive-crosshair-ornament pointer-events-none absolute z-3 transition-[transform,translate,scale,rotate,opacity] duration-460 ease-archive-lift motion-reduce:transition-none"
      :class="props.layout === 'hero' ? 'size-[5.2rem] brightness-215 sepia-25 saturate-115 opacity-66 compact:size-12' : 'size-[5.4rem] opacity-62 compact:size-12'"
      :style="ornamentStyle"
      aria-hidden="true"
    />
  </ExhibitionFrameCard>
</template>

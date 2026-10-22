<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import { resolveTourAccess } from '~/utils/tourAccess'

// The one exhibition card. Every list of exhibition records renders this
// component; the page only decides the layout and the grid cell. The rules
// (docs/superpowers/specs/2026-10-21-exhibition-card-rules-design.md):
//
// - Every card has the same slots: title (2 lines, reserved), artist (1 line,
//   reserved), place, date, summary (wide stacked cards only), action row. A
//   slot keeps its height when its data is missing, so sibling cards line up.
// - Text sizes come from the width of the text block, not from the layout:
//   S under 13rem, M from 13rem (`@card-m:`), L from 24rem (`@card-l:`).
// - The card is not a link. Its action row holds two icon tiles: the 360°
//   tour on the left (only while it is open; otherwise when it will be
//   online) and the exhibition page on the right.
//
// Layouts: `stacked` (image above the text), `side` (image beside the text on
// desktop, above it below 1280px), `slide` (a mobile slider card with a fixed
// height; the image takes what the text leaves) and `hero` (text over the
// full image, for the highlighted record on the landing page).
export type ExhibitionCardLayout = 'stacked' | 'side' | 'hero' | 'slide'

const props = withDefaults(defineProps<{
  exhibition: Pick<ResolvedExhibition, 'id' | 'title' | 'artist' | 'venue' | 'city' | 'date_range' | 'image'>
    & Partial<Pick<ResolvedExhibition, 'slug' | 'start_date' | 'end_date' | 'is_permanent' | 'image_alt' | 'summary' | 'kind' | 'tour' | 'tour_status' | 'tour_available_from'>>
  layout?: ExhibitionCardLayout
  /** `stacked` only: show the summary on wide cards. */
  summary?: boolean
  /** Overrides the route derived from the record's slug. */
  href?: string
  /** `slide` only: `feature` is the larger card of the current exhibitions. */
  size?: 'regular' | 'feature'
}>(), {
  layout: 'stacked',
  summary: true,
  href: undefined,
  size: 'regular'
})

const localePath = useLocalePath()
const archiveToday = useArchiveToday()
const { t, locale } = useI18n()
const { opening: tourOpening, openTour } = useTourViewer()

const isHero = computed(() => props.layout === 'hero')
const href = computed(() => props.href ?? (props.exhibition.slug ? localePath(`/exhibitions/${props.exhibition.slug}/`) : undefined))
const imageAlt = computed(() => props.exhibition.image_alt ?? props.exhibition.title)
const pageLabel = computed(() => t(props.exhibition.kind === 'event' ? 'cards.aboutEventFor' : 'cards.aboutExhibitionFor', { title: props.exhibition.title }))

// The 360° tile only while the tour is open; a scheduled or prepared tour gets
// a line in its place. "Unavailable" and "restricted" records promise nothing.
const tourAccess = computed(() => props.exhibition.tour_status
  ? resolveTourAccess({ tour: props.exhibition.tour, tour_status: props.exhibition.tour_status, tour_available_from: props.exhibition.tour_available_from ?? null }, archiveToday.value)
  : { kind: 'unavailable' as const })
const tourNote = computed(() => {
  const access = tourAccess.value
  if (access.kind === 'scheduled') {
    // No-break spaces keep the date on one line when the note wraps.
    const date = new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'short', year: 'numeric' })
      .format(new Date(`${access.date}T12:00:00`))
      .replaceAll(' ', ' ')
    return t('cards.onlineFrom', { date })
  }
  return access.kind === 'preparing' ? t('cards.onlinePreparing') : ''
})

// Below the L size the date uses short months and no spaces around the dash
// ("12. Sept.–24. Okt. 2026"), so it never needs cutting; across a year end
// it uses digits ("30.12.26–15.01.27"). L shows the record's own wording.
const shortDateRange = computed(() => {
  const { start_date: start, end_date: end, is_permanent: permanent, date_range: full } = props.exhibition
  if (!start || !end || permanent) return full
  const sameYear = start.slice(0, 4) === end.slice(0, 4)
  const format = new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : locale.value, sameYear
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: '2-digit' })
  return format.formatRange(new Date(`${start}T12:00:00`), new Date(`${end}T12:00:00`)).replace(/\s+–\s+/, '–')
})

// Cut text shows in full in a framed tooltip on hover, and the title also on
// keyboard focus inside the card. The tooltip lives in <body>
// (ArchiveFloatingTooltip), so the card's clip-path cannot cut it.
const titleEl = ref<HTMLElement | null>(null)
const artistEl = ref<HTMLElement | null>(null)
const titleOverflow = ref(false)
const artistOverflow = ref(false)
type Tip = 'title' | 'artist' | null
const tip = ref<Tip>(null)
const show = (which: Tip) => { tip.value = which }
const hide = () => { tip.value = null }

// One-line text: the browser draws "…" at any overflow, even a fraction of a
// pixel, which the rounded scrollWidth/clientWidth cannot see; compare exact
// widths instead. Clamped text: line boxes round, so allow 2px.
const isCutAcross = (el: HTMLElement | null) => {
  if (!el) return false
  const range = document.createRange()
  range.selectNodeContents(el)
  return range.getBoundingClientRect().width - el.getBoundingClientRect().width > 0.05
}
const isCutBelow = (el: HTMLElement | null) => Boolean(el) && el!.scrollHeight > el!.clientHeight + 2
const measure = () => {
  titleOverflow.value = isCutBelow(titleEl.value)
  artistOverflow.value = isCutAcross(artistEl.value)
}
let observer: ResizeObserver | null = null
const observe = () => {
  observer?.disconnect()
  observer = new ResizeObserver(measure)
  for (const el of [titleEl.value, artistEl.value]) {
    if (el) observer.observe(el)
  }
}

onMounted(async () => {
  await nextTick()
  measure()
  observe()
})
watch(() => [props.exhibition.title, props.exhibition.artist, props.layout], async () => {
  await nextTick()
  measure()
})
onBeforeUnmount(() => observer?.disconnect())

const rootClass = computed(() => ({
  stacked: '[ exhibition-card-stacked ]',
  side: '[ exhibition-card-side ] [ record-card ]',
  slide: `[ exhibition-card-slide ] [ record-card ] ${props.size === 'feature' ? 'h-94' : 'h-78'}`,
  hero: '[ exhibition-card-hero ] [ featured-record ]'
})[props.layout])
const surfaceClass = {
  stacked: '@container/card flex flex-col bg-archive-record-paper',
  side: '@container/card grid grid-cols-[49%_minmax(0,1fr)] bg-archive-record-paper tablet:flex tablet:flex-col',
  slide: '@container/card flex flex-col bg-archive-record-paper',
  hero: '@container/card flex min-h-160 flex-col justify-end bg-archive-record-night tablet:min-h-128 compact:min-h-80'
}
// Fixed image proportions per size; a slide image takes the height the text leaves.
const mediaClass = {
  stacked: 'relative aspect-4/3 @card-m/card:aspect-video @card-l/card:aspect-16/10',
  side: 'relative tablet:aspect-4/3 tablet:@card-m/card:aspect-video',
  slide: 'relative flex-1',
  hero: 'absolute inset-0'
}
const textClass = {
  stacked: 'flex-1',
  side: '',
  slide: 'shrink-0',
  hero: 'archive-record-overlay relative z-2'
}
</script>

<template>
  <ExhibitionFrameCard
    class="[ exhibition-card ]"
    :class="rootClass"
    :surface-class="surfaceClass[props.layout]"
    @mouseleave="hide()"
    @focusin="show('title')"
    @focusout="hide()"
  >
    <div class="[ record-card-media ] min-h-0 overflow-hidden" :class="mediaClass[props.layout]">
      <img
        class="[ record-card-image ] absolute inset-0 size-full object-cover"
        :class="isHero ? 'brightness-72 saturate-86' : ''"
        :src="props.exhibition.image"
        :alt="imageAlt"
        :loading="isHero ? undefined : 'lazy'"
      />
    </div>

    <div class="[ record-card-text ] @container flex min-h-0 min-w-0 flex-col" :class="textClass[props.layout]">
      <div
        class="[ record-card-copy ] flex h-full min-w-0 flex-col"
        :class="isHero
          ? 'px-10 pt-16 pb-8 compact:px-4 compact:pt-10 compact:pb-5'
          : 'px-3 pt-3 pb-5 @card-m:px-4 @card-m:pb-4 @card-l:px-6 @card-l:pt-5 @card-l:pb-6'"
      >
        <div class="relative min-w-0" @mouseenter="show('title')" @mouseleave="hide()">
          <h3
            ref="titleEl"
            class="[ record-title ] m-0 font-display font-normal wrap-break-word hyphens-auto"
            :class="isHero
              ? 'line-clamp-3 text-h3 text-archive-light-ink compact:text-title'
              : 'line-clamp-2 min-h-10 text-base leading-5 text-archive-ink @card-m:min-h-12 @card-m:text-xl @card-m:leading-6 @card-l:min-h-16 @card-l:text-title-lg @card-l:leading-8'"
          >{{ props.exhibition.title }}</h3>
          <ArchiveFloatingTooltip class="[ record-title-tooltip ]" :anchor="titleEl" :open="titleOverflow && tip === 'title'" :label="$t('cards.fullTitle')">{{ props.exhibition.title }}</ArchiveFloatingTooltip>
        </div>

        <div class="relative min-w-0" @mouseenter="show('artist')" @mouseleave="hide()">
          <p
            ref="artistEl"
            class="[ artist-name ] mt-1 mb-0 truncate font-display"
            :class="isHero
              ? 'text-lg text-archive-ochre compact:text-sm'
              : 'min-h-5 text-sm leading-5 text-archive-red @card-m:min-h-6 @card-m:text-base @card-m:leading-6 @card-l:text-lg @card-l:leading-6'"
          >{{ props.exhibition.artist }}</p>
          <ArchiveFloatingTooltip :anchor="artistEl" :open="artistOverflow && tip === 'artist'" :label="$t('cards.fullArtists')"><span class="text-archive-red">{{ props.exhibition.artist }}</span></ArchiveFloatingTooltip>
        </div>

        <div class="[ record-facts ] mt-2 font-display text-meta leading-5 @card-m:mt-3 @card-m:text-sm @card-l:mt-4" :class="isHero ? 'text-archive-light-ink' : 'text-archive-record-meta'">
          <p class="[ record-location-line ] m-0 flex min-w-0 items-center gap-2">
            <span class="[ record-meta-icon ] archive-record-meta-icon record-meta-icon-location hidden size-3.5 flex-none bg-current @card-m:inline-block" aria-hidden="true" />
            <span class="min-w-0 truncate"><span class="@card-m:hidden">{{ props.exhibition.venue }}</span><span class="hidden @card-m:inline">{{ props.exhibition.venue }} · {{ props.exhibition.city }}</span></span>
          </p>
          <p class="[ record-date-line ] m-0 flex min-w-0 items-center gap-2">
            <span class="[ record-meta-icon ] archive-record-meta-icon record-meta-icon-calendar hidden size-3.5 flex-none bg-current @card-m:inline-block" aria-hidden="true" />
            <time class="min-w-0 truncate" :datetime="props.exhibition.start_date"><span class="@card-l:hidden">{{ shortDateRange }}</span><span class="hidden @card-l:inline">{{ props.exhibition.date_range }}</span></time>
          </p>
        </div>

        <p
          v-if="props.layout === 'stacked' && props.summary && props.exhibition.summary"
          class="[ record-summary ] mt-3 mb-0 hidden min-h-12 font-display text-base leading-6 text-archive-body @card-l:line-clamp-2"
        >{{ props.exhibition.summary }}</p>

        <div class="[ record-card-actions ] mt-auto flex min-h-9 items-end justify-between gap-2 pt-2 @card-m:pt-3 @card-l:pt-4">
          <ExhibitionActionTile
            v-if="tourAccess.kind === 'open'"
            kind="tour"
            :label="$t('cards.startTourFor', { title: props.exhibition.title })"
            :busy="tourOpening"
            @click="openTour(tourAccess.url, $event.currentTarget as HTMLElement)"
          />
          <p v-else-if="tourNote" class="[ record-tour-note ] m-0 min-w-0 self-center text-xs" :class="isHero ? 'text-archive-light-ink' : 'text-archive-copy-warm'">{{ tourNote }}</p>
          <span v-else aria-hidden="true" />
          <ExhibitionActionTile v-if="href" kind="page" :label="pageLabel" :to="href" />
        </div>
      </div>
    </div>
  </ExhibitionFrameCard>
</template>

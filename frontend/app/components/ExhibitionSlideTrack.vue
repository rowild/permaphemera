<script setup lang="ts">
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'

// One horizontal row of `slide` cards on mobile with a "current / total"
// counter below. Current exhibitions use the `feature` size (4/5 of the screen
// wide, 1/5 taller), every other group the regular size (2/3 of the screen).
// The row runs to the screen edges whatever the parent's padding, and a
// trailing spacer lets the last card snap to the start, so the counter
// reaches every number.
// `contained` (start page rows, 2026-11-11): above phone width the row stays inside its column,
// five cards share its width and it scrolls sideways only when they do not fit; on phones it is
// the usual full-width slider with its counter.
const props = withDefaults(defineProps<{
  exhibitions: ResolvedExhibition[]
  size?: 'regular' | 'feature'
  contained?: boolean
}>(), {
  size: 'regular',
  contained: false
})

const track = ref<HTMLElement | null>(null)
const current = ref(1)
const total = computed(() => props.exhibitions.length)

const measure = () => {
  const el = track.value
  const cards = el?.children
  if (!el || !cards || cards.length < 2) {
    current.value = 1
    return
  }
  const step = (cards[1] as HTMLElement).offsetLeft - (cards[0] as HTMLElement).offsetLeft
  // A hidden row (desktop, display: none) has no layout: every offset is 0.
  if (step <= 0) {
    current.value = 1
    return
  }
  current.value = Math.min(total.value, Math.max(1, Math.round(el.scrollLeft / step) + 1))
}

let frame = 0
const onScroll = () => {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(measure)
}

// Measure again when the row gets its size, e.g. when a desktop window turns into a phone.
let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  measure()
  if (track.value) {
    resizeObserver = new ResizeObserver(onScroll)
    resizeObserver.observe(track.value)
  }
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
})
watch(total, () => nextTick(measure))

</script>

<template>
  <!-- Full screen width, whatever the parent's side padding: the cards run to the screen edge. -->
  <div class="[ exhibition-slide-track ] relative" :class="props.contained ? 'compact:left-1/2 compact:w-screen compact:-translate-x-1/2' : 'left-1/2 w-screen -translate-x-1/2'">
    <!-- A scrolling row cuts what leaves its box: the bottom padding holds the
         cards' whole shadow (about 24px below the card), the negative margin
         gives the extra 12px back, so the counter keeps its place. -->
    <ul
      ref="track"
      class="archive-slide-track flex snap-x snap-mandatory gap-3 overflow-x-auto pt-1 pb-6 -mb-3"
      :class="[props.contained ? 'scroll-px-1 px-1 compact:scroll-px-4 compact:px-4' : 'scroll-px-4 px-4', total > 1 ? (props.contained ? 'compact:after:w-1/3 compact:after:shrink-0' : props.size === 'feature' ? 'after:w-1/5 after:shrink-0' : 'after:w-1/3 after:shrink-0') : '']"
      role="list"
      @scroll.passive="onScroll"
    >
      <li v-for="exhibition in props.exhibitions" :key="exhibition.id" class="shrink-0 snap-start" :class="props.contained ? 'w-[clamp(12rem,calc((100%-3rem)/5),17rem)] compact:w-slide' : props.size === 'feature' ? 'w-slide-feature' : 'w-slide'">
        <ExhibitionCard :exhibition="exhibition" layout="slide" :size="props.size" />
      </li>
    </ul>
    <!-- The counter and the group's "all" link (slot `link`) share one row. -->
    <div v-if="total > 1 || $slots.link" class="[ exhibition-slide-footer ] mt-1 flex items-baseline justify-between gap-4 px-4" :class="props.contained ? 'hidden compact:flex' : ''">
      <p v-if="total > 1" class="[ exhibition-slide-count ] m-0 shrink-0 font-display text-sm leading-5 tracking-widest text-archive-record-meta tabular-nums lining-nums" aria-hidden="true">
        <span class="text-archive-red">{{ current }}</span> / {{ total }}
      </p>
      <div v-if="$slots.link" class="ml-auto min-w-0 text-right">
        <slot name="link" />
      </div>
    </div>
  </div>
</template>

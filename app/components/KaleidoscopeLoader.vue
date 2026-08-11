<script setup lang="ts">
import { computed } from 'vue'
import { orbitRadius, orbitSegments, pointOnOrbit } from '~/utils/orbitGeometry'
import { toRomanNumeral } from '~/utils/romanNumerals'

const props = defineProps<{
  readySlices: boolean[]
  total: number
  activeIndex: number
  fraction: number
  dismissing?: boolean
}>()
const { t } = useI18n()

const circumference = 2 * Math.PI * orbitRadius
const loadedCount = computed(() => props.readySlices.filter(Boolean).length)
const clampedFraction = computed(() => Math.min(1, Math.max(0, props.fraction)))
// The ring spans all twelve galleries: each one owns a twelfth of the circle,
// and that twelfth fills with its own download. So the arc only ever grows.
const overallFraction = computed(() => Math.min(
  1,
  Math.max(0, (props.activeIndex + clampedFraction.value) / props.total)
))
const dashOffset = computed(() => (circumference * (1 - overallFraction.value)).toFixed(3))
// The centre reports the single image in flight, which the ring cannot show.
const percentText = computed(() => `${Math.round(clampedFraction.value * 100)}%`)
const counterText = computed(() => t('landing.hero.loadingCounter', {
  current: toRomanNumeral(Math.min(props.activeIndex + 1, props.total)),
  total: toRomanNumeral(props.total)
}))
const progressText = computed(() => t('landing.hero.loadingProgress', {
  loaded: loadedCount.value,
  total: props.total
}))
const tickReach = 2.6
const ticks = orbitSegments.map((segment) => {
  const inner = pointOnOrbit(segment.rotation, orbitRadius - tickReach)
  const outer = pointOnOrbit(segment.rotation, orbitRadius + tickReach)

  return {
    id: segment.id,
    x1: inner.x.toFixed(3),
    y1: inner.y.toFixed(3),
    x2: outer.x.toFixed(3),
    y2: outer.y.toFixed(3)
  }
})
</script>

<template>
  <div
    class="[ kaleidoscope-loader ] pointer-events-none absolute inset-0 z-4 grid place-items-center transition-opacity duration-400 ease-out motion-reduce:transition-none"
    :class="props.dismissing ? 'opacity-0' : 'opacity-100'"
    role="progressbar"
    :aria-label="t('landing.hero.loadingTitle')"
    :aria-valuemin="0"
    :aria-valuemax="props.total"
    :aria-valuenow="loadedCount"
    :aria-valuetext="progressText"
  >
    <svg
      class="absolute inset-[-2%] size-[104%] overflow-visible text-archive-red"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <circle
        class="fill-none stroke-current opacity-15"
        cx="50"
        cy="50"
        :r.attr="orbitRadius"
        stroke-width="0.18"
      />
      <line
        v-for="tick in ticks"
        :key="tick.id"
        class="stroke-current transition-opacity duration-500 ease-out motion-reduce:transition-none"
        :class="props.readySlices[tick.id] ? 'opacity-70' : 'opacity-15'"
        :x1.attr="tick.x1"
        :y1.attr="tick.y1"
        :x2.attr="tick.x2"
        :y2.attr="tick.y2"
        stroke-width="0.42"
        stroke-linecap="round"
      />
      <circle
        class="fill-none stroke-current opacity-80"
        cx="50"
        cy="50"
        :r.attr="orbitRadius"
        stroke-width="0.5"
        stroke-linecap="round"
        :stroke-dasharray.attr="circumference.toFixed(3)"
        :stroke-dashoffset.attr="dashOffset"
        transform="rotate(-90 50 50)"
      />
    </svg>

    <!-- The widget's own aria-label and aria-valuetext already carry this, so
         the visible legend is hidden to avoid a doubled announcement. -->
    <p class="relative grid justify-items-center gap-[0.3rem] text-center font-display" aria-hidden="true">
      <span class="text-[0.68rem] tracking-[0.28em] text-archive-muted uppercase compact:text-[0.58rem]">{{ t('landing.hero.loadingTitle') }}</span>
      <span class="text-[0.92rem] tracking-[0.2em] text-archive-copy compact:text-xs">{{ counterText }}</span>
      <span class="text-[1.6rem] leading-none tracking-[0.08em] text-archive-red tabular-nums compact:text-xl">{{ percentText }}</span>
    </p>
  </div>
</template>

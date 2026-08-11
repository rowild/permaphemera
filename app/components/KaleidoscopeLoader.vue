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
// The arc measures the image being downloaded right now, so it refills for
// each one rather than creeping across the whole set.
const dashOffset = computed(() => (circumference * (1 - clampedFraction.value)).toFixed(3))
const percentText = computed(() => `${Math.round(clampedFraction.value * 100)}%`)
const currentNumeral = computed(() => toRomanNumeral(Math.min(props.activeIndex + 1, props.total)))
const totalNumeral = computed(() => toRomanNumeral(props.total))
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
    :aria-label="t('landing.hero.loadingLabel')"
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

    <p class="relative grid justify-items-center gap-[0.35rem] text-center font-display">
      <span class="text-[0.68rem] tracking-[0.34em] text-archive-muted uppercase compact:text-[0.6rem]">{{ t('landing.hero.loadingLabel') }} {{ currentNumeral }}<span class="text-archive-line"> / </span>{{ totalNumeral }}</span>
      <span class="text-[1.6rem] leading-none tracking-[0.08em] text-archive-red tabular-nums compact:text-xl">{{ percentText }}</span>
    </p>
  </div>
</template>

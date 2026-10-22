<script setup lang="ts">
import { computed } from 'vue'
import { toRomanNumeral } from '~/utils/romanNumerals'

// The loading legend in the centre of the wheel: what is loading, which image
// of how many, and the download percentage of the image in flight. Since
// 2026-10-22 it draws no ring on the orbit: the faded arrows circle there.
const props = defineProps<{
  readySlices: boolean[]
  total: number
  activeIndex: number
  fraction: number
  dismissing?: boolean
}>()
const { t } = useI18n()

const loadedCount = computed(() => props.readySlices.filter(Boolean).length)
const clampedFraction = computed(() => Math.min(1, Math.max(0, props.fraction)))
const percentText = computed(() => `${Math.round(clampedFraction.value * 100)}%`)
const counterText = computed(() => t('landing.hero.loadingCounter', {
  current: toRomanNumeral(Math.min(props.activeIndex + 1, props.total)),
  total: toRomanNumeral(props.total)
}))
const progressText = computed(() => t('landing.hero.loadingProgress', {
  loaded: loadedCount.value,
  total: props.total
}))
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
    <!-- The widget's own aria-label and aria-valuetext already carry this, so
         the visible legend is hidden to avoid a doubled announcement. -->
    <p class="relative grid justify-items-center gap-[0.3rem] text-center font-display" aria-hidden="true">
      <span class="text-2xs tracking-[0.28em] text-archive-muted uppercase compact:text-3xs">{{ t('landing.hero.loadingTitle') }}</span>
      <span class="text-eyebrow tracking-[0.2em] text-archive-copy compact:text-xs">{{ counterText }}</span>
      <span class="text-2xl leading-none tracking-[0.08em] text-archive-red tabular-nums compact:text-xl">{{ percentText }}</span>
    </p>
  </div>
</template>

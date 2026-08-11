<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import {
  describeArrowHead,
  describeOrbitArc,
  orbitEndAngle,
  orbitRadius,
  orbitSegments,
  orbitStartAngle,
  pointOnOrbit
} from '~/utils/orbitGeometry'
import { toRomanNumeral } from '~/utils/romanNumerals'

const props = defineProps<{
  readySlices: boolean[]
  total: number
  dismissing?: boolean
}>()
const { t } = useI18n()

const sweepRef = ref<SVGGElement | null>(null)
const loadedCount = computed(() => props.readySlices.filter(Boolean).length)
const progressText = computed(() => t('landing.hero.loadingProgress', {
  loaded: loadedCount.value,
  total: props.total
}))
// An em dash stands in until the first gallery lands, so the legend never
// collapses to an empty line.
const loadedNumeral = computed(() => toRomanNumeral(loadedCount.value) || '—')
const totalNumeral = computed(() => toRomanNumeral(props.total))
const sweepArc = describeOrbitArc(orbitStartAngle, orbitEndAngle)
const sweepHead = describeArrowHead(orbitEndAngle)
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

let sweepTween: gsap.core.Tween | null = null

onMounted(() => {
  const sweep = sweepRef.value
  if (!sweep) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const rotation = { value: 0 }

  // The lone arrow keeps the dial alive while a single large image stalls, so
  // the discrete ticks can stay honest about actual progress.
  sweepTween = gsap.to(rotation, {
    value: 360,
    duration: 9,
    ease: 'none',
    repeat: -1,
    onUpdate: () => sweep.setAttribute('transform', `rotate(${rotation.value} 50 50)`)
  })
})

onBeforeUnmount(() => {
  sweepTween?.kill()
  sweepTween = null
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
      <g ref="sweepRef" class="opacity-60">
        <path
          class="fill-none stroke-current"
          :d="sweepArc"
          stroke-width="0.18"
          stroke-linecap="round"
        />
        <polygon class="fill-current" :points.attr="sweepHead" />
      </g>
    </svg>

    <p class="relative grid justify-items-center gap-[0.4rem] text-center font-display">
      <span class="text-[0.68rem] tracking-[0.34em] text-archive-muted uppercase compact:text-[0.6rem]">{{ t('landing.hero.loadingLabel') }}</span>
      <span class="text-[1.35rem] tracking-[0.16em] text-archive-red compact:text-lg">{{ loadedNumeral }}<span class="text-archive-muted"> — </span>{{ totalNumeral }}</span>
    </p>
  </div>
</template>

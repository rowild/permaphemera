<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import {
  createVenueFramePath,
  createVenueInnerFramePath,
  VENUE_OUTER_CORNER_RADIUS,
  VENUE_OUTER_FRAME_INSET
} from '../utils/venueFrameGeometry'

const frameRef = ref<HTMLSpanElement | null>(null)
const width = ref(436)
const height = ref(560)
let resizeObserver: ResizeObserver | null = null
const paperGradientId = `venue-card-paper-${useId().replaceAll(':', '')}`

const outerPathD = computed(() => createVenueFramePath(
  width.value,
  height.value,
  VENUE_OUTER_FRAME_INSET,
  VENUE_OUTER_CORNER_RADIUS
))
const innerPathD = computed(() => createVenueInnerFramePath(width.value, height.value))

const updateSize = () => {
  const rect = frameRef.value?.getBoundingClientRect()

  if (!rect) {
    return
  }

  width.value = Math.max(1, rect.width)
  height.value = Math.max(1, rect.height)
}

onMounted(() => {
  updateSize()

  if (!frameRef.value) {
    return
  }

  resizeObserver = new ResizeObserver(updateSize)
  resizeObserver.observe(frameRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <span ref="frameRef" class="venue-card-paper" aria-hidden="true">
    <svg :viewBox.attr="`0 0 ${width} ${height}`" preserveAspectRatio="none">
      <defs>
        <linearGradient
          :id="paperGradientId"
          gradientUnits="userSpaceOnUse"
          x1="0"
          x2="0"
          y1="0"
          :y2.attr="height"
        >
          <stop offset="0" stop-color="#fffdf8" />
          <stop offset="0.58" stop-color="#fbf5eb" />
          <stop offset="1" stop-color="#f5eadc" />
        </linearGradient>
      </defs>
      <path :d="outerPathD" fill="#fffaf3" />
      <path
        :d="innerPathD"
        :fill="`url(#${paperGradientId})`"
        fill-opacity="0.85"
      />
    </svg>
  </span>
  <span class="venue-card-frame" aria-hidden="true">
    <svg :viewBox.attr="`0 0 ${width} ${height}`" preserveAspectRatio="none">
      <path
        :d="outerPathD"
        fill="none"
        stroke="#c6aa87"
        stroke-width="1"
        stroke-opacity="0.45"
        vector-effect="non-scaling-stroke"
      />
      <path
        :d="innerPathD"
        fill="none"
        stroke="#987653"
        stroke-width="1"
        stroke-opacity="0.15"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  </span>
</template>

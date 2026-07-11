<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { createVenueInnerFramePath, createVenueMediaPath } from '../utils/venueFrameGeometry'

const props = defineProps<{
  src: string
  alt: string
  shape?: 'media' | 'frame'
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const width = ref(436)
const height = ref(220)
let resizeObserver: ResizeObserver | null = null

const maskId = `venue-image-mask-${useId().replaceAll(':', '')}`

const maskPathD = computed(() => {
  return props.shape === 'frame'
    ? createVenueInnerFramePath(width.value, height.value)
    : createVenueMediaPath(width.value, height.value)
})

const updateSize = () => {
  const rect = svgRef.value?.getBoundingClientRect()

  if (!rect) {
    return
  }

  width.value = Math.max(1, rect.width)
  height.value = Math.max(1, rect.height)
}

onMounted(() => {
  updateSize()

  if (!svgRef.value) {
    return
  }

  resizeObserver = new ResizeObserver(updateSize)
  resizeObserver.observe(svgRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <svg
    ref="svgRef"
    class="venue-card-image"
    :viewBox.attr="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    :role="props.alt ? 'img' : undefined"
    :aria-label="props.alt || undefined"
    :aria-hidden="props.alt ? undefined : 'true'"
  >
    <defs>
      <mask
        :id="maskId"
        x="0"
        y="0"
        :width.attr="width"
        :height.attr="height"
        maskUnits="userSpaceOnUse"
        maskContentUnits="userSpaceOnUse"
        style="mask-type: alpha"
      >
        <path :d="maskPathD" fill="white" stroke="transparent" stroke-width="0" />
      </mask>
    </defs>
    <image
      :href.attr="props.src"
      x="0"
      y="0"
      :width.attr="width"
      :height.attr="height"
      preserveAspectRatio="xMidYMid slice"
      :mask="`url(#${maskId})`"
    />
    <path
      :d="maskPathD"
      fill="none"
      stroke="#987653"
      stroke-width="1"
      stroke-opacity="0.25"
      vector-effect="non-scaling-stroke"
      aria-hidden="true"
    />
  </svg>
</template>

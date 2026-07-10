<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createVenueMediaPath } from '../utils/venueFrameGeometry'

const props = defineProps<{
  src: string
  alt: string
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const width = ref(436)
const height = ref(220)
let resizeObserver: ResizeObserver | null = null

const maskId = computed(() => {
  let hash = 0
  const source = `${props.src}-${props.alt}`

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }

  return `venue-image-mask-${hash.toString(36)}`
})

const maskPathD = computed(() => {
  return createVenueMediaPath(width.value, height.value)
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
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    role="img"
    :aria-label="props.alt"
  >
    <defs>
      <mask
        :id="maskId"
        x="0"
        y="0"
        :width="width"
        :height="height"
        maskUnits="userSpaceOnUse"
        maskContentUnits="userSpaceOnUse"
        style="mask-type: alpha"
      >
        <path :d="maskPathD" fill="white" stroke="transparent" stroke-width="0" />
      </mask>
    </defs>
    <image
      :href="props.src"
      x="0"
      y="0"
      :width="width"
      :height="height"
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

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { directusImageUrl, imageWidthFor } from '../utils/archiveAsset'
import { createVenueInnerFramePath, createVenueMediaPath } from '../utils/venueFrameGeometry'

const props = defineProps<{
  src: string
  alt: string
  shape?: 'media' | 'frame'
  interactive?: boolean
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const width = ref(436)
const height = ref(220)
let resizeObserver: ResizeObserver | null = null

// Directus delivers the image at the measured width (an SVG <image> takes no srcset). The address
// waits for the first measurement, which comes before the first paint, so only one size loads;
// it only grows, so a smaller window keeps the image it has.
const imageStep = ref(0)
const href = computed(() => (imageStep.value ? directusImageUrl(props.src, imageStep.value) : undefined))

const maskId = `venue-image-mask-${useId().replaceAll(':', '')}`

const maskPathD = computed(() => {
  return props.shape === 'frame'
    ? createVenueInnerFramePath(width.value, height.value)
    : createVenueMediaPath(width.value, height.value)
})

// The layout size, never getBoundingClientRect(): the gallery cards tilt the
// image, and the tilted box is larger. Where the height follows the viewBox
// (the featured gallery card on phones), the larger box grew the viewBox, the
// viewBox grew the image, and the observer fired again in an endless loop.
// The observer's first report comes before the first paint.
const updateSize = ([entry]: ResizeObserverEntry[]) => {
  if (!entry) {
    return
  }

  width.value = Math.max(1, entry.contentRect.width)
  height.value = Math.max(1, entry.contentRect.height)
  imageStep.value = Math.max(imageStep.value, imageWidthFor(width.value, window.devicePixelRatio || 1))
}

onMounted(() => {
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
    class="[ venue-card-image ] block w-full border-0 bg-transparent shadow-none"
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
      class="origin-center motion-reduce:transition-none"
      :class="{ 'transition-transform duration-700 ease-archive-lift group-hover/venue:scale-[1.035]': props.interactive }"
      style="transform-box: fill-box"
      :href.attr="href"
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

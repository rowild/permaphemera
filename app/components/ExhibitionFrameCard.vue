<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { createVenueInnerFramePath } from '../utils/venueFrameGeometry'

withDefaults(defineProps<{
  href?: string
  ariaLabel?: string
}>(), {
  href: undefined,
  ariaLabel: undefined
})

const cardRef = ref<HTMLElement | null>(null)
const width = ref(640)
const height = ref(320)
let resizeObserver: ResizeObserver | null = null
const clipId = `exhibition-card-${useId().replaceAll(':', '')}`

const innerPathD = computed(() => createVenueInnerFramePath(width.value, height.value))

const updateSize = () => {
  const rect = cardRef.value?.getBoundingClientRect()

  if (!rect) {
    return
  }

  width.value = Math.max(1, rect.width)
  height.value = Math.max(1, rect.height)
}

onMounted(() => {
  updateSize()

  if (!cardRef.value) {
    return
  }

  resizeObserver = new ResizeObserver(updateSize)
  resizeObserver.observe(cardRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <component
    :is="href ? 'a' : 'article'"
    ref="cardRef"
    class="exhibition-frame-card"
    :href="href"
    :aria-label="ariaLabel"
  >
    <svg
      class="exhibition-card-mask-defs"
      :viewBox="`0 0 ${width} ${height}`"
      aria-hidden="true"
    >
      <defs>
        <clipPath :id="clipId" clipPathUnits="userSpaceOnUse">
          <path :d="innerPathD" />
        </clipPath>
      </defs>
    </svg>
    <div
      class="exhibition-card-surface"
      :style="{ clipPath: `url(#${clipId})` }"
    >
      <slot />
    </div>
    <VenueCardFrame />
  </component>
</template>

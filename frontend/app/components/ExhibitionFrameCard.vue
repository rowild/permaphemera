<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { createVenueInnerFramePath } from '../utils/venueFrameGeometry'

// The cut-corner paper frame around one exhibition card. The surface is in
// the normal flow, so a card is as tall as its content unless the card gives
// itself a height; the paper and the frame lines are drawn over it.
// The card itself is never a link: only its action tiles are (card rules §3.7).
const props = withDefaults(defineProps<{
  surfaceClass?: string
}>(), {
  surfaceClass: ''
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
  <article
    ref="cardRef"
    class="[ exhibition-frame-card ] group/exhibition relative isolate min-w-0 overflow-visible border-0 bg-transparent text-inherit shadow-none filter-[drop-shadow(0_0.55rem_0.6rem_rgba(75,52,29,0.12))]"
  >
    <svg
      class="[ exhibition-card-mask-defs ] pointer-events-none absolute size-0 overflow-hidden"
      :viewBox.attr="`0 0 ${width} ${height}`"
      aria-hidden="true"
    >
      <defs>
        <clipPath :id="clipId" clipPathUnits="userSpaceOnUse">
          <path :d="innerPathD" />
        </clipPath>
      </defs>
    </svg>
    <div
      class="[ exhibition-card-surface ] relative z-1 h-full overflow-hidden"
      :class="props.surfaceClass"
      :style="{ clipPath: `url(#${clipId})` }"
    >
      <slot />
    </div>
    <VenueCardFrame />
  </article>
</template>

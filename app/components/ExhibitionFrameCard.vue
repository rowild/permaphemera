<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { createVenueInnerFramePath } from '../utils/venueFrameGeometry'

const props = withDefaults(defineProps<{
  href?: string
  ariaLabel?: string
  surfaceClass?: string
}>(), {
  href: undefined,
  ariaLabel: undefined,
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
  <component
    :is="props.href ? 'a' : 'article'"
    ref="cardRef"
    class="[ exhibition-frame-card ] group/exhibition relative min-w-0 overflow-visible border-0 bg-transparent shadow-none text-inherit no-underline filter-[drop-shadow(0_0.55rem_0.6rem_rgba(75,52,29,0.12))] isolate [transition:filter_0.42s_ease,translate_0.42s_var(--ease-archive-lift)] motion-reduce:transition-none"
    :class="props.href ? 'cursor-pointer hover:translate-y-[-0.18rem] hover:filter-[drop-shadow(0_0.8rem_0.85rem_rgba(75,52,29,0.2))] focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red' : 'cursor-default'"
    :href="props.href"
    :aria-label="props.ariaLabel"
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
      class="[ exhibition-card-surface ] absolute inset-0 z-1 overflow-hidden"
      :class="props.surfaceClass"
      :style="{ clipPath: `url(#${clipId})` }"
    >
      <slot />
    </div>
    <VenueCardFrame />
  </component>
</template>

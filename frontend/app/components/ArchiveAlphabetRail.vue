<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})

const props = defineProps<{
  label?: string
  controls?: boolean
  controlsLabel?: string
  scrollHint?: string
  scrollLeftLabel?: string
  scrollRightLabel?: string
}>()
const { t } = useI18n()
const resolvedLabel = computed(() => props.label ?? t('landing.artists.alphabetAria'))
const resolvedControlsLabel = computed(() => props.controlsLabel ?? t('landing.artists.alphabetControlsAria'))
const resolvedScrollHint = computed(() => props.scrollHint ?? t('landing.artists.scrollHint'))
const resolvedScrollLeftLabel = computed(() => props.scrollLeftLabel ?? t('landing.artists.scrollLeft'))
const resolvedScrollRightLabel = computed(() => props.scrollRightLabel ?? t('landing.artists.scrollRight'))

const rail = ref<HTMLElement | null>(null)
const dragging = ref(false)
let activePointerId: number | null = null
let pointerStartX = 0
let scrollStartX = 0

const handlePointerDown = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse' || event.button !== 0 || !rail.value) return

  activePointerId = event.pointerId
  pointerStartX = event.clientX
  scrollStartX = rail.value.scrollLeft
  dragging.value = false
}

const handlePointerMove = (event: PointerEvent) => {
  if (activePointerId !== event.pointerId || !rail.value) return

  const distance = event.clientX - pointerStartX
  if (!dragging.value && Math.abs(distance) < 4) return

  if (!dragging.value && !rail.value.hasPointerCapture(event.pointerId)) {
    rail.value.setPointerCapture(event.pointerId)
  }
  dragging.value = true
  rail.value.scrollLeft = scrollStartX - distance
  event.preventDefault()
}

const handlePointerEnd = (event: PointerEvent) => {
  if (activePointerId !== event.pointerId || !rail.value) return

  if (rail.value.hasPointerCapture(event.pointerId)) {
    rail.value.releasePointerCapture(event.pointerId)
  }
  activePointerId = null

  if (dragging.value) {
    requestAnimationFrame(() => {
      dragging.value = false
    })
  }
}

const handleClickCapture = (event: MouseEvent) => {
  if (!dragging.value) return

  event.preventDefault()
  event.stopPropagation()
}

const scrollByKey = (distance: number) => {
  rail.value?.scrollBy({ left: distance, behavior: 'smooth' })
}

defineExpose({
  scrollBy: scrollByKey
})
</script>

<template>
  <nav
    ref="rail"
    v-bind="$attrs"
    class="[ alphabet-rail ] archive-alphabet-rail flex w-full flex-nowrap items-center overflow-x-auto overscroll-x-contain whitespace-nowrap select-none compact:cursor-grab compact:active:cursor-grabbing"
    :class="{ 'cursor-grabbing': dragging }"
    :aria-label="resolvedLabel"
    tabindex="0"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerEnd"
    @pointercancel="handlePointerEnd"
    @click.capture="handleClickCapture"
    @keydown.left.prevent="scrollByKey(-120)"
    @keydown.right.prevent="scrollByKey(120)"
  >
    <slot />
  </nav>

  <div
    v-if="props.controls"
    class="[ alphabet-scroll-controls ] mx-auto mt-0 mb-10 flex w-fit items-center justify-center gap-[1.2rem] font-display text-eyebrow whitespace-nowrap text-archive-red/86 compact:mb-8 compact:gap-1 compact:text-xs"
    :aria-label="resolvedControlsLabel"
  >
    <button
      class="inline-flex min-h-11 min-w-11 items-center justify-center border-0 bg-transparent text-inherit transition-colors duration-150 ease-out hover:text-archive-ink focus-visible:text-archive-ink focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red"
      type="button"
      :aria-label="resolvedScrollLeftLabel"
      @click="scrollByKey(-320)"
    >
      <ArchiveArrow class="w-[2.2rem]" direction="left" />
    </button>
    <span>{{ resolvedScrollHint }}</span>
    <button
      class="inline-flex min-h-11 min-w-11 items-center justify-center border-0 bg-transparent text-inherit transition-colors duration-150 ease-out hover:text-archive-ink focus-visible:text-archive-ink focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red"
      type="button"
      :aria-label="resolvedScrollRightLabel"
      @click="scrollByKey(320)"
    >
      <ArchiveArrow class="w-[2.2rem]" />
    </button>
  </div>
</template>

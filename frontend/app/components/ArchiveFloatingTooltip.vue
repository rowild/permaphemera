<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'

// A tooltip that lives in <body>, so no card clip-path, overflow-hidden or
// stacking context between the anchor and the page can cut it off. The caller
// owns the open state (hover or focus of the clipped text); this component
// only positions the framed tooltip under the anchor, as wide as the anchor,
// and flips above it when the viewport ends too soon. It follows the anchor
// while the page scrolls or resizes.
const props = withDefaults(defineProps<{
  anchor: HTMLElement | null
  open: boolean
  /** Small red caption above the text, e.g. "Full title". */
  label?: string
}>(), {
  label: undefined
})

const GAP = 5
const frame = ref<{ $el: HTMLElement } | null>(null)
const style = ref<CSSProperties>({})
const pointerSide = ref<'top' | 'bottom'>('top')

const place = () => {
  const rect = props.anchor?.getBoundingClientRect()
  if (!rect) return
  const height = frame.value?.$el.offsetHeight ?? 0
  const below = rect.bottom + GAP + height <= window.innerHeight || rect.top - GAP - height < 0
  pointerSide.value = below ? 'top' : 'bottom'
  style.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    ...(below ? { top: `${rect.bottom + GAP}px` } : { top: `${rect.top - GAP - height}px` })
  }
}

const listen = () => {
  window.addEventListener('scroll', place, true)
  window.addEventListener('resize', place)
}
const unlisten = () => {
  window.removeEventListener('scroll', place, true)
  window.removeEventListener('resize', place)
}

watch(() => props.open, async (open) => {
  if (!open) { unlisten(); return }
  place()
  listen()
  await nextTick()
  place()
}, { immediate: true })

onBeforeUnmount(unlisten)
</script>

<template>
  <Teleport to="body">
    <Transition name="archive-floating-tooltip">
      <ArchiveTooltipFrame
        v-if="props.open"
        ref="frame"
        as="div"
        class="[ archive-floating-tooltip ] pointer-events-none z-50 px-2 py-1 font-display text-sm leading-[1.2] text-archive-ink filter-[drop-shadow(0_0.38rem_0.42rem_rgba(75,52,29,0.18))] compact:text-xs"
        :pointer-side="pointerSide"
        :pointer-offset="-50"
        :style="style"
        aria-hidden="true"
      >
        <span v-if="props.label" class="mb-0.5 block text-3xs leading-none tracking-[0.09em] text-archive-red uppercase compact:text-4xs">{{ props.label }}</span>
        <span class="block"><slot /></span>
      </ArchiveTooltipFrame>
    </Transition>
  </Teleport>
</template>

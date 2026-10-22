<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'

// A tooltip that lives in <body>, so no card clip-path, overflow-hidden or
// stacking context between the anchor and the page can cut it off. The caller
// owns the open state (hover or focus of the clipped text); this component
// only positions the framed tooltip under the anchor, as wide as the anchor,
// and flips above it when the viewport ends too soon. With `fit="content"`
// (a small control, e.g. a card's icon tile) it is as wide as its text,
// centred on the anchor and kept inside the viewport, its pointer still on
// the anchor; `prefer="above"` tries the space above first. It follows the
// anchor while the page scrolls or resizes.
const props = withDefaults(defineProps<{
  anchor: HTMLElement | null
  open: boolean
  /** Small red caption above the text, e.g. "Full title". */
  label?: string
  fit?: 'anchor' | 'content'
  prefer?: 'below' | 'above'
}>(), {
  label: undefined,
  fit: 'anchor',
  prefer: 'below'
})

const GAP = 5
const VIEWPORT_MARGIN = 8
const frame = ref<{ $el: HTMLElement } | null>(null)
const style = ref<CSSProperties>({})
const pointerSide = ref<'top' | 'bottom'>('top')
const pointerOffset = ref(-50)

const place = () => {
  const rect = props.anchor?.getBoundingClientRect()
  if (!rect) return
  const height = frame.value?.$el.offsetHeight ?? 0
  const fitsBelow = rect.bottom + GAP + height <= window.innerHeight
  const fitsAbove = rect.top - GAP - height >= 0
  const below = props.prefer === 'above' ? !fitsAbove && fitsBelow : fitsBelow || !fitsAbove
  pointerSide.value = below ? 'top' : 'bottom'
  const top = below ? rect.bottom + GAP : rect.top - GAP - height
  if (props.fit === 'anchor') {
    pointerOffset.value = -50
    style.value = { position: 'fixed', left: `${rect.left}px`, width: `${rect.width}px`, top: `${top}px` }
    return
  }
  const width = frame.value?.$el.offsetWidth ?? 0
  const center = rect.left + rect.width / 2
  const left = Math.min(Math.max(center - width / 2, VIEWPORT_MARGIN), window.innerWidth - VIEWPORT_MARGIN - width)
  pointerOffset.value = center - (left + width / 2)
  style.value = { position: 'fixed', left: `${left}px`, width: 'max-content', maxWidth: '16rem', top: `${top}px` }
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
        :pointer-offset="pointerOffset"
        :style="style"
        aria-hidden="true"
      >
        <span v-if="props.label" class="mb-0.5 block text-3xs leading-none tracking-[0.09em] text-archive-red uppercase compact:text-4xs">{{ props.label }}</span>
        <span class="block"><slot /></span>
      </ArchiveTooltipFrame>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  as?: 'span' | 'div' | 'aside' | 'nav'
  pointerSide?: 'top' | 'bottom'
  pointerOffset?: number
}>(), {
  as: 'span',
  pointerSide: 'top',
  pointerOffset: 0
})

const pointerStyle = computed(() => ({
  '--archive-tooltip-pointer-offset': `${props.pointerOffset}px`
} as CSSProperties))
</script>

<template>
  <component
    :is="props.as"
    class="[ archive-tooltip-frame ] archive-shared-tooltip-frame archive-button-secondary-frame block border-12 border-transparent bg-transparent"
    :class="`has-pointer-${props.pointerSide}`"
    :style="pointerStyle"
  >
    <span class="[ archive-tooltip-pointer ] archive-shared-tooltip-pointer" aria-hidden="true" />
    <slot />
  </component>
</template>

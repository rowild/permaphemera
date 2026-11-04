<script setup lang="ts">
// The small capital line above a heading. `routed` carries the page ornament (heroes),
// `section` the section ornament, `none` none; `gold` on dark surfaces.
const props = withDefaults(defineProps<{
  ornament?: 'routed' | 'section' | 'none'
  tone?: 'red' | 'gold'
}>(), {
  ornament: 'routed',
  tone: 'red'
})

const ornamentClass = {
  routed: 'archive-routed-eyebrow mb-[0.85rem] inline-flex items-center gap-[0.7rem] compact:mb-2 compact:text-xs',
  section: 'archive-section-eyebrow mb-3 inline-flex items-center gap-[0.7rem] compact:mb-2 compact:text-xs',
  none: 'mb-3'
}
const toneClass = { red: 'text-archive-red', gold: 'text-archive-ochre' }
</script>

<template>
  <p class="[ eyebrow ] m-0 font-display text-eyebrow font-medium tracking-[0.06em] uppercase" :class="[ornamentClass[props.ornament], toneClass[props.tone]]">
    <slot />
  </p>
</template>

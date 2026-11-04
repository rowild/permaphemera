<script setup lang="ts">
// The small capital heading above a group of cards or names (time groups, the records of a news
// article, the people on the organisations page). `muted` for a quieter group. Card groups add
// pl-1 (the card frame is inset); name lists do not.
const props = withDefaults(defineProps<{ tone?: 'red' | 'muted' }>(), { tone: 'red' })
</script>

<template>
  <h3 class="[ group-label ] m-0 mb-4 text-left font-display text-eyebrow font-medium tracking-widest uppercase compact:mb-3 compact:text-xs" :class="props.tone === 'red' ? 'text-archive-red' : 'text-archive-copy'">
    <slot />
  </h3>
</template>

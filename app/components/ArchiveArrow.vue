<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    direction?: 'left' | 'right' | 'up'
  }>(),
  {
    direction: 'right'
  }
)
</script>

<template>
  <svg
    class="archive-arrow"
    :class="`archive-arrow-${props.direction}`"
    viewBox="0 0 44 12"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 6H39" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" />
    <path d="M33.5 1.7L39.8 6L33.5 10.3" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    direction?: 'left' | 'right' | 'up' | 'down'
  }>(),
  {
    direction: 'right'
  }
)
</script>

<template>
  <svg
    class="[ archive-arrow ] archive-arrow inline-block h-[0.6rem] w-[2.1rem] flex-none overflow-visible stroke-current origin-center transition-transform duration-320 ease-archive-lift motion-reduce:transition-none"
    :class="[
      `archive-arrow-${props.direction}`,
      props.direction === 'left' ? 'rotate-180' : '',
      props.direction === 'up' ? 'w-10 -rotate-90' : '',
      props.direction === 'down' ? 'w-10 rotate-90' : ''
    ]"
    viewBox="0 0 44 12"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 6H39" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" />
    <path d="M33.5 1.7L39.8 6L33.5 10.3" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup lang="ts">
// The temple divider between sections. `spaced` adds its own top margin; off where the section
// above already ends with spacing (the gallery page).
const props = withDefaults(defineProps<{ spaced?: boolean }>(), { spaced: true })
</script>

<template>
  <img
    class="[ exhibitions-section-divider ] pointer-events-none mx-auto block w-[min(40rem,82vw)] opacity-72"
    :class="{ 'mt-[clamp(3.5rem,6vw,5.5rem)] compact:mt-6': props.spaced }"
    src="/media/svg/dividers/exhibitions-section-divider.svg"
    alt=""
    aria-hidden="true"
  >
</template>

<script setup lang="ts">
// The heading of a page section (default slot: the text, often with a red accent span). One line
// height per size: the one most sections already used (start page sections, detail pages).
// Spacing and width come from the page (class).
const props = withDefaults(defineProps<{ size?: 'md' | 'lg' | 'sm' }>(), { size: 'md' })

const sizeClass = {
  lg: 'text-h2-lg font-light leading-[0.98] compact:text-4xl',
  md: 'text-h2 font-normal leading-[0.98] compact:text-3xl',
  sm: 'pb-1 text-h3 font-normal leading-[1.12] compact:pb-0.5 compact:text-2xl compact:leading-tight'
}
</script>

<template>
  <h2 class="[ section-heading ] m-0 font-display" :class="sizeClass[props.size]">
    <slot />
  </h2>
</template>

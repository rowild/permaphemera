<script setup lang="ts">
// The title and intro of a page hero: index pages, text pages, the news overview. One type scale
// for all of them (owner decision B, 2026-11-04).
const props = withDefaults(defineProps<{
  titleId: string
  title: string
  accent?: string
  intro?: string
}>(), {
  accent: undefined,
  intro: undefined
})
</script>

<template>
  <h1 :id="props.titleId" class="m-0 max-w-232 font-display text-hero font-light leading-[0.92] tablet:text-h1-steep compact:text-5xl compact:leading-none">{{ props.title }} <span v-if="props.accent" class="text-archive-red">{{ props.accent }}</span></h1>
  <p v-if="props.intro" class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">{{ props.intro }}</p>
</template>

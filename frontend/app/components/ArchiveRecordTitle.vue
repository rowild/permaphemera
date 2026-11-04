<script setup lang="ts">
// The title of a gallery, organisation, person or sponsor page: the name, the town under it in
// red, and the lede.
const props = withDefaults(defineProps<{
  titleId: string
  title: string
  subtitle?: string
  lede?: string
}>(), {
  subtitle: undefined,
  lede: undefined
})
</script>

<template>
  <h1 :id="props.titleId" class="[ record-hero-title ] m-0 font-display text-hero font-light leading-[0.92] compact:text-5xl compact:leading-none">
    {{ props.title }}
    <span v-if="props.subtitle" class="mt-3 block max-w-116 text-city leading-[1.02] text-archive-red">{{ props.subtitle }}</span>
  </h1>
  <p v-if="props.lede" class="[ record-hero-lede ] my-0 mt-[1.6rem] mb-[1.85rem] max-w-136 text-lede leading-[1.42] text-archive-body compact:mt-4 compact:mb-4 compact:text-base compact:leading-normal">{{ props.lede }}</p>
</template>

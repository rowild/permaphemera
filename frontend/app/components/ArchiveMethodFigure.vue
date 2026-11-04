<script setup lang="ts">
// The method picture (a tour as connected viewpoints) with its label and caption, on the about
// and how-it-works pages; first above the heading on tablets.
const props = defineProps<{
  alt: string
  label: string
  caption: string
}>()
</script>

<template>
  <figure class="[ method-figure ] relative m-0 tablet:row-start-1">
    <img
      class="block h-auto w-full object-contain filter-[drop-shadow(0_1.15rem_1.25rem_rgba(69,46,24,0.2))]"
      src="/media/images/landing/method/archive-method-composition.png"
      :alt="props.alt"
    >
    <figcaption class="mt-3 ml-[clamp(1rem,4vw,3.5rem)] flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-sm text-archive-muted compact:mt-2 compact:ml-2 compact:text-xs">
      <span class="tracking-widest text-archive-red uppercase">{{ props.label }}</span>
      {{ props.caption }}
    </figcaption>
  </figure>
</template>

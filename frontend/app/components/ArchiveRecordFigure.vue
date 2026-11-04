<script setup lang="ts">
// The framed picture of a gallery, organisation or person page with its "Abb. I" caption. The
// page sets the figure's spacing and grid place (class) and the picture's ratio (imageClass).
const props = withDefaults(defineProps<{
  src: string
  alt: string
  caption?: string
  imageClass?: string | string[] | Record<string, boolean>
}>(), {
  caption: undefined,
  imageClass: undefined
})
</script>

<template>
  <figure class="[ record-figure ] archive-venue-hero-artwork relative m-0 pt-[1.1rem] pr-4 pl-0 compact:mx-[-0.45rem] compact:pr-0">
    <ArchiveFramedImage class="rotate-[0.65deg] compact:rotate-0" :class="props.imageClass" :src="props.src" :alt="props.alt" />
    <figcaption v-if="props.caption" class="mt-[0.9rem] mr-0 mb-0 ml-[1.4rem] flex items-center gap-[0.65rem] text-sm text-archive-muted italic">
      <span class="shrink-0 whitespace-nowrap not-italic tracking-[0.08em] text-archive-red uppercase">{{ $t('venue.figure') }}</span>
      {{ props.caption }}
    </figcaption>
  </figure>
</template>

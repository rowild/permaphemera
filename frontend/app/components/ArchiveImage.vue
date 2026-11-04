<script setup lang="ts">
import { directusImageSet } from '~/utils/archiveAsset'

// Every Directus image of the site: Directus delivers it in the width steps of archiveAsset.ts,
// as WebP, and the browser picks the one the layout needs from `sizes` (plain CSS sizes). The
// site's own files under /media stay as they are.
const props = withDefaults(defineProps<{
  src: string
  alt: string
  /** The width of the image in the layout, CSS syntax: "(max-width: 767px) 100vw, 33vw". */
  sizes: string
  /** The image at the top of a page: load at once. */
  eager?: boolean
}>(), {
  eager: false
})

const image = computed(() => directusImageSet(props.src))
</script>

<template>
  <img :src="image.src" :srcset="image.srcset" :sizes="image.srcset ? props.sizes : undefined" :alt="props.alt" :loading="props.eager ? 'eager' : 'lazy'">
</template>

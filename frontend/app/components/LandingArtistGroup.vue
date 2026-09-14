<script setup lang="ts">
import type { DirectoryArtist } from '~/types/content'

const props = defineProps<{
  letter: string
  artists: DirectoryArtist[]
  openArtistSlug: string
}>()

const emit = defineEmits<{
  toggle: [slug: string]
  close: []
}>()
</script>

<template>
  <section class="[ artist-group ] mb-6 break-inside-avoid compact:mb-4">
    <h3 class="[ artist-group-heading ] archive-artist-group-heading mb-3 flex items-center gap-[0.8rem] font-display text-title leading-[1.08] font-medium text-archive-red compact:mb-1 compact:gap-2 compact:text-lg">{{ props.letter }}</h3>
    <ArtistDirectoryEntry
      v-for="artist in props.artists"
      :key="artist.id"
      :artist="artist"
      :open="props.openArtistSlug === artist.slug"
      @toggle="emit('toggle', artist.slug)"
      @close="emit('close')"
    />
  </section>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { DirectoryArtist } from '~/types/content'

// One letter group of artists (start page and artists page): the letter, its artists, and with
// `more` a link to the whole letter.
const props = withDefaults(defineProps<{
  letter: string
  artists: DirectoryArtist[]
  openArtistSlug: string
  more?: { count: number, to: RouteLocationRaw }
}>(), {
  more: undefined
})

const emit = defineEmits<{
  toggle: [slug: string]
  close: []
}>()
</script>

<template>
  <section class="[ artist-directory-group ] mb-8 break-inside-avoid compact:mb-4">
    <h3 class="[ artist-group-heading ] archive-artist-group-heading mb-3 flex items-center gap-[0.8rem] font-display text-title leading-[1.08] font-medium text-archive-red compact:mb-1 compact:gap-2 compact:text-lg">{{ props.letter }}</h3>
    <ArtistDirectoryEntry
      v-for="artist in props.artists"
      :key="artist.id"
      :artist="artist"
      :open="props.openArtistSlug === artist.slug"
      @toggle="emit('toggle', artist.slug)"
      @close="emit('close')"
    />
    <ArchiveTextLink v-if="props.more" class="mt-1 text-eyebrow compact:text-xs" :to="props.more.to">
      {{ $t('artists.showMoreUnder', { count: props.more.count, letter: props.letter }) }}
    </ArchiveTextLink>
  </section>
</template>

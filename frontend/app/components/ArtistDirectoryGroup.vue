<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { DirectoryArtist } from '~/types/content'

const props = defineProps<{
  group: {
    letter: string
    artists: DirectoryArtist[]
    total: number
    hasMore: boolean
  }
  openArtistSlug: string
  previewLimit: number
  showMoreTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  toggle: [slug: string]
  close: []
}>()
const { t } = useI18n()
</script>

<template>
  <section class="[ artist-directory-group ] mb-8 break-inside-avoid compact:mb-4">
    <h3 class="[ artist-group-heading ] archive-artist-group-heading mb-3 flex items-center gap-[0.8rem] font-display text-title leading-[1.08] font-medium text-archive-red compact:mb-1 compact:gap-2 compact:text-lg">{{ props.group.letter }}</h3>
    <ArtistDirectoryEntry
      v-for="artist in props.group.artists"
      :key="artist.id"
      :artist="artist"
      :open="props.openArtistSlug === artist.slug"
      @toggle="emit('toggle', artist.slug)"
      @close="emit('close')"
    />
    <ArchiveTextLink
      v-if="props.group.hasMore"
      class="mt-1 text-eyebrow compact:text-xs"
      :to="props.showMoreTo"
    >
      {{ t('artists.showMoreUnder', { count: props.group.total - props.previewLimit, letter: props.group.letter }) }}
    </ArchiveTextLink>
  </section>
</template>

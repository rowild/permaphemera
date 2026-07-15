<script setup lang="ts">
import type { Artist, ArtistRecordLink, DirectoryArtist } from '~/types/content'
import { formatArtistName } from '~/utils/artistNames'

const props = defineProps<{
  artist: Artist
  open: boolean
}>()

const emit = defineEmits<{
  toggle: []
  close: []
}>()

const nameButtonRef = ref<HTMLButtonElement | null>(null)
const infoButtonRef = ref<HTMLButtonElement | null>(null)
const wasOpen = ref(props.open)
const lastTrigger = ref<'name' | 'info'>('info')

const isDirectoryArtist = (artist: Artist): artist is DirectoryArtist => 'displayName' in artist && 'records' in artist

const displayName = computed(() => isDirectoryArtist(props.artist)
  ? props.artist.displayName
  : formatArtistName(props.artist.name, props.artist.slug))

const records = computed<ArtistRecordLink[]>(() => isDirectoryArtist(props.artist)
  ? props.artist.records
  : [])

const modalId = computed(() => `artist-exhibitions-${props.artist.slug}`)

const requestToggle = (trigger: 'name' | 'info') => {
  lastTrigger.value = trigger
  emit('toggle')
}

watch(() => props.open, async (open) => {
  if (!open && wasOpen.value) {
    await nextTick()
    const trigger = lastTrigger.value === 'name' ? nameButtonRef.value : infoButtonRef.value
    trigger?.focus()
  }
  wasOpen.value = open
})
</script>

<template>
  <article
    :id="`artist-${props.artist.slug}`"
    class="[ artist-directory-entry ] relative mb-1 break-inside-avoid compact:mb-0"
  >
    <div class="[ artist-directory-row ] flex min-h-11 items-center justify-between gap-4 compact:min-h-8 compact:gap-1">
      <button
        v-if="records.length"
        ref="nameButtonRef"
        class="[ artist-name-button ] archive-navigation-link relative cursor-pointer appearance-none border-0 bg-transparent p-0 text-left font-display text-[1.28rem] leading-tight text-archive-ink no-underline transition-colors duration-150 ease-out hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red compact:text-base"
        type="button"
        :aria-label="$t('artists.openFor', { name: props.artist.name })"
        :aria-controls="modalId"
        :aria-expanded="props.open"
        aria-haspopup="dialog"
        @click="requestToggle('name')"
      >
        {{ displayName }}
      </button>
      <span
        v-else
        class="[ artist-name ] font-display text-[1.28rem] leading-tight text-archive-muted opacity-60 compact:text-base"
      >
        {{ displayName }}
      </span>
      <button
        v-if="records.length"
        ref="infoButtonRef"
        class="[ artist-info-button ] group grid size-10 shrink-0 place-items-center border-0 bg-transparent p-0 text-archive-ink/50 transition-colors duration-150 hover:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red compact:size-8"
        type="button"
        :aria-label="$t(props.open ? 'artists.closeFor' : 'artists.openFor', { name: props.artist.name })"
        :aria-controls="modalId"
        :aria-expanded="props.open"
        aria-haspopup="dialog"
        @click="requestToggle('info')"
      >
        <span class="grid size-7 -rotate-3 place-items-center font-display text-lg leading-none italic transition-transform duration-150 group-hover:rotate-0 group-aria-expanded:rotate-0 compact:size-5 compact:text-sm" aria-hidden="true">i</span>
      </button>
    </div>

    <ArtistExhibitionModal
      v-if="records.length"
      :artist="props.artist"
      :display-name="displayName"
      :records="records"
      :open="props.open"
      :modal-id="modalId"
      @close="emit('close')"
    />
  </article>
</template>

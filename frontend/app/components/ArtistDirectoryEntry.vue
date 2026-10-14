<script setup lang="ts">
import type { DirectoryArtist } from '~/types/content'

const props = defineProps<{
  artist: DirectoryArtist
  open: boolean
}>()

const emit = defineEmits<{
  toggle: []
  close: []
}>()

const localePath = useLocalePath()
const infoButtonRef = ref<HTMLButtonElement | null>(null)
const wasOpen = ref(props.open)

// `artist` is always a DirectoryArtist here — both call sites
// (ArtistDirectoryGroup.vue, LandingArtistGroup.vue) only ever pass one.
// The old `isDirectoryArtist` guard existed for a wider `Artist` union type
// that no longer exists post-flip; its "else" branch is now unreachable
// (typing to `never`), so it's removed rather than left as dead code.
const displayName = computed(() => props.artist.displayName)

const records = computed(() => props.artist.records)

const modalId = computed(() => `artist-exhibitions-${props.artist.slug}`)

// Only the info button opens the window now, so focus always returns there.
watch(() => props.open, async (open) => {
  if (!open && wasOpen.value) {
    await nextTick()
    infoButtonRef.value?.focus()
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
      <NuxtLink
        class="[ artist-name-link ] archive-navigation-link relative text-left font-display text-xl leading-tight no-underline transition-colors duration-150 ease-out hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red compact:text-base"
        :class="records.length ? 'text-archive-ink' : 'text-archive-muted opacity-60'"
        :to="localePath(`/persons/${props.artist.slug}/`)"
      >
        {{ displayName }}
      </NuxtLink>
      <button
        v-if="records.length"
        ref="infoButtonRef"
        class="[ artist-info-button ] group grid size-10 shrink-0 place-items-center border-0 bg-transparent p-0 text-archive-ink/50 transition-colors duration-150 hover:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red compact:size-8"
        type="button"
        :aria-label="$t(props.open ? 'artists.closeFor' : 'artists.openFor', { name: props.artist.name })"
        :aria-controls="modalId"
        :aria-expanded="props.open"
        aria-haspopup="dialog"
        @click="emit('toggle')"
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

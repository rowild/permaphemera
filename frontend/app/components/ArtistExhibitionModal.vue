<script setup lang="ts">
import type { ArtistRecordLink, DirectoryArtist } from '~/types/content'

const props = defineProps<{
  artist: DirectoryArtist
  displayName: string
  records: ArtistRecordLink[]
  open: boolean
  modalId: string
}>()

const emit = defineEmits<{
  close: []
}>()
const localePath = useLocalePath()

const requestClose = () => emit('close')
</script>

<template>
  <ArchiveModal
    :open="props.open && props.records.length > 0"
    :panel-id="props.modalId"
    :labelledby="`${props.modalId}-title`"
    :close-label="$t('artists.closeFor', { name: props.artist.name })"
    panel-class="[ artist-exhibition-modal ] max-w-2xl px-[clamp(1.5rem,4vw,3rem)] py-[clamp(1.5rem,4vw,2.75rem)] compact:px-4 compact:py-4"
    @close="requestClose"
  >
    <header class="pr-12 compact:pr-9">
      <ArchiveEyebrow ornament="section">{{ $t('artists.linkedExhibitions') }}</ArchiveEyebrow>
      <h2 :id="`${props.modalId}-title`" class="m-0 font-display text-h2-steep font-normal leading-none compact:text-3xl">
        <NuxtLink class="text-archive-ink no-underline hover:text-archive-red focus-visible:text-archive-red" :to="localePath(`/persons/${props.artist.slug}/`)">{{ props.displayName }}</NuxtLink>
      </h2>
      <p v-if="props.artist.link" class="[ artist-external-link ] mt-2 mb-0 text-button compact:text-sm">
        <ArchiveTextLink :href="props.artist.link.url" target="_blank" rel="noreferrer">{{ props.artist.link.label }}</ArchiveTextLink>
      </p>
      <p v-if="props.artist.memberships.length" class="[ artist-memberships ] mt-3 mb-0 text-button text-archive-red compact:text-sm">
        <template v-for="(membership, index) in props.artist.memberships" :key="membership.slug">
          <template v-if="index"> · </template><template v-if="membership.function">{{ membership.function }}, </template><ArchiveTextLink :to="localePath(`/organisations/${membership.slug}/`)">{{ membership.title }}</ArchiveTextLink>
        </template>
      </p>
      <p v-if="props.artist.location || props.artist.years" class="mt-3 mb-0 text-sm text-archive-muted">
        {{ [props.artist.location, props.artist.years].filter(Boolean).join(' · ') }}
      </p>
    </header>

    <div class="[ artist-exhibition-modal-actions ] mt-8 grid max-h-96 gap-3 overflow-y-auto overscroll-contain pr-1 compact:mt-5 compact:gap-2">
      <ArchiveButton
        v-for="record in props.records"
        :key="record.id"
        :to="localePath(record.href)"
        class="w-full justify-between text-left"
        @click="requestClose"
      >
        <span class="min-w-0">
          <span class="block text-button leading-tight compact:text-sm">{{ record.title }}</span>
          <span class="mt-1 block text-xs tracking-wide text-archive-light-ink/75">{{ [record.venue, record.city].filter(Boolean).join(' · ') }}</span>
        </span>
        <ArchiveArrow class="ml-auto shrink-0" />
      </ArchiveButton>
    </div>
  </ArchiveModal>
</template>

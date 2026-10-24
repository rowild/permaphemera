<script setup lang="ts">
import type { ResolvedSponsor } from '~/utils/resolveSponsors'

// One row of the sponsor list on the organisations page.
const props = defineProps<{
  sponsor: ResolvedSponsor
}>()
const localePath = useLocalePath()

const supported = computed(() => props.sponsor.exhibitions.length + props.sponsor.venues.length + props.sponsor.persons.length + props.sponsor.towns.length)
</script>

<template>
  <ArchiveDirectoryRow
    :to="localePath(`/sponsors/${props.sponsor.slug}/`)"
    :link-label="$t('sponsorPages.openFor', { name: props.sponsor.title })"
    :meta="$t('sponsorPages.eyebrow')"
    :title="props.sponsor.title"
    :lede="props.sponsor.description"
    :note="$t('sponsorPages.supportsCount', supported)"
    :action="$t('sponsorPages.open')"
  />
</template>

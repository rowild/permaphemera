<script setup lang="ts">
import type { ResolvedEvent } from '~/utils/resolveEvents'

// One row of the event index (and of a news article's linked events): kind and place, the name
// as written in Directus, the lede, and how many editions and exhibitions are in the archive.
const props = defineProps<{
  event: ResolvedEvent
}>()
const localePath = useLocalePath()
const { t } = useI18n()

const meta = computed(() => [t(`events.kinds.${props.event.kind}`, props.event.kind), props.event.city ?? t('events.acrossAustria')].join(' · '))
const note = computed(() => [
  t('events.editionCount', props.event.editions.length),
  t('events.exhibitionCount', props.event.exhibitionCount)
].join(' · '))
</script>

<template>
  <ArchiveDirectoryRow
    :to="localePath(`/events/${props.event.slug}/`)"
    :link-label="$t('events.openFor', { name: props.event.title })"
    :meta="meta"
    :title="props.event.title"
    :lede="props.event.lede"
    :note="note"
    :action="$t('events.open')"
  />
</template>

<script setup lang="ts">
import type { ResolvedOrganisation } from '~/utils/resolveOrganisations'

// One row of the organisation register. The title is the organisation's name
// exactly as written in Directus: never split, never inverted.
const props = defineProps<{
  organisation: ResolvedOrganisation
}>()
const localePath = useLocalePath()
const { t } = useI18n()

const kindLabel = computed(() => t(`organisations.kinds.${props.organisation.kind}`, props.organisation.kind))
const meta = computed(() => [kindLabel.value, props.organisation.city].filter(Boolean).join(' · '))
const note = computed(() => [
  t('organisations.recordCount', props.organisation.records.length),
  props.organisation.members.length ? t('organisations.memberCount', props.organisation.members.length) : ''
].filter(Boolean).join(' · '))
</script>

<template>
  <ArchiveDirectoryRow
    :to="localePath(`/organisations/${props.organisation.slug}/`)"
    :link-label="$t('organisations.openFor', { name: props.organisation.title })"
    :meta="meta"
    :title="props.organisation.title"
    :lede="props.organisation.lede"
    :note="note"
    :action="$t('organisations.open')"
  />
</template>

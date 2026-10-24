<script setup lang="ts">
import type { ResolvedPerson } from '~/utils/resolvePersons'

// One row of the people lists on the organisations page: the person's roles
// within the list, where they live, their exhibitions and groups.
const props = defineProps<{
  person: ResolvedPerson
  // The role slugs of the list the row sits in; only these are named.
  roles: readonly string[]
}>()
const localePath = useLocalePath()
const { t } = useI18n()

const meta = computed(() => [
  ...props.person.roles.filter((role) => props.roles.includes(role.slug)).map((role) => role.title),
  props.person.basedIn
].filter(Boolean).join(' · '))
// A board member may have no exhibition in the archive: then only the groups are named.
const recordCount = computed(() => new Set(props.person.records.map((record) => record.exhibition.id)).size)
const note = computed(() => [
  recordCount.value ? t('organisations.recordCount', recordCount.value) : '',
  ...props.person.memberships.map((membership) => membership.title)
].filter(Boolean).join(' · '))
</script>

<template>
  <ArchiveDirectoryRow
    :to="localePath(`/persons/${props.person.slug}/`)"
    :link-label="$t('persons.openFor', { name: props.person.name })"
    :meta="meta"
    :title="props.person.name"
    :lede="props.person.lede"
    :note="note"
    :action="$t('persons.open')"
    heading="h4"
  />
</template>

<script setup lang="ts">
import type { ResolvedOrganisation } from '~/utils/resolveOrganisations'

// One row of the organisation directory. The title is the organisation's name
// exactly as written in Directus: never split, never inverted.
const props = defineProps<{
  organisation: ResolvedOrganisation
}>()
const localePath = useLocalePath()
const { t } = useI18n()

const kindLabel = computed(() => t(`organisations.kinds.${props.organisation.kind}`, props.organisation.kind))
const meta = computed(() => [kindLabel.value, props.organisation.city].filter(Boolean).join(' · '))
</script>

<template>
  <article class="[ organisation-directory-entry ] border-b border-archive-rule-warm/22 py-6 compact:py-4">
    <NuxtLink
      class="[ organisation-entry-link ] group/organisation grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 text-inherit no-underline compact:grid-cols-1 compact:gap-2"
      :to="localePath(`/organisations/${props.organisation.slug}/`)"
      :aria-label="$t('organisations.openFor', { name: props.organisation.title })"
    >
      <div class="min-w-0">
        <p class="m-0 text-xs tracking-widest text-archive-red uppercase compact:text-3xs">{{ meta }}</p>
        <h3 class="[ organisation-entry-title ] mt-2 mb-0 font-display text-h3 font-normal leading-[1.15] text-archive-ink transition-colors duration-150 group-hover/organisation:text-archive-red group-focus-visible/organisation:text-archive-red compact:text-lg">{{ props.organisation.title }}</h3>
        <p v-if="props.organisation.lede" class="mt-2 mb-0 max-w-176 text-button leading-[1.55] text-archive-body compact:text-sm compact:leading-normal">{{ props.organisation.lede }}</p>
        <p class="mt-3 mb-0 text-sm text-archive-muted compact:text-xs">
          {{ $t('organisations.recordCount', props.organisation.records.length) }}
          <template v-if="props.organisation.members.length"> · {{ $t('organisations.memberCount', props.organisation.members.length) }}</template>
        </p>
      </div>
      <span class="[ organisation-entry-action ] mt-8 flex shrink-0 items-center gap-2 text-archive-red compact:mt-0 compact:text-sm">{{ $t('organisations.open') }} <ArchiveArrow class="w-6 compact:w-5" /></span>
    </NuxtLink>
  </article>
</template>

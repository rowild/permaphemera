<script setup lang="ts">
import { groupExhibitionsByTime, type ExhibitionTimeGroupId } from '~/utils/exhibitionSchedule'

// The whole page for one time group (/exhibitions/current|upcoming|past/): only that
// group's records, in the group's own order, cut into pages.
const props = defineProps<{
  group: ExhibitionTimeGroupId
}>()

// Overview page: galleries in Austria only (owner, 2026-11-09; shared/countries.mjs).
const { overviewExhibitions: venueExhibitions } = useArchiveData()
const archiveToday = useArchiveToday()
const { t } = useI18n()

const exhibitions = computed(() => groupExhibitionsByTime(venueExhibitions.value, archiveToday.value)[props.group])
const title = computed(() => t(`exhibitionsDirectory.groups.${props.group}.title`))

useNavActive('exhibitions')
usePageSeo(() => `/exhibitions/${props.group}/`)
</script>

<template>
  <div class="[ exhibition-group-page ]">

      <section class="[ exhibition-group ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(3rem,5vw,5rem)] compact:px-3 compact:py-4" aria-labelledby="exhibition-group-title">
        <header class="[ section-heading ] relative z-1 mb-8 compact:mb-5">
          <ArchiveBreadcrumb :items="[{ label: $t('exhibitionsDirectory.breadcrumb'), to: '/exhibitions/' }, { label: title }]" />
          <ArchiveEyebrow>{{ $t('exhibitionsDirectory.eyebrow') }}</ArchiveEyebrow>
          <h1 id="exhibition-group-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ title }}</h1>
          <p class="mt-[0.85rem] mb-0 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('exhibitionsDirectory.groupCount', exhibitions.length) }}</p>
        </header>

        <ArchiveEmptyState v-if="!exhibitions.length" class="[ exhibition-group-empty ]" :message="$t(`exhibitionsDirectory.groups.${props.group}.empty`)" :action-label="$t('exhibitionsDirectory.backToIndex')" to="/exhibitions/" />
        <ExhibitionPagedList v-else :exhibitions="exhibitions" anchor="exhibition-group-list" />
      </section>
  </div>
</template>

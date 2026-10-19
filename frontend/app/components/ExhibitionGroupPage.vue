<script setup lang="ts">
import { groupExhibitionsByTime, type ExhibitionTimeGroupId } from '~/utils/exhibitionSchedule'

// The whole page for one time group (/exhibitions/current|upcoming|past/): only that
// group's records, in the group's own order, cut into pages.
const props = defineProps<{
  group: ExhibitionTimeGroupId
}>()

const { venueExhibitions } = useArchiveData()
const archiveToday = useArchiveToday()
const { t } = useI18n()
const localePath = useLocalePath()

const exhibitions = computed(() => groupExhibitionsByTime(venueExhibitions.value, archiveToday.value)[props.group])
const title = computed(() => t(`exhibitionsDirectory.groups.${props.group}.title`))

useSeoMeta({
  title: () => t('exhibitionsDirectory.groupSeoTitle', { title: title.value }),
  description: () => t(`exhibitionsDirectory.groups.${props.group}.seoDescription`)
})
</script>

<template>
  <main class="[ site-shell ] [ exhibition-group-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="exhibitions" />

    <div id="main-content">
      <section class="[ exhibition-group ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-3 compact:py-6" aria-labelledby="exhibition-group-title">
        <header class="[ section-heading ] relative z-1 mb-8 compact:mb-5">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><ArchiveTextLink :to="localePath('/exhibitions/')">{{ $t('exhibitionsDirectory.breadcrumb') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ title }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('exhibitionsDirectory.indexEyebrow') }}</p>
          <h1 id="exhibition-group-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ title }}</h1>
          <p class="mt-[0.85rem] mb-0 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('exhibitionsDirectory.groupCount', exhibitions.length) }}</p>
        </header>

        <div v-if="!exhibitions.length" class="[ exhibition-group-empty ] border-y border-archive-rule-deep/24 py-16 text-center">
          <p class="m-0 text-title text-archive-ink">{{ $t(`exhibitionsDirectory.groups.${props.group}.empty`) }}</p>
          <ArchiveTextLink class="mt-4" :to="localePath('/exhibitions/')">{{ $t('exhibitionsDirectory.backToIndex') }}</ArchiveTextLink>
        </div>
        <ExhibitionPagedList v-else :exhibitions="exhibitions" anchor="exhibition-group-list" />
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

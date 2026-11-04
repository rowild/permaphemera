<script setup lang="ts">
// The events: festivals and museum nights with their editions and exhibitions
// (plans/2026-11-04__events-collection.md). Few records, so a list without a search.
const { events } = useArchiveData()
const { t } = useI18n()

const editionCount = computed(() => events.value.reduce((count, event) => count + event.editions.length, 0))
const exhibitionCount = computed(() => events.value.reduce((count, event) => count + event.exhibitionCount, 0))
const ledgerItems = computed(() => [
  { label: t('events.ledgerEvents'), value: events.value.length },
  { label: t('events.ledgerEditions'), value: editionCount.value },
  { label: t('events.ledgerExhibitions'), value: exhibitionCount.value }
])
// Mobile: the ledger's facts as one line in the eyebrow's place.
const eventFacts = computed(() => [t('events.eventCount', events.value.length), t('events.exhibitionCount', exhibitionCount.value)])

usePageSeo('/events/')
definePageMeta({ navActive: 'events' })
</script>

<template>
  <div class="[ events-page ]">

      <ArchiveDirectoryHero
        class="[ events-page-intro ]"
        title-id="events-page-title"
        :breadcrumb="$t('events.breadcrumb')"
        :eyebrow="$t('events.eyebrow')"
        :facts="eventFacts"
        :title="$t('events.title')"
        :accent="$t('events.accent')"
        :intro="$t('events.intro')"
        :ledger="ledgerItems"
      />

      <ArchiveInsetDivider class="mt-7 compact:mt-4" />

      <section class="[ event-directory ] [ section-band ] relative mx-auto max-w-band px-gutter pt-7 pb-[clamp(3rem,5vw,5rem)] compact:px-4 compact:pt-4 compact:pb-6" :aria-label="$t('events.directory')">
        <div class="[ event-directory-list ] max-w-232">
          <EventDirectoryEntry v-for="event in events" :key="event.id" :event="event" />
        </div>
      </section>
  </div>
</template>

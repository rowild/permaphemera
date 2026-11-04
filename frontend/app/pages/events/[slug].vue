<script setup lang="ts">
import { CalendarDays, ExternalLink, Landmark } from '@lucide/vue'
import { formatArchiveDate } from '~/utils/archiveDate'
import { linkLabel } from '~/utils/externalLinks'
import type { ResolvedEventEdition } from '~/utils/resolveEvents'

// An event (plans/2026-11-04__events-collection.md): who puts it on, its editions, and the
// exhibitions of each edition, newest first.
const { events, venueExhibitions } = useArchiveData()
const { t, locale } = useI18n()

const { slug, record: event } = useRecordBySlug(events, 'events.notFound')

const kindLabel = computed(() => t(`events.kinds.${event.value!.kind}`, event.value!.kind))
// The organisations behind the event, grouped by role, with the exhibition page's labels.
const organiserGroups = computed(() => (['organiser', 'presenter', 'cooperation', 'supporter'] as const)
  .map((role) => ({ role, organisations: event.value!.organisers.filter((organiser) => organiser.role === role) }))
  .filter((group) => group.organisations.length))

// "7. Ausgabe · 2026" without dates; with dates the date carries the year: "3. Oktober 2026",
// "7. Ausgabe · 15. Juni 2026 – 20. Juni 2026".
const editionLabel = (edition: ResolvedEventEdition) => {
  if (!edition.start_date) return edition.edition_number ? t('events.edition', { number: edition.edition_number, year: edition.year }) : t('events.editionYear', { year: edition.year })
  const from = formatArchiveDate(edition.start_date, locale.value)
  const to = edition.end_date && edition.end_date !== edition.start_date ? formatArchiveDate(edition.end_date, locale.value) : undefined
  const dates = to ? `${from} – ${to}` : from
  return edition.edition_number ? `${t('events.editionNumber', { number: edition.edition_number })} · ${dates}` : dates
}
const exhibitionsOf = (edition: ResolvedEventEdition) => venueExhibitions.value
  .filter((exhibition) => edition.exhibitionIds.includes(exhibition.id))
  .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.title.localeCompare(b.title))
  .map((exhibition) => ({ exhibition }))

usePageSeo(`/events/${slug}/`)
definePageMeta({ navActive: 'events' })
</script>

<template>
  <div v-if="event" class="[ event-page ]">

      <ArchiveRecordHero class="[ event-hero ]" title-id="event-title">
        <template #breadcrumb>
          <ArchiveBreadcrumb :items="[{ label: $t('events.breadcrumb'), to: '/events/' }, { label: event.title }]" />
        </template>
        <ArchiveEyebrow>{{ kindLabel }}</ArchiveEyebrow>
        <ArchiveRecordTitle title-id="event-title" :title="event.title" :subtitle="event.city ?? $t('events.acrossAustria')" :lede="event.lede ?? event.description ?? $t('events.fallbackLede', { kind: kindLabel })" />

        <dl class="[ event-facts ] m-0">
          <ArchiveMetadataRow v-for="group in organiserGroups" :key="group.role" :label="$t(`exhibition.organiserLabels.${group.role}`)" variant="venue">
            <template #icon><Landmark :size="18" aria-hidden="true" /></template>
            <ArchiveLinkList :items="group.organisations.map((organisation) => ({ label: organisation.title, to: `/organisations/${organisation.slug}/` }))" />
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="event.editions.length" :label="$t('events.editions')" variant="venue">
            <template #icon><CalendarDays :size="18" aria-hidden="true" /></template>
            <ArchiveLinkList :items="event.editions.map((edition) => ({ label: String(edition.year), href: `#event-edition-${edition.year}` }))" />
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="event.links.length" :label="$t('events.links', event.links.length)" variant="venue">
            <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
            <ArchiveLinkList :items="event.links.map((link) => ({ label: linkLabel(link), href: link.url }))" />
          </ArchiveMetadataRow>
        </dl>

        <template #aside>
          <div class="[ event-about ] relative z-1 tablet:row-start-2">
            <ArchiveRecordFigure v-if="event.image" class="[ event-figure ] mb-10 pb-6 compact:mb-6" image-class="[ event-image ] aspect-[1.28]" :src="event.image" :alt="event.image_alt ?? event.title" :caption="event.image_caption" />
            <ArchiveEyebrow>{{ $t('events.aboutEyebrow') }}</ArchiveEyebrow>
            <ArchiveRichText v-if="event.aboutHtml" :html="event.aboutHtml" />
            <p v-else-if="event.description" class="max-w-176 text-button leading-[1.58] text-archive-body compact:text-base compact:leading-normal">{{ event.description }}</p>
          </div>
        </template>
      </ArchiveRecordHero>

      <ArchiveExhibitionsDivider />

      <ArchiveRecordExhibitions
        v-for="edition in event.editions"
        :id="`event-edition-${edition.year}`"
        :key="edition.id"
        class="[ event-edition ] scroll-mt-24"
        :title-id="`event-edition-${edition.year}-title`"
        :eyebrow="editionLabel(edition)"
        :items="exhibitionsOf(edition)"
        :empty="$t('events.noExhibitions', { name: `${event.title} ${edition.year}` })"
      >
        {{ $t('events.exhibitionsTitle', { year: edition.year }) }}
      </ArchiveRecordExhibitions>
      <ArchiveRecordExhibitions v-if="!event.editions.length" class="[ event-edition ]" title-id="event-exhibitions-title" :eyebrow="$t('events.editions')" :items="[]" :empty="$t('events.noExhibitions', { name: event.title })" />
  </div>
</template>

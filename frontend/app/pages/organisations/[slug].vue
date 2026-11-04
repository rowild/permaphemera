<script setup lang="ts">
import { linkLabel } from '~/utils/externalLinks'
import { Building2, CalendarDays, CalendarRange, ExternalLink, MapPin, Users } from '@lucide/vue'

const { organisations, events } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()

const { slug, record: organisation } = useRecordBySlug(organisations, 'organisations.notFound')

const kindLabel = computed(() => t(`organisations.kinds.${organisation.value!.kind}`, organisation.value!.kind))
// Venues grouped by how the organisation relates to them: runs, seat, exhibits at.
const venueGroups = computed(() => (['runs', 'seat', 'exhibits_at'] as const)
  .map((relation) => ({ relation, venues: organisation.value!.venues.filter((venue) => venue.relation === relation) }))
  .filter((group) => group.venues.length))

// The events this organisation puts on, presents or supports (plans/2026-11-04__events-collection.md).
const organisationEvents = computed(() => events.value.filter((event) => event.organisers.some((organiser) => organiser.slug === organisation.value!.slug)))

usePageSeo(`/organisations/${slug}/`)
definePageMeta({ navActive: 'organisations' })
</script>

<template>
  <div v-if="organisation" class="[ organisation-page ]">

      <ArchiveRecordHero class="[ organisation-hero ]" title-id="organisation-title">
        <template #breadcrumb>
          <ArchiveBreadcrumb :items="[{ label: $t('organisations.breadcrumb'), to: '/organisations/' }, { label: organisation.title }]" />
        </template>
          <ArchiveEyebrow>{{ kindLabel }}</ArchiveEyebrow>
          <ArchiveRecordTitle title-id="organisation-title" :title="organisation.title" :subtitle="organisation.city" :lede="organisation.lede ?? organisation.description ?? $t('organisations.fallbackLede', { kind: kindLabel })" />

          <dl class="[ organisation-contact-list ] m-0">
            <ArchiveMetadataRow v-if="organisation.address" :label="$t('organisations.address')" variant="venue">
              <template #icon><MapPin :size="19" aria-hidden="true" /></template>
              {{ organisation.address }}
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="organisation.founded" :label="$t('organisations.founded')" variant="venue">
              <template #icon><CalendarDays :size="18" aria-hidden="true" /></template>
              {{ organisation.founded }}
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-for="group in venueGroups" :key="group.relation" :label="$t(`organisations.venueRelations.${group.relation}`)" variant="venue">
              <template #icon><Building2 :size="18" aria-hidden="true" /></template>
              <ArchiveLinkList :items="group.venues.map((venue) => ({ label: venue.name, to: `/venues/${venue.slug}/` }))" />
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="organisationEvents.length" :label="$t('events.organised')" variant="venue">
              <template #icon><CalendarRange :size="18" aria-hidden="true" /></template>
              <ArchiveLinkList :items="organisationEvents.map((event) => ({ label: event.title, to: `/events/${event.slug}/` }))" />
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="organisation.websites.length" :label="$t('organisations.links', organisation.websites.length)" variant="venue">
              <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
              <ArchiveLinkList :items="organisation.websites.map((link) => ({ label: linkLabel(link), href: link.url }))" />
            </ArchiveMetadataRow>
          </dl>

        <template #aside>
        <div class="[ organisation-about ] relative z-1 tablet:row-start-2">
          <ArchiveRecordFigure v-if="organisation.image" class="[ organisation-figure ] mb-10 pb-6 compact:mb-6" image-class="[ organisation-image ] aspect-[1.28]" :src="organisation.image" :alt="organisation.image_alt ?? organisation.title" :caption="organisation.image_caption" />
          <ArchiveEyebrow>{{ $t('organisations.aboutEyebrow') }}</ArchiveEyebrow>
          <ArchiveRichText v-if="organisation.aboutHtml" :html="organisation.aboutHtml" />
          <p v-else class="max-w-176 text-button leading-[1.58] text-archive-body compact:text-base compact:leading-normal">{{ organisation.description ?? $t('organisations.fallbackAbout', { name: organisation.title }) }}</p>

          <section v-if="organisation.members.length" class="[ organisation-members ] mt-10 compact:mt-6" aria-labelledby="organisation-members-title">
            <h2 id="organisation-members-title" class="m-0 mb-4 inline-flex items-center gap-3 font-display text-h3 font-normal leading-[1.15] compact:text-lg"><Users :size="20" aria-hidden="true" /> {{ $t('organisations.membersTitle', organisation.members.length) }}</h2>
            <ul class="[ organisation-member-list ] m-0 grid list-none grid-cols-2 gap-x-8 gap-y-3 p-0 compact:grid-cols-1">
              <li v-for="member in organisation.members" :key="member.id" class="[ organisation-member ] border-b border-archive-rule-warm/22 pb-3">
                <ArchiveTextLink class="font-display text-lg leading-tight compact:text-base" :to="localePath(`/persons/${member.slug}/`)">{{ member.name }}</ArchiveTextLink>
                <span v-if="member.function" class="block text-sm text-archive-red compact:text-xs">{{ member.function }}</span>
              </li>
            </ul>
          </section>
        </div>
        </template>
      </ArchiveRecordHero>

      <ArchiveExhibitionsDivider />

      <ArchiveRecordExhibitions
        class="[ organisation-records ]"
        title-id="organisation-records-title"
        :eyebrow="$t('organisations.recordsEyebrow')"
        :items="organisation.records.map((record) => ({ exhibition: record.exhibition, label: $t(`organisations.roles.${record.role}`), key: record.id }))"
        :empty="$t('organisations.noRecords', { name: organisation.title })"
      >
        {{ $t('organisations.recordsTitle', organisation.records.length) }} <span class="text-archive-red">{{ $t('organisations.recordsAccent') }}</span>
      </ArchiveRecordExhibitions>
  </div>
</template>

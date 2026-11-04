<script setup lang="ts">
import { linkLabel } from '~/utils/externalLinks'
import { Building2, CalendarDays, ExternalLink, MapPin, Users } from '@lucide/vue'

const { organisations } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()

const { slug, record: organisation } = useRecordBySlug(organisations, 'organisations.notFound')

const kindLabel = computed(() => t(`organisations.kinds.${organisation.value!.kind}`, organisation.value!.kind))
// Venues grouped by how the organisation relates to them: runs, seat, exhibits at.
const venueGroups = computed(() => (['runs', 'seat', 'exhibits_at'] as const)
  .map((relation) => ({ relation, venues: organisation.value!.venues.filter((venue) => venue.relation === relation) }))
  .filter((group) => group.venues.length))

usePageSeo(`/organisations/${slug}/`)
definePageMeta({ navActive: 'organisations' })
</script>

<template>
  <div v-if="organisation" class="[ organisation-page ]">

      <section class="[ organisation-hero ] [ section-band ] relative mx-auto grid max-w-band grid-cols-[minmax(22rem,0.9fr)_minmax(24rem,1.1fr)] items-start gap-[clamp(3rem,7vw,7rem)] px-gutter py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-6" aria-labelledby="organisation-title">
        <div class="[ organisation-hero-copy ] relative z-2">
          <ArchiveBreadcrumb :items="[{ label: $t('organisations.breadcrumb'), to: '/organisations/' }, { label: organisation.title }]" />
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
            <ArchiveMetadataRow v-if="organisation.websites.length" :label="$t('organisations.links', organisation.websites.length)" variant="venue">
              <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
              <ArchiveLinkList :items="organisation.websites.map((link) => ({ label: linkLabel(link), href: link.url }))" />
            </ArchiveMetadataRow>
          </dl>
        </div>

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
      </section>

      <ArchiveExhibitionsDivider />

      <section v-if="organisation.records.length" class="[ organisation-records ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5" aria-labelledby="organisation-records-title">
        <div class="[ section-heading ] mb-10 compact:mb-5">
          <ArchiveEyebrow ornament="section">{{ $t('organisations.recordsEyebrow') }}</ArchiveEyebrow>
          <ArchiveSectionHeading id="organisation-records-title" class="max-w-232">{{ $t('organisations.recordsTitle', organisation.records.length) }} <span class="text-archive-red">{{ $t('organisations.recordsAccent') }}</span></ArchiveSectionHeading>
        </div>
        <ExhibitionCardGrid class="[ organisation-records-grid ]" :items="organisation.records.map((record) => ({ exhibition: record.exhibition, label: $t(`organisations.roles.${record.role}`), key: record.id }))" />
      </section>
      <section v-else class="[ organisation-records-empty ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(2rem,4vw,4rem)] compact:px-4 compact:py-4">
        <p class="m-0 max-w-176 text-button text-archive-muted compact:text-sm">{{ $t('organisations.noRecords', { name: organisation.title }) }}</p>
      </section>
  </div>
</template>

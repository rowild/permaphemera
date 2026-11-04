<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import { hostnameOf } from '~/utils/externalLinks'

const { sponsorPages } = useArchiveData()

const { slug, record: sponsor } = useRecordBySlug(sponsorPages, 'sponsorPages.notFound')
const hasSupports = computed(() => Boolean(sponsor.value && (sponsor.value.exhibitions.length || sponsor.value.venues.length || sponsor.value.persons.length || sponsor.value.towns.length)))

usePageSeo(`/sponsors/${slug}/`)
</script>

<template>
  <div v-if="sponsor" class="[ sponsor-page ]">

      <section class="[ sponsor-hero ] [ section-band ] relative mx-auto grid max-w-band grid-cols-[minmax(22rem,0.9fr)_minmax(16rem,0.6fr)] items-start gap-[clamp(3rem,7vw,7rem)] px-gutter py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-6" aria-labelledby="sponsor-title">
        <div class="[ sponsor-hero-copy ] relative z-2">
          <ArchiveBreadcrumb :items="[{ label: sponsor.title }]" />
          <ArchiveEyebrow>{{ $t('sponsorPages.eyebrow') }}</ArchiveEyebrow>
          <ArchiveRecordTitle title-id="sponsor-title" :title="sponsor.title" :lede="sponsor.description" />
          <dl class="m-0">
            <ArchiveMetadataRow v-if="sponsor.website_url" :label="$t('sponsorPages.website')" variant="venue">
              <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
              <ArchiveTextLink :href="sponsor.website_url" target="_blank" rel="noreferrer" icon-motion="external">{{ hostnameOf(sponsor.website_url) }}</ArchiveTextLink>
            </ArchiveMetadataRow>
          </dl>
        </div>
        <div v-if="sponsor.logo" class="[ sponsor-logo ] grid place-items-center p-8 tablet:row-start-1 tablet:justify-items-start compact:p-0">
          <ArchiveImage class="max-h-48 w-auto max-w-full object-contain" :src="sponsor.logo" :alt="sponsor.title" sizes="(max-width: 767px) 80vw, 30rem" eager />
        </div>
      </section>

      <ArchiveExhibitionsDivider />

      <section class="[ sponsor-supports ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5" aria-labelledby="sponsor-supports-title">
        <h2 id="sponsor-supports-title" class="m-0 mb-3 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('sponsorPages.supportsTitle', { name: sponsor.title }) }}</h2>
        <p class="m-0 mb-8 max-w-176 text-button text-archive-muted compact:text-sm">{{ hasSupports ? $t('sponsorPages.supportsIntro', { name: sponsor.title }) : $t('sponsorPages.noSupports', { name: sponsor.title }) }}</p>
        <div v-if="sponsor.exhibitions.length" class="mb-10">
          <h3 class="m-0 mb-4 font-display text-h3 font-normal compact:text-lg">{{ $t('sponsorPages.exhibitions') }}</h3>
          <ExhibitionCardGrid :items="sponsor.exhibitions.map((exhibition) => ({ exhibition }))" />
        </div>
        <dl class="m-0 max-w-176">
          <ArchiveMetadataRow v-if="sponsor.venues.length" :label="$t('sponsorPages.galleries')" variant="venue">
            <ArchiveLinkList :items="sponsor.venues.map((venue) => ({ label: venue.name, to: `/venues/${venue.slug}/` }))" />
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="sponsor.persons.length" :label="$t('sponsorPages.persons')" variant="venue">
            <ArchiveLinkList :items="sponsor.persons.map((person) => ({ label: person.name, to: `/persons/${person.slug}/` }))" />
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="sponsor.towns.length" :label="$t('sponsorPages.towns')" variant="venue">
            {{ sponsor.towns.join(', ') }}
          </ArchiveMetadataRow>
        </dl>
      </section>
  </div>
</template>

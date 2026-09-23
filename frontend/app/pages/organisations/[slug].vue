<script setup lang="ts">
import { Building2, CalendarDays, ExternalLink, MapPin, Users } from '@lucide/vue'

const route = useRoute()
const { organisations } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()

const slug = String(route.params.slug ?? '')
const organisation = computed(() => organisations.value.find((item) => item.slug === slug))
if (!organisation.value) {
  throw createError({ statusCode: 404, statusMessage: t('organisations.notFound'), fatal: true })
}

const kindLabel = computed(() => t(`organisations.kinds.${organisation.value!.kind}`, organisation.value!.kind))
// Venues grouped by how the organisation relates to them: runs, seat, exhibits at.
const venueGroups = computed(() => (['runs', 'seat', 'exhibits_at'] as const)
  .map((relation) => ({ relation, venues: organisation.value!.venues.filter((venue) => venue.relation === relation) }))
  .filter((group) => group.venues.length))
const hostnameOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

useSeoMeta({
  title: () => `${organisation.value?.title} · PERMAPHEMERA`,
  description: () => organisation.value?.lede ?? organisation.value?.description ?? t('organisations.seoDescription', { count: organisations.value.length })
})
</script>

<template>
  <main v-if="organisation" class="[ site-shell ] [ organisation-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="organisations" />

    <div id="main-content">
      <section class="[ organisation-hero ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(22rem,0.9fr)_minmax(24rem,1.1fr)] items-start gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-10" aria-labelledby="organisation-title">
        <div class="[ organisation-hero-copy ] relative z-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/organisations/')">{{ $t('organisations.breadcrumb') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ organisation.title }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ kindLabel }}</p>
          <h1 id="organisation-title" class="[ organisation-hero-title ] m-0 font-display text-hero font-light leading-[0.92] compact:text-5xl compact:leading-none">
            {{ organisation.title }}
            <span v-if="organisation.city" class="mt-3 block max-w-116 text-city leading-[1.02] text-archive-red">{{ organisation.city }}</span>
          </h1>
          <p class="[ organisation-hero-lede ] my-0 mt-[1.6rem] mb-[1.85rem] max-w-136 text-lede leading-[1.42] text-archive-body compact:mt-4 compact:mb-4 compact:text-base compact:leading-normal">{{ organisation.lede ?? organisation.description ?? $t('organisations.fallbackLede', { kind: kindLabel }) }}</p>

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
              <template v-for="(venue, index) in group.venues" :key="venue.slug">
                <template v-if="index">, </template><ArchiveTextLink :to="localePath(`/venues/${venue.slug}/`)">{{ venue.name }}</ArchiveTextLink>
              </template>
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="organisation.websites.length" :label="$t('organisations.links', organisation.websites.length)" variant="venue">
              <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
              <template v-for="(link, index) in organisation.websites" :key="link.id">
                <template v-if="index">, </template><ArchiveTextLink :href="link.url" target="_blank" rel="noreferrer" icon-motion="external">{{ link.kind === 'website' ? hostnameOf(link.url) : link.title }}</ArchiveTextLink>
              </template>
            </ArchiveMetadataRow>
          </dl>
        </div>

        <div class="[ organisation-about ] relative z-1 tablet:row-start-2">
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('organisations.aboutEyebrow') }}</p>
          <p v-for="paragraph in organisation.about ?? [organisation.description ?? $t('organisations.fallbackAbout', { name: organisation.title })]" :key="paragraph" class="max-w-176 text-button leading-[1.58] text-archive-body compact:text-base compact:leading-normal">{{ paragraph }}</p>

          <section v-if="organisation.members.length" class="[ organisation-members ] mt-10 compact:mt-6" aria-labelledby="organisation-members-title">
            <h2 id="organisation-members-title" class="m-0 mb-4 inline-flex items-center gap-3 font-display text-h3 font-normal leading-[1.15] compact:text-lg"><Users :size="20" aria-hidden="true" /> {{ $t('organisations.membersTitle', organisation.members.length) }}</h2>
            <ul class="[ organisation-member-list ] m-0 grid list-none grid-cols-2 gap-x-8 gap-y-3 p-0 compact:grid-cols-1">
              <li v-for="member in organisation.members" :key="member.id" class="[ organisation-member ] border-b border-archive-rule-warm/22 pb-3">
                <span class="block font-display text-lg leading-tight text-archive-ink compact:text-base">{{ member.name }}</span>
                <span v-if="member.function" class="block text-sm text-archive-red compact:text-xs">{{ member.function }}</span>
              </li>
            </ul>
          </section>
        </div>
      </section>

      <ArchiveExhibitionsDivider />

      <section v-if="organisation.records.length" class="[ organisation-records ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-8" aria-labelledby="organisation-records-title">
        <div class="[ section-heading ] mb-10 compact:mb-5">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('organisations.recordsEyebrow') }}</p>
          <h2 id="organisation-records-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('organisations.recordsTitle', organisation.records.length) }} <span class="text-archive-red">{{ $t('organisations.recordsAccent') }}</span></h2>
        </div>
        <div class="[ organisation-records-grid ] grid grid-cols-3 gap-6 tablet:grid-cols-2 compact:grid-cols-1">
          <div v-for="record in organisation.records" :key="record.id" class="[ organisation-record ] grid gap-2">
            <p class="m-0 text-xs tracking-widest text-archive-muted uppercase compact:text-3xs">{{ $t(`organisations.roles.${record.role}`) }}</p>
            <ExhibitionCard :exhibition="record.exhibition" />
          </div>
        </div>
      </section>
      <section v-else class="[ organisation-records-empty ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(2rem,4vw,4rem)] compact:px-4 compact:py-6">
        <p class="m-0 max-w-176 text-button text-archive-muted compact:text-sm">{{ $t('organisations.noRecords', { name: organisation.title }) }}</p>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

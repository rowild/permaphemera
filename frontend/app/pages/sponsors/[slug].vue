<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import { hostnameOf } from '~/utils/externalLinks'

const route = useRoute()
const { sponsorPages } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()

const slug = String(route.params.slug ?? '')
const sponsor = computed(() => sponsorPages.value.find((item) => item.slug === slug))
if (!sponsor.value) {
  throw createError({ statusCode: 404, statusMessage: t('sponsorPages.notFound'), fatal: true })
}
const hasSupports = computed(() => Boolean(sponsor.value && (sponsor.value.exhibitions.length || sponsor.value.venues.length || sponsor.value.persons.length || sponsor.value.towns.length)))

useSeoMeta({
  title: () => `${sponsor.value?.title} · ${t('sponsorPages.eyebrow')} · PERMAPHEMERA`,
  description: () => sponsor.value?.description ?? t('sponsorPages.seoDescription', { name: sponsor.value?.title })
})
</script>

<template>
  <main v-if="sponsor" class="[ site-shell ] [ sponsor-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader />

    <div id="main-content">
      <section class="[ sponsor-hero ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(22rem,0.9fr)_minmax(16rem,0.6fr)] items-start gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-6" aria-labelledby="sponsor-title">
        <div class="[ sponsor-hero-copy ] relative z-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ sponsor.title }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('sponsorPages.eyebrow') }}</p>
          <h1 id="sponsor-title" class="m-0 font-display text-hero font-light leading-[0.92] compact:text-5xl compact:leading-none">{{ sponsor.title }}</h1>
          <p v-if="sponsor.description" class="my-0 mt-[1.6rem] mb-[1.85rem] max-w-136 text-lede leading-[1.42] text-archive-body compact:mt-4 compact:mb-4 compact:text-base compact:leading-normal">{{ sponsor.description }}</p>
          <dl class="m-0">
            <ArchiveMetadataRow v-if="sponsor.website_url" :label="$t('sponsorPages.website')" variant="venue">
              <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
              <ArchiveTextLink :href="sponsor.website_url" target="_blank" rel="noreferrer" icon-motion="external">{{ hostnameOf(sponsor.website_url) }}</ArchiveTextLink>
            </ArchiveMetadataRow>
          </dl>
        </div>
        <div v-if="sponsor.logo" class="[ sponsor-logo ] grid place-items-center p-8 tablet:row-start-1 tablet:justify-items-start compact:p-0">
          <img class="max-h-48 w-auto max-w-full object-contain" :src="sponsor.logo" :alt="sponsor.title">
        </div>
      </section>

      <ArchiveExhibitionsDivider />

      <section class="[ sponsor-supports ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5" aria-labelledby="sponsor-supports-title">
        <h2 id="sponsor-supports-title" class="m-0 mb-3 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('sponsorPages.supportsTitle', { name: sponsor.title }) }}</h2>
        <p class="m-0 mb-8 max-w-176 text-button text-archive-muted compact:text-sm">{{ hasSupports ? $t('sponsorPages.supportsIntro', { name: sponsor.title }) : $t('sponsorPages.noSupports', { name: sponsor.title }) }}</p>
        <div v-if="sponsor.exhibitions.length" class="mb-10">
          <h3 class="m-0 mb-4 font-display text-h3 font-normal compact:text-lg">{{ $t('sponsorPages.exhibitions') }}</h3>
          <div class="grid grid-cols-3 gap-6 tablet:grid-cols-2 compact:grid-cols-1">
            <ExhibitionCard v-for="exhibition in sponsor.exhibitions" :key="exhibition.id" :exhibition="exhibition" />
          </div>
        </div>
        <dl class="m-0 max-w-176">
          <ArchiveMetadataRow v-if="sponsor.venues.length" :label="$t('sponsorPages.galleries')" variant="venue">
            <template v-for="(venue, index) in sponsor.venues" :key="venue.slug"><template v-if="index">, </template><ArchiveTextLink :to="localePath(`/venues/${venue.slug}/`)">{{ venue.name }}</ArchiveTextLink></template>
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="sponsor.persons.length" :label="$t('sponsorPages.persons')" variant="venue">
            <template v-for="(person, index) in sponsor.persons" :key="person.slug"><template v-if="index">, </template><ArchiveTextLink :to="localePath(`/persons/${person.slug}/`)">{{ person.name }}</ArchiveTextLink></template>
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="sponsor.towns.length" :label="$t('sponsorPages.towns')" variant="venue">
            {{ sponsor.towns.join(', ') }}
          </ArchiveMetadataRow>
        </dl>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

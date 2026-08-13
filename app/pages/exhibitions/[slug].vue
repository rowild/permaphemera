<script setup lang="ts">
import { CalendarDays, Clock3, FileText, MapPin } from '@lucide/vue'

const route = useRoute()
const { venues, venueExhibitions } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()
const routeSlug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
const exhibition = computed(() => venueExhibitions.value.find((item) => item.slug === routeSlug))

if (!exhibition.value) {
  throw createError({ statusCode: 404, statusMessage: t('exhibition.notFound') })
}

const gallery = computed(() => venues.value.find((item) => item.slug === exhibition.value?.venue_slug))
const relatedExhibitions = computed(() => venueExhibitions.value
  .filter((item) => item.slug !== exhibition.value?.slug)
  .sort((left, right) => Number(right.venue_slug === exhibition.value?.venue_slug) - Number(left.venue_slug === exhibition.value?.venue_slug))
  .slice(0, 3))
const recordNumber = computed(() => {
  const index = venueExhibitions.value.findIndex((item) => item.id === exhibition.value?.id)
  return String(Math.max(0, index) + 1).padStart(2, '0')
})
const galleryPath = computed(() => localePath(`/venues/${exhibition.value?.venue_slug}/`))

useSeoMeta({
  title: () => `${exhibition.value?.title} · ${exhibition.value?.artist} · PERMAPHEMERA`,
  description: () => exhibition.value?.summary
})
</script>

<template>
  <main class="[ site-shell ] [ exhibition-detail-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="exhibitions" />

    <div id="main-content">
      <section class="[ exhibition-detail-hero ] [ section-band ] relative mx-auto grid min-h-[calc(100vh-6.4rem)] max-w-[105rem] grid-cols-[minmax(30rem,1.2fr)_minmax(23rem,0.8fr)] items-center gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:min-h-auto tablet:grid-cols-1 tablet:gap-10 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-16" aria-labelledby="exhibition-title">
        <div class="[ exhibition-detail-visual ] min-w-0 tablet:row-start-1">
          <div class="relative">
            <ArchiveFramedImage
              class="[ exhibition-detail-image ] aspect-[1.48] rotate-[-0.45deg] compact:aspect-[1.28] compact:rotate-0"
              :src="exhibition.image"
              :alt="exhibition.image_alt"
            />
            <div class="absolute -right-4 -bottom-5 z-6 grid size-28 -rotate-6 place-content-center rounded-full border border-archive-red/42 bg-archive-paper/92 text-center text-archive-red compact:-right-1 compact:-bottom-3 compact:size-20" aria-hidden="true">
              <span class="text-xs tracking-widest uppercase">EX</span>
              <strong class="text-4xl leading-none font-light compact:text-3xl">{{ recordNumber }}</strong>
            </div>
          </div>
          <p class="[ exhibition-detail-caption ] mt-[0.9rem] mr-0 mb-0 ml-[1.4rem] flex items-center gap-[0.65rem] text-sm text-archive-muted italic compact:mt-2 compact:ml-2 compact:text-xs"><span class="not-italic tracking-[0.08em] text-archive-red uppercase">{{ $t('exhibition.preservedRecord') }}</span> · {{ $t('exhibition.season') }}</p>
        </div>

        <div class="[ exhibition-detail-copy ] tablet:row-start-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/exhibitions/')">{{ $t('navigation.exhibitions') }}</ArchiveTextLink><span aria-hidden="true">/</span><ArchiveTextLink :to="galleryPath">{{ gallery?.name ?? exhibition.venue }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ exhibition.title }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('exhibition.recordEyebrow') }}</p>
          <h1 id="exhibition-title" class="m-0 font-display text-h1 font-light leading-[0.92] text-archive-red compact:text-5xl compact:leading-none">{{ exhibition.title }}</h1>
          <p class="[ exhibition-detail-artist ] mt-[0.8rem] mb-[1.4rem] text-title text-archive-ink compact:mt-2 compact:mb-3 compact:text-lg">{{ exhibition.artist }}</p>
          <p class="[ exhibition-detail-summary ] max-w-xl text-lg leading-[1.52] text-archive-body compact:text-base compact:leading-normal">{{ exhibition.summary }}</p>

          <dl class="[ exhibition-detail-meta ] m-0 mt-[1.8rem] border-t border-archive-rule-warm/24 compact:mt-4">
            <ArchiveMetadataRow :label="$t('exhibition.location')" variant="exhibition">
              <template #icon><MapPin :size="18" aria-hidden="true" /></template>
              {{ exhibition.venue }}, {{ exhibition.city }}
            </ArchiveMetadataRow>
            <ArchiveMetadataRow :label="$t('exhibition.dates')" variant="exhibition">
              <template #icon><CalendarDays :size="18" aria-hidden="true" /></template>
              {{ exhibition.date_range }}
            </ArchiveMetadataRow>
            <ArchiveMetadataRow :label="$t('exhibition.openingHours')" variant="exhibition">
              <template #icon><Clock3 :size="18" aria-hidden="true" /></template>
              {{ exhibition.opening_hours }}
            </ArchiveMetadataRow>
          </dl>

          <div class="[ exhibition-detail-actions ] mt-8 flex flex-wrap items-center gap-[1.2rem] compact:mt-5 compact:flex-nowrap compact:gap-3">
            <ArchiveButton class="compact:flex-1" variant="secondary" :href="exhibition.source_pdf" target="_blank" rel="noreferrer">
              <FileText :size="20" aria-hidden="true" /> <span class="compact:hidden">{{ $t('exhibition.viewOriginal') }} </span>{{ $t('exhibition.invitation') }}
            </ArchiveButton>
            <ArchiveTextLink class="[ exhibition-back-link ] compact:min-h-11" :to="galleryPath" icon-position="start" icon-motion="left">
              {{ $t('exhibition.backToGallery', { name: gallery?.name ?? exhibition.venue }) }}
              <template #icon><ArchiveArrow direction="left" /></template>
            </ArchiveTextLink>
          </div>
        </div>

        <ArchiveScrollCue target="#about-exhibition" :label="$t('exhibition.continue')" />
      </section>

      <section id="about-exhibition" class="[ exhibition-detail-body ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(30rem,1.2fr)_minmax(23rem,0.8fr)] gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-5 compact:px-4 compact:py-8" aria-labelledby="about-exhibition-title">
        <div class="[ exhibition-detail-prose ]">
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('exhibition.aboutEyebrow') }}</p>
          <h2 id="about-exhibition-title" class="m-0 text-h2-lg font-light leading-[0.98] compact:text-4xl">{{ $t('exhibition.aboutTitle') }} <span class="text-archive-red">{{ $t('exhibition.aboutAccent') }}</span></h2>
          <p class="max-w-3xl text-lg leading-[1.65] text-archive-body compact:text-base compact:leading-normal">{{ exhibition.description || exhibition.summary }}</p>
        </div>
        <dl class="[ exhibition-detail-ledger ] m-0 self-start border-t border-archive-red/42 *:border-b *:border-archive-rule-deep/22 *:py-[0.9rem] compact:grid compact:grid-cols-2 compact:gap-x-4 compact:*:py-2">
          <div><dt class="text-xs leading-normal tracking-[0.08em] text-archive-red uppercase compact:text-2xs">{{ $t('exhibition.artistParticipants') }}</dt><dd class="mt-[0.18rem] mb-0 text-button compact:text-sm">{{ exhibition.artist }}</dd></div>
          <div v-if="exhibition.medium"><dt class="text-xs leading-normal tracking-[0.08em] text-archive-red uppercase compact:text-2xs">{{ $t('exhibition.form') }}</dt><dd class="mt-[0.18rem] mb-0 text-button compact:text-sm">{{ exhibition.medium }}</dd></div>
          <div><dt class="text-xs leading-normal tracking-[0.08em] text-archive-red uppercase compact:text-2xs">{{ $t('exhibition.opening') }}</dt><dd class="mt-[0.18rem] mb-0 text-button compact:text-sm">{{ exhibition.vernissage }}</dd></div>
          <div><dt class="text-xs leading-normal tracking-[0.08em] text-archive-red uppercase compact:text-2xs">{{ $t('exhibition.admission') }}</dt><dd class="mt-[0.18rem] mb-0 text-button compact:text-sm">{{ $t('common.free') }}</dd></div>
        </dl>
      </section>

      <section id="spatial-record" class="[ exhibition-experience ] archive-exhibition-experience relative grid min-h-140 grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.8fr)] overflow-hidden bg-archive-night text-archive-footer-copy tablet:grid-cols-1" aria-labelledby="spatial-record-title">
        <div class="[ exhibition-experience-image ] min-h-140 bg-cover bg-center brightness-50 saturate-72 compact:min-h-76" :style="{ backgroundImage: `url('${exhibition.image}')` }" aria-hidden="true" />
        <div class="[ exhibition-experience-copy ] archive-exhibition-experience-copy relative z-2 flex flex-col justify-center p-[clamp(3rem,6vw,6rem)] compact:bg-archive-night compact:px-4 compact:py-8">
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-ochre uppercase compact:mb-2 compact:text-xs">{{ $t('exhibition.spatialEyebrow') }}</p>
          <h2 id="spatial-record-title" class="m-0 mb-6 text-h2-lg font-light leading-[1.06] text-archive-night-heading compact:mb-4 compact:text-4xl">{{ $t('exhibition.spatialTitle') }} <span class="text-archive-red">{{ $t('exhibition.spatialAccent') }}</span></h2>
          <p class="max-w-136 text-button text-archive-footer-copy/86 compact:text-sm">{{ $t('exhibition.spatialIntro') }}</p>
          <ArchiveButton class="mt-[1.4rem] self-start compact:w-full" type="button" disabled>
            {{ $t('exhibition.startExperience') }} <ArchiveArrow />
          </ArchiveButton>
          <small class="mt-[0.65rem] text-xs tracking-[0.08em] text-archive-footer-copy/72 uppercase">{{ $t('exhibition.inPreparation') }}</small>
        </div>
      </section>

      <section v-if="relatedExhibitions.length" class="[ exhibition-related ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-8" aria-labelledby="related-title">
        <div class="[ section-heading ] relative z-1 mb-10 compact:mb-5">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('exhibition.relatedEyebrowAt', { name: gallery?.name ?? exhibition.venue }) }}</p>
          <h2 id="related-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] tracking-normal compact:text-3xl">{{ $t('exhibition.relatedTitle') }} <span class="text-archive-red">{{ $t('exhibition.relatedAccentAt', { name: gallery?.name ?? exhibition.venue }) }}</span></h2>
        </div>
        <div class="[ exhibition-related-grid ] grid grid-cols-3 gap-6 compact:grid-cols-1">
          <RelatedExhibitionCard
            v-for="item in relatedExhibitions"
            :key="item.id"
            :exhibition="item"
          />
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

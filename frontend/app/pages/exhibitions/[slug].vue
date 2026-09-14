<script setup lang="ts">
import {
  CalendarCheck, CalendarDays, Clock3, FileText, Globe, Hourglass, Info, MapPin, Palette, Ticket, Users
} from '@lucide/vue'
import { resolveTourAccess } from '~/utils/tourAccess'

const route = useRoute()
const { venues, venueExhibitions } = useArchiveData()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const routeSlug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
const exhibition = computed(() => {
  const record = venueExhibitions.value.find((item) => item.slug === routeSlug)
  if (!record) throw createError({ statusCode: 404, statusMessage: t('exhibition.notFound') })
  return record
})

const gallery = computed(() => venues.value.find((item) => item.slug === exhibition.value?.venue_slug))
const galleryName = computed(() => gallery.value?.name ?? exhibition.value.venue)
const relatedExhibitions = computed(() => venueExhibitions.value
  .filter((item) => item.slug !== exhibition.value?.slug)
  .sort((left, right) => Number(right.venue_slug === exhibition.value?.venue_slug) - Number(left.venue_slug === exhibition.value?.venue_slug))
  .slice(0, 3))
const recordNumber = computed(() => {
  const index = venueExhibitions.value.findIndex((item) => item.id === exhibition.value?.id)
  return String(Math.max(0, index) + 1).padStart(2, '0')
})
const galleryPath = computed(() => localePath(`/venues/${exhibition.value?.venue_slug}/`))
const artistsWithWebsite = computed(() => exhibition.value.artists.filter((artist) => artist.website_url))
const hostnameOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// The 360° record is the page's reason to exist, so its availability is
// decided once here and rendered identically at the top and at the end of
// the details. Only an open record gets a button; every other state is a
// sentence, never a disabled control.
const tourAccess = computed(() => resolveTourAccess(exhibition.value))
const releaseDateFormatter = computed(() => new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'long', year: 'numeric' }))
const tourStatus = computed(() => {
  const access = tourAccess.value
  switch (access.kind) {
    case 'open': return null
    case 'scheduled': return {
      icon: CalendarCheck,
      date: access.date,
      text: t('exhibition.availableFrom', { date: releaseDateFormatter.value.format(new Date(`${access.date}T12:00:00`)) })
    }
    case 'preparing': return { icon: Hourglass, text: t('exhibition.inPreparation') }
    case 'restricted': return { icon: Info, text: t('exhibition.restricted') }
    case 'unavailable': return { icon: Info, text: t('exhibition.unavailable') }
  }
})

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
      <section class="[ exhibition-hero ] archive-exhibition-experience relative grid min-h-[calc(100vh-6.4rem)] grid-cols-[minmax(0,1.05fr)_minmax(30rem,0.95fr)] overflow-hidden bg-archive-night text-archive-footer-copy tablet:grid-cols-1 tablet:min-h-auto" aria-labelledby="exhibition-title">
        <div class="[ exhibition-hero-image ] min-h-0 bg-cover bg-center brightness-50 saturate-72 tablet:min-h-100 compact:min-h-76" :style="{ backgroundImage: `url('${exhibition.image}')` }" aria-hidden="true" />
        <div class="[ exhibition-hero-copy ] archive-exhibition-experience-copy relative z-2 flex flex-col justify-center p-[clamp(3rem,6vw,6rem)] compact:bg-archive-night compact:px-4 compact:py-8">
          <ArchiveBreadcrumb class="text-archive-footer-copy/72">
            <ArchiveTextLink :to="localePath('/exhibitions/')" surface="night">{{ $t('navigation.exhibitions') }}</ArchiveTextLink><span aria-hidden="true">/</span><ArchiveTextLink :to="galleryPath" surface="night">{{ galleryName }}</ArchiveTextLink><span aria-hidden="true">/</span><span class="text-archive-night-heading">{{ exhibition.title }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-ochre uppercase compact:mb-2 compact:text-xs">{{ $t('exhibition.spatialEyebrow') }}</p>
          <h1 id="exhibition-title" class="m-0 font-display text-h1 font-light leading-[0.92] text-archive-night-heading compact:text-5xl compact:leading-none">{{ exhibition.title }}</h1>
          <p class="[ exhibition-hero-artist ] mt-[0.8rem] mb-0 text-title text-archive-ochre compact:mt-2 compact:text-lg">{{ exhibition.artist }}</p>
          <p v-if="exhibition.summary" class="[ exhibition-hero-summary ] mt-[1.4rem] mb-0 max-w-136 text-lg leading-[1.52] text-archive-footer-copy/86 compact:mt-3 compact:text-base compact:leading-normal">{{ exhibition.summary }}</p>

          <p v-if="tourStatus" class="[ exhibition-tour-status ] mt-8 mb-0 flex max-w-136 items-start gap-3 text-button text-archive-night-heading compact:mt-5 compact:text-sm">
            <component :is="tourStatus.icon" class="mt-[0.2em] shrink-0 text-archive-ochre" :size="20" aria-hidden="true" />
            <span>{{ tourStatus.text }}</span>
          </p>
          <div class="[ exhibition-hero-actions ] flex flex-wrap items-center gap-[1.2rem] compact:flex-col compact:items-stretch compact:gap-3" :class="tourStatus ? 'mt-5 compact:mt-4' : 'mt-8 compact:mt-5'">
            <ExhibitionExperience v-if="tourAccess.kind === 'open'" :tour-url="tourAccess.url" />
            <ArchiveButton variant="secondary" href="#exhibition-details">
              {{ $t('exhibition.seeDetails') }} <ArchiveArrow direction="down" />
            </ArchiveButton>
          </div>
        </div>
      </section>

      <section id="exhibition-details" class="[ exhibition-details ] [ section-band ] relative mx-auto grid max-w-[105rem] scroll-mt-[6.4rem] grid-cols-[minmax(30rem,1.2fr)_minmax(23rem,0.8fr)] gap-x-[clamp(3rem,7vw,7rem)] gap-y-12 px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] outline-none tablet:grid-cols-1 compact:gap-y-8 compact:px-4 compact:py-8" aria-labelledby="exhibition-details-title" tabindex="-1">
        <div class="[ exhibition-details-prose ]">
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('exhibition.recordNumber', { number: recordNumber }) }}</p>
          <h2 id="exhibition-details-title" class="m-0 text-h2-lg font-light leading-[0.98] compact:text-4xl">{{ $t('exhibition.aboutTitle') }} <span class="text-archive-red">{{ $t('exhibition.aboutAccent') }}</span></h2>
          <p v-if="exhibition.summary" class="[ exhibition-details-summary ] mt-6 mb-0 max-w-3xl text-lg leading-[1.65] text-archive-body compact:mt-4 compact:text-base compact:leading-normal">{{ exhibition.summary }}</p>
          <p v-if="exhibition.description" class="[ exhibition-details-description ] mt-5 mb-0 max-w-3xl text-lg leading-[1.65] text-archive-body compact:mt-3 compact:text-base compact:leading-normal">{{ exhibition.description }}</p>

          <section v-if="exhibition.statements.length" class="[ exhibition-statements ] mt-12 max-w-3xl compact:mt-8" :aria-label="$t('exhibition.statementsTitle', exhibition.artists.length)">
            <h3 class="m-0 mb-6 font-display text-h3-sm font-normal compact:mb-4 compact:text-2xl">{{ $t('exhibition.statementsTitle', exhibition.artists.length) }}</h3>
            <figure v-for="statement in exhibition.statements" :key="statement.id" class="[ exhibition-statement ] m-0 border-l border-archive-red/42 py-1 pl-6 not-last:mb-8 compact:pl-4 compact:not-last:mb-6">
              <p v-if="statement.prompt" class="[ exhibition-statement-prompt ] m-0 mb-2 text-sm tracking-[0.04em] text-archive-red">{{ statement.prompt }}</p>
              <blockquote class="m-0 font-display text-xl leading-normal text-archive-ink compact:text-lg">{{ statement.text }}</blockquote>
              <figcaption class="mt-3 text-sm text-archive-muted">— {{ statement.artist }}</figcaption>
            </figure>
          </section>
        </div>

        <dl class="[ exhibition-details-facts ] m-0 self-start border-t border-archive-rule-warm/24">
          <ArchiveMetadataRow :label="$t('exhibition.location')" variant="exhibition">
            <template #icon><MapPin :size="18" aria-hidden="true" /></template>
            <ArchiveTextLink v-if="exhibition.venue_website" :href="exhibition.venue_website" target="_blank" rel="noreferrer" icon-motion="external">{{ exhibition.venue }}</ArchiveTextLink><template v-else>{{ exhibition.venue }}</template>, {{ exhibition.city }}
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.date_range" :label="$t('exhibition.dates')" variant="exhibition">
            <template #icon><CalendarDays :size="18" aria-hidden="true" /></template>
            {{ exhibition.date_range }}
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.opening_hours" :label="$t('exhibition.openingHours')" variant="exhibition">
            <template #icon><Clock3 :size="18" aria-hidden="true" /></template>
            {{ exhibition.opening_hours }}
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.vernissage" :label="$t('exhibition.opening')" variant="exhibition">
            <template #icon><CalendarCheck :size="18" aria-hidden="true" /></template>
            {{ exhibition.vernissage }}
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.artist" :label="$t('exhibition.artistParticipants')" variant="exhibition">
            <template #icon><Users :size="18" aria-hidden="true" /></template>
            {{ exhibition.artist }}
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="artistsWithWebsite.length" :label="$t('exhibition.artistWebsite', artistsWithWebsite.length)" variant="exhibition">
            <template #icon><Globe :size="18" aria-hidden="true" /></template>
            <template v-for="(artist, index) in artistsWithWebsite" :key="artist.id">
              <template v-if="index">, </template><ArchiveTextLink :href="artist.website_url" target="_blank" rel="noreferrer" icon-motion="external">{{ exhibition.artists.length > 1 ? artist.name : hostnameOf(artist.website_url!) }}</ArchiveTextLink>
            </template>
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.medium" :label="$t('exhibition.form')" variant="exhibition">
            <template #icon><Palette :size="18" aria-hidden="true" /></template>
            {{ exhibition.medium }}
          </ArchiveMetadataRow>
          <ArchiveMetadataRow :label="$t('exhibition.admission')" variant="exhibition">
            <template #icon><Ticket :size="18" aria-hidden="true" /></template>
            {{ $t('common.free') }}
          </ArchiveMetadataRow>
        </dl>

        <div class="[ exhibition-details-actions ] col-span-full flex flex-wrap items-center justify-between gap-x-[1.6rem] gap-y-4 border-t border-archive-red/42 pt-8 tablet:col-span-1 compact:flex-col compact:items-stretch compact:gap-3 compact:pt-5">
          <ArchiveTextLink v-if="exhibition.source_pdf" class="compact:min-h-11" :href="exhibition.source_pdf" target="_blank" rel="noreferrer" icon-position="start" icon-motion="external">
            {{ $t('exhibition.invitationPdf') }}
            <template #icon><FileText :size="18" aria-hidden="true" /></template>
          </ArchiveTextLink>
          <ExhibitionExperience v-if="tourAccess.kind === 'open'" class="ml-auto compact:ml-0" :tour-url="tourAccess.url" />
          <p v-else-if="tourStatus" class="[ exhibition-tour-status ] m-0 ml-auto flex max-w-136 items-start gap-3 text-button text-archive-ink compact:ml-0 compact:text-sm">
            <component :is="tourStatus.icon" class="mt-[0.2em] shrink-0 text-archive-red" :size="20" aria-hidden="true" />
            <span>{{ tourStatus.text }}</span>
          </p>
        </div>
      </section>

      <section v-if="relatedExhibitions.length" class="[ exhibition-related ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-8" aria-labelledby="related-title">
        <div class="[ section-heading ] relative z-1 mb-10 compact:mb-5">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('exhibition.relatedEyebrow') }}</p>
          <h2 id="related-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] tracking-normal compact:text-3xl">{{ $t('exhibition.relatedTitle') }} <span class="text-archive-red">{{ $t('exhibition.relatedAccentAt', { name: galleryName }) }}</span></h2>
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

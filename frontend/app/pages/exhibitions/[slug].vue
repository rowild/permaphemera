<script setup lang="ts">
import { directusImageUrl } from '~/utils/archiveAsset'
import { formatArchiveDate } from '~/utils/archiveDate'
import {
  CalendarCheck, CalendarDays, CalendarRange, Clock3, ExternalLink, FileText, Hourglass, Info, Link2, MapPin, Palette, Ticket, Users, Landmark } from '@lucide/vue'
import { selectRelatedExhibitions } from '~/utils/relatedExhibitions'
import { resolveTourAccess } from '~/utils/tourAccess'

const { venues, venueExhibitions, eventOfExhibition } = useArchiveData()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { slug: routeSlug, record: exhibition } = useRecordBySlug(venueExhibitions, 'exhibition.notFound')
// The event this exhibition is part of (a festival, the Lange Nacht der Museen), with its year.
const partOf = computed(() => (exhibition.value ? eventOfExhibition.value.get(exhibition.value.id) : undefined))

const gallery = computed(() => venues.value.find((item) => item.slug === exhibition.value?.venue_slug))
const galleryName = computed(() => gallery.value?.name ?? exhibition.value.venue)
const archiveToday = useArchiveToday()
// Only past exhibitions with an open 360° tour, so every card leads to an experience.
const relatedExhibitions = computed(() => selectRelatedExhibitions(venueExhibitions.value, exhibition.value, archiveToday.value))
// One label for the organisations row: the shared role when all agree, else the generic word.
const organiserLabel = computed(() => {
  const roles = new Set(exhibition.value.organisers.map((organiser) => organiser.role))
  return roles.size === 1 ? t(`exhibition.organiserLabels.${[...roles][0]}`) : t('exhibition.organiserLabels.mixed')
})

// The 360° record is the page's reason to exist, so its availability is
// decided once here and rendered identically at the top and at the end of
// the details. Only an open record gets a button; every other state is a
// sentence, never a disabled control.
// Events (a sale, a festival night) are worded as events, exhibitions as exhibitions.
const kindText = (key: 'recordEyebrow' | 'aboutTitle' | 'aboutAccent' | 'restricted' | 'unavailable' | 'spatialEyebrowOpen' | 'spatialEyebrowPreparing' | 'spatialEyebrowNoTour') => t(exhibition.value?.kind === 'event' ? `exhibition.event.${key}` : `exhibition.${key}`)
const tourAccess = computed(() => resolveTourAccess(exhibition.value))
// The eyebrow above the title names the tour only where there is or will be one; "restricted"
// and "unavailable" records promise nothing.
const spatialEyebrow = computed(() => {
  switch (tourAccess.value.kind) {
    case 'open': return kindText('spatialEyebrowOpen')
    case 'scheduled':
    case 'preparing': return kindText('spatialEyebrowPreparing')
    default: return kindText('spatialEyebrowNoTour')
  }
})
const spatialEyebrowParts = computed(() => spatialEyebrow.value.split(' · '))
const tourStatus = computed(() => {
  const access = tourAccess.value
  switch (access.kind) {
    case 'open': return null
    case 'scheduled': return {
      icon: CalendarCheck,
      date: access.date,
      text: t('exhibition.availableFrom', { date: formatArchiveDate(access.date, locale.value) })
    }
    case 'preparing': return { icon: Hourglass, text: t('exhibition.inPreparation') }
    case 'restricted': return { icon: Info, text: kindText('restricted') }
    case 'unavailable': return { icon: Info, text: kindText('unavailable') }
    default: return null
  }
})

// The darkened hero background: one large WebP from Directus instead of the original.
const heroImage = computed(() => directusImageUrl(exhibition.value?.image, 1600))

usePageSeo(`/exhibitions/${routeSlug}/`)
// An unknown slug throws the 404 in setup; the template then renders nothing (v-if on its root),
// or it reads the missing record and the error page never appears (like the person and sponsor pages).
definePageMeta({ navActive: 'exhibitions' })
</script>

<template>
  <div v-if="exhibition" class="[ exhibition-detail-page ]">

      <section class="[ exhibition-hero ] archive-exhibition-experience relative grid min-h-[calc(100vh-6.4rem)] grid-cols-[minmax(0,1.05fr)_minmax(30rem,0.95fr)] overflow-hidden bg-archive-night text-archive-footer-copy tablet:grid-cols-1 tablet:min-h-auto" aria-labelledby="exhibition-title">
        <div class="[ exhibition-hero-image ] min-h-0 bg-cover bg-center brightness-50 saturate-72 tablet:min-h-100 compact:min-h-76" :style="{ backgroundImage: `url('${heroImage}')` }" aria-hidden="true" />
        <div class="[ exhibition-hero-copy ] archive-exhibition-experience-copy relative z-2 flex flex-col justify-center p-[clamp(3rem,6vw,6rem)] compact:bg-archive-night compact:px-4 compact:py-8">
          <ArchiveBreadcrumb class="text-archive-footer-copy/72" surface="night" :items="[{ label: $t('navigation.exhibitions'), to: '/exhibitions/' }, { label: galleryName, to: `/venues/${exhibition.venue_slug}/` }, { label: exhibition.title }]" />
          <ArchiveEyebrow tone="gold">
            <!-- A long eyebrow wraps only at its "·", never inside "360°-Rundgang in Vorbereitung". -->
            <span><template v-for="(part, index) in spatialEyebrowParts" :key="part"><template v-if="index">&nbsp;· </template><span :class="{ 'whitespace-nowrap': spatialEyebrowParts.length > 1 }">{{ part }}</span></template></span>
          </ArchiveEyebrow>
          <h1 id="exhibition-title" class="m-0 font-display text-h1 font-light leading-[0.92] text-archive-night-heading compact:text-5xl compact:leading-none">{{ exhibition.title }}</h1>
          <p class="[ exhibition-hero-artist ] mt-[0.8rem] mb-0 text-title text-archive-ochre compact:mt-2 compact:text-lg"><template v-for="(artist, index) in exhibition.artists" :key="artist.id"><template v-if="index"> &amp; </template><ArchiveTextLink :to="localePath(`/persons/${artist.slug}/`)" surface="night">{{ artist.name }}</ArchiveTextLink></template></p>
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

      <section id="exhibition-details" class="[ exhibition-details ] [ section-band ] relative mx-auto grid max-w-band scroll-mt-[6.4rem] grid-cols-[minmax(30rem,1.2fr)_minmax(23rem,0.8fr)] gap-x-[clamp(3rem,7vw,7rem)] gap-y-12 px-gutter py-[clamp(3rem,5vw,5rem)] outline-none tablet:grid-cols-1 compact:gap-y-8 compact:px-4 compact:py-5" aria-labelledby="exhibition-details-title" tabindex="-1">
        <div class="[ exhibition-details-prose ]">
          <ArchiveEyebrow>{{ kindText('recordEyebrow') }}</ArchiveEyebrow>
          <ArchiveSectionHeading id="exhibition-details-title" size="lg">{{ kindText('aboutTitle') }} <span class="text-archive-red">{{ kindText('aboutAccent') }}</span></ArchiveSectionHeading>
          <ArchiveRichText v-if="exhibition.descriptionHtml" class="[ exhibition-details-description ] mt-6 compact:mt-3" :html="exhibition.descriptionHtml" size="lead" />

          <section v-if="exhibition.statements.length" class="[ exhibition-statements ] mt-12 max-w-3xl compact:mt-8" :aria-label="$t('exhibition.statementsTitle', exhibition.artists.length)">
            <h3 class="m-0 mb-6 font-display text-h3-sm font-normal compact:mb-4 compact:text-2xl">{{ $t('exhibition.statementsTitle', exhibition.artists.length) }}</h3>
            <ArchiveStatement v-for="statement in exhibition.statements" :key="statement.id" class="[ exhibition-statement ]" :prompt="statement.prompt" :text="statement.text">— <ArchiveTextLink :to="localePath(`/persons/${statement.artist_slug}/`)">{{ statement.artist }}</ArchiveTextLink></ArchiveStatement>
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
          <ArchiveMetadataRow v-if="partOf" :label="$t('events.partOf')" variant="exhibition">
            <template #icon><CalendarRange :size="18" aria-hidden="true" /></template>
            <ArchiveLinkList :items="[{ label: `${partOf.title} ${partOf.year}`, to: `/events/${partOf.slug}/` }]" />
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.opening_hours" :label="$t('exhibition.openingHours')" variant="exhibition">
            <template #icon><Clock3 :size="18" aria-hidden="true" /></template>
            {{ exhibition.opening_hours }}
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.vernissage" :label="$t('exhibition.opening')" variant="exhibition">
            <template #icon><CalendarCheck :size="18" aria-hidden="true" /></template>
            {{ exhibition.vernissage }}
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.curators.length" :label="$t('exhibition.curators', exhibition.curators.length)" variant="exhibition">
            <template #icon><Users :size="18" aria-hidden="true" /></template>
            <ArchiveLinkList :items="exhibition.curators.map((curator) => ({ label: curator.name, to: `/persons/${curator.slug}/` }))" />
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.organiser_persons.length" :label="$t('exhibition.organiserPersons', exhibition.organiser_persons.length)" variant="exhibition">
            <template #icon><Users :size="18" aria-hidden="true" /></template>
            <ArchiveLinkList :items="exhibition.organiser_persons.map((organiser) => ({ label: organiser.name, to: `/persons/${organiser.slug}/` }))" />
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.organisers.length" :label="organiserLabel" variant="exhibition">
            <template #icon><Landmark :size="18" aria-hidden="true" /></template>
            <ArchiveLinkList :items="exhibition.organisers.map((organiser) => ({ label: organiser.title, to: `/organisations/${organiser.slug}/` }))" />
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.artist" :label="$t('exhibition.artistParticipants')" variant="exhibition">
            <template #icon><Users :size="18" aria-hidden="true" /></template>
            <template v-for="(artist, index) in exhibition.artists" :key="artist.id"><template v-if="index">, </template><ArchiveTextLink :to="localePath(`/persons/${artist.slug}/`)">{{ artist.name }}</ArchiveTextLink><ArchiveTextLink v-if="artist.website_url" class="ml-1 align-middle" :href="artist.website_url" target="_blank" rel="noreferrer" icon-motion="external"><span class="sr-only">{{ $t('exhibition.artistWebsiteOf', { name: artist.name }) }}</span><template #icon><ExternalLink :size="14" aria-hidden="true" /></template></ArchiveTextLink></template>
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.websites.length" :label="$t('exhibition.links', exhibition.websites.length)" variant="exhibition">
            <template #icon><Link2 :size="18" aria-hidden="true" /></template>
            <ArchiveLinkList :items="exhibition.websites.map((link) => ({ label: link.title, href: link.url }))" />
          </ArchiveMetadataRow>
          <ArchiveMetadataRow v-if="exhibition.medium" :label="$t('exhibition.form')" variant="exhibition">
            <template #icon><Palette :size="18" aria-hidden="true" /></template>
            {{ exhibition.medium }}
          </ArchiveMetadataRow>
          <ArchiveMetadataRow :label="$t('exhibition.admission')" variant="exhibition">
            <template #icon><Ticket :size="18" aria-hidden="true" /></template>
            {{ exhibition.admission ?? $t('exhibition.freeAdmission') }}
          </ArchiveMetadataRow>
        </dl>

        <div class="[ exhibition-details-actions ] col-span-full flex flex-wrap items-center justify-between gap-x-[1.6rem] gap-y-4 border-t border-archive-red/42 pt-8 tablet:col-span-1 compact:flex-col compact:items-stretch compact:gap-3 compact:pt-5">
          <ArchiveTextLink v-if="exhibition.source_pdf" class="compact:min-h-11" :href="exhibition.source_pdf" target="_blank" rel="noreferrer" icon-position="start" icon-motion="external">
            {{ $t('exhibition.invitationPdf') }}
            <template #icon><FileText :size="18" aria-hidden="true" /></template>
          </ArchiveTextLink>
          <ExhibitionExperience v-if="tourAccess.kind === 'open'" class="ml-auto compact:ml-0" :tour-url="tourAccess.url" />
        </div>
      </section>

      <ArchiveExhibitionsDivider v-if="relatedExhibitions.length" />

      <section v-if="relatedExhibitions.length" class="[ exhibition-related ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5" aria-labelledby="related-title">
        <div class="[ section-heading ] relative z-1 mb-10 compact:mb-5">
          <ArchiveEyebrow ornament="section">{{ $t('exhibition.relatedEyebrow') }}</ArchiveEyebrow>
          <ArchiveSectionHeading id="related-title" class="max-w-232">{{ $t('exhibition.relatedTitle') }} <span class="text-archive-red">{{ $t('exhibition.relatedAccent') }}</span></ArchiveSectionHeading>
        </div>
        <ExhibitionCardGrid class="[ exhibition-related-grid ]" :items="relatedExhibitions.map((exhibition) => ({ exhibition }))" />
      </section>
  </div>
</template>

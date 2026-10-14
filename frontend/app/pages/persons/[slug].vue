<script setup lang="ts">
import { Building2, CalendarDays, ExternalLink, Landmark, MapPin } from '@lucide/vue'
import { linkLabel } from '~/utils/externalLinks'

const route = useRoute()
const { persons } = useArchiveData()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const slug = String(route.params.slug ?? '')
const person = computed(() => persons.value.find((item) => item.slug === slug))
if (!person.value) {
  throw createError({ statusCode: 404, statusMessage: t('persons.notFound'), fatal: true })
}

const roleLine = computed(() => person.value!.roles.map((role) => role.title).join(' · '))
// The main link opens the Links row on its own line; these follow on the next line.
const furtherLinks = computed(() => person.value!.links.filter((link) => link.url !== person.value!.home?.url))
const roleLabel = (role: string) => t(`persons.roleLabels.${role}`, role)
// The roles inside a sentence: "as artist, curator" in English; German nouns keep their capital.
const roleSentence = computed(() => {
  const titles = person.value!.roles.map((role) => role.title)
  return (locale.value === 'de' ? titles : titles.map((title) => title.toLocaleLowerCase('en'))).join(', ')
})

useSeoMeta({
  title: () => [person.value?.name, roleLine.value, 'PERMAPHEMERA'].filter(Boolean).join(' · '),
  description: () => person.value?.lede ?? t('persons.seoDescription', { name: person.value?.name })
})
</script>

<template>
  <main v-if="person" class="[ site-shell ] [ person-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader :active="person.isArtist ? 'artists' : undefined" />

    <div id="main-content">
      <section class="[ person-hero ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(22rem,0.9fr)_minmax(24rem,1.1fr)] items-start gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-10" aria-labelledby="person-title">
        <div class="[ person-hero-copy ] relative z-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span>
            <template v-if="person.isArtist"><ArchiveTextLink :to="localePath('/artists/')">{{ $t('artists.breadcrumb') }}</ArchiveTextLink><span aria-hidden="true">/</span></template>
            <span>{{ person.name }}</span>
          </ArchiveBreadcrumb>
          <p v-if="roleLine" class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ roleLine }}</p>
          <h1 id="person-title" class="[ person-hero-title ] m-0 font-display text-hero font-light leading-[0.92] compact:text-5xl compact:leading-none">{{ person.name }}</h1>
          <p class="[ person-hero-lede ] my-0 mt-[1.6rem] mb-[1.85rem] max-w-136 text-lede leading-[1.42] text-archive-body compact:mt-4 compact:mb-4 compact:text-base compact:leading-normal">{{ person.lede ?? $t(person.roles.length ? 'persons.fallbackLede' : 'persons.fallbackLedeNoRole', { name: person.name, roles: roleSentence }) }}</p>

          <dl class="[ person-facts ] m-0">
            <ArchiveMetadataRow v-if="person.born" :label="$t('persons.born')" variant="venue">
              <template #icon><CalendarDays :size="18" aria-hidden="true" /></template>
              {{ person.born }}
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="person.basedIn" :label="$t('persons.basedIn')" variant="venue">
              <template #icon><MapPin :size="19" aria-hidden="true" /></template>
              {{ person.basedIn }}
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="person.memberships.length" :label="$t('persons.memberOf')" variant="venue">
              <template #icon><Landmark :size="18" aria-hidden="true" /></template>
              <template v-for="(membership, index) in person.memberships" :key="membership.slug">
                <template v-if="index"> · </template><template v-if="membership.function">{{ membership.function }}, </template><ArchiveTextLink :to="localePath(`/organisations/${membership.slug}/`)">{{ membership.title }}</ArchiveTextLink>
              </template>
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="person.venues.length" :label="$t('persons.galleries', person.venues.length)" variant="venue">
              <template #icon><Building2 :size="18" aria-hidden="true" /></template>
              <template v-for="(venue, index) in person.venues" :key="venue.slug">
                <template v-if="index">, </template><ArchiveTextLink :to="localePath(`/venues/${venue.slug}/`)">{{ venue.name }}</ArchiveTextLink>
              </template>
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="person.home" :label="$t('persons.links', person.links.length)" variant="venue">
              <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
              <span class="[ person-link-main ] block"><ArchiveTextLink :href="person.home.url" target="_blank" rel="noreferrer" icon-motion="external">{{ person.home.label }}</ArchiveTextLink></span>
              <span v-if="furtherLinks.length" class="[ person-links-further ] block">
                <template v-for="(link, index) in furtherLinks" :key="link.id">
                  <template v-if="index">, </template><ArchiveTextLink :href="link.url" target="_blank" rel="noreferrer" icon-motion="external">{{ linkLabel(link) }}</ArchiveTextLink>
                </template>
              </span>
            </ArchiveMetadataRow>
          </dl>

          <section class="[ person-about ] mt-[clamp(2.5rem,4vw,4rem)] compact:mt-8" aria-labelledby="person-about-title">
            <h2 id="person-about-title" class="m-0 mb-4 font-display text-h3 font-normal leading-[1.15] compact:text-lg">{{ $t('persons.aboutTitle', { name: person.name }) }}</h2>
            <template v-if="person.about">
              <p v-for="paragraph in person.about" :key="paragraph" class="max-w-176 text-button leading-[1.58] text-archive-body compact:text-base compact:leading-normal">{{ paragraph }}</p>
            </template>
            <p v-else class="m-0 max-w-176 text-button text-archive-muted compact:text-sm">{{ $t(person.records.length ? 'persons.noBio' : 'persons.noBioNoRecords', { name: person.name }) }}</p>
          </section>
        </div>

        <figure v-if="person.image" class="[ person-hero-figure ] archive-venue-hero-artwork relative m-0 pt-[1.1rem] pr-4 pb-10 pl-0 tablet:row-start-1 compact:mx-[-0.45rem] compact:pr-0">
          <ArchiveFramedImage
            class="[ person-hero-image ] rotate-[0.65deg] compact:rotate-0"
            :class="person.image.fromExhibition ? 'aspect-[1.28]' : 'aspect-[0.8] tablet:w-full tablet:max-w-md'"
            :src="person.image.src"
            :alt="person.image.alt"
          />
          <figcaption v-if="person.image.caption || person.image.fromExhibition" class="[ person-hero-caption ] mt-[0.9rem] mr-0 mb-0 ml-[1.4rem] flex items-center gap-[0.65rem] text-sm text-archive-muted italic">
            <span class="not-italic tracking-[0.08em] text-archive-red uppercase">{{ $t('venue.figure') }}</span>
            {{ person.image.caption ?? (person.image.fromExhibition ? $t('persons.fromExhibition', { title: person.image.fromExhibition }) : '') }}
          </figcaption>
        </figure>
      </section>

      <ArchiveExhibitionsDivider />

      <section v-if="person.records.length" class="[ person-records ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-8" aria-labelledby="person-records-title">
        <div class="[ section-heading ] mb-10 compact:mb-5">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('persons.recordsEyebrow') }}</p>
          <h2 id="person-records-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('persons.recordsTitle', { name: person.name }) }}</h2>
        </div>
        <div class="[ person-records-grid ] grid grid-cols-3 gap-6 tablet:grid-cols-2 compact:grid-cols-1">
          <div v-for="record in person.records" :key="`${record.exhibition.id}-${record.role}`" class="[ person-record ] grid gap-2">
            <p class="m-0 text-xs tracking-widest text-archive-muted uppercase compact:text-3xs">{{ roleLabel(record.role) }}</p>
            <ExhibitionCard :exhibition="record.exhibition" />
          </div>
        </div>
      </section>
      <section v-else class="[ person-records-empty ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(2rem,4vw,4rem)] compact:px-4 compact:py-6">
        <p class="m-0 max-w-176 text-button text-archive-muted compact:text-sm">{{ $t('persons.noRecords', { name: person.name }) }}</p>
      </section>

      <section v-if="person.statements.length" class="[ person-statements ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pb-[clamp(3rem,5vw,5rem)] compact:px-4 compact:pb-8" aria-labelledby="person-statements-title">
        <h2 id="person-statements-title" class="m-0 mb-6 font-display text-h3-sm font-normal compact:mb-4 compact:text-2xl">{{ $t('persons.statementsTitle', { name: person.name }) }}</h2>
        <figure v-for="statement in person.statements" :key="statement.id" class="[ person-statement ] m-0 mb-8 max-w-3xl border-l border-archive-red/42 py-1 pl-6">
          <p v-if="statement.prompt" class="m-0 mb-2 text-sm tracking-[0.04em] text-archive-red">{{ statement.prompt }}</p>
          <blockquote class="m-0 font-display text-xl leading-normal text-archive-ink compact:text-lg">{{ statement.text }}</blockquote>
          <figcaption class="mt-3 text-sm text-archive-muted">{{ $t('persons.statementOn') }} <ArchiveTextLink :to="localePath(`/exhibitions/${statement.exhibitionSlug}/`)">{{ statement.exhibitionTitle }}</ArchiveTextLink></figcaption>
        </figure>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>

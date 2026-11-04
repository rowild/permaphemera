<script setup lang="ts">
import { Building2, CalendarDays, ExternalLink, Landmark, MapPin } from '@lucide/vue'
import { linkLabel } from '~/utils/externalLinks'

const { persons } = useArchiveData()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const { slug, record: person } = useRecordBySlug(persons, 'persons.notFound')
// An artist's page belongs to "Künstler:innen" in the menu; other persons to no item.
if (person.value.isArtist) useNavActive('artists')

const roleLine = computed(() => person.value!.roles.map((role) => role.title).join(' · '))
// The main link opens the Links row on its own line; these follow on the next line.
const furtherLinks = computed(() => person.value!.links.filter((link) => link.url !== person.value!.home?.url))
const roleLabel = (role: string) => t(`persons.roleLabels.${role}`, role)
// The roles inside a sentence: "as artist, curator" in English; German nouns keep their capital.
const roleSentence = computed(() => {
  const titles = person.value!.roles.map((role) => role.title)
  return (locale.value === 'de' ? titles : titles.map((title) => title.toLocaleLowerCase('en'))).join(', ')
})

usePageSeo(`/persons/${slug}/`)
</script>

<template>
  <div v-if="person" class="[ person-page ]">

      <section class="[ person-hero ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(22rem,0.9fr)_minmax(24rem,1.1fr)] items-start gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-6" aria-labelledby="person-title">
        <div class="[ person-hero-copy ] relative z-2">
          <ArchiveBreadcrumb :items="person.isArtist ? [{ label: $t('artists.breadcrumb'), to: '/artists/' }, { label: person.name }] : [{ label: person.name }]" />
          <ArchiveEyebrow v-if="roleLine">{{ roleLine }}</ArchiveEyebrow>
          <ArchiveRecordTitle title-id="person-title" :title="person.name" :lede="person.lede ?? $t(person.roles.length ? 'persons.fallbackLede' : 'persons.fallbackLedeNoRole', { name: person.name, roles: roleSentence })" />

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
            <ArchiveRichText v-if="person.aboutHtml" :html="person.aboutHtml" />
            <p v-else class="m-0 max-w-176 text-button text-archive-muted compact:text-sm">{{ $t(person.records.length ? 'persons.noBio' : 'persons.noBioNoRecords', { name: person.name }) }}</p>
          </section>
        </div>

        <ArchiveRecordFigure v-if="person.image" class="[ person-hero-figure ] pb-10 tablet:row-start-1" :image-class="['[ person-hero-image ]', person.image.fromExhibition ? 'aspect-[1.28]' : 'aspect-[0.8] tablet:w-full tablet:max-w-md']" :src="person.image.src" :alt="person.image.alt" :caption="person.image.caption ?? (person.image.fromExhibition ? $t('persons.fromExhibition', { title: person.image.fromExhibition }) : undefined)" />
      </section>

      <ArchiveExhibitionsDivider />

      <section v-if="person.records.length" class="[ person-records ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5" aria-labelledby="person-records-title">
        <div class="[ section-heading ] mb-10 compact:mb-5">
          <ArchiveEyebrow ornament="section">{{ $t('persons.recordsEyebrow') }}</ArchiveEyebrow>
          <h2 id="person-records-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('persons.recordsTitle', { name: person.name }) }}</h2>
        </div>
        <div class="[ person-records-grid ] grid grid-cols-3 gap-6 tablet:grid-cols-2 compact:grid-cols-1">
          <div v-for="record in person.records" :key="`${record.exhibition.id}-${record.role}`" class="[ person-record ] grid gap-2">
            <p class="m-0 text-xs tracking-widest text-archive-muted uppercase compact:text-3xs">{{ roleLabel(record.role) }}</p>
            <ExhibitionCard :exhibition="record.exhibition" />
          </div>
        </div>
      </section>
      <section v-else class="[ person-records-empty ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(2rem,4vw,4rem)] compact:px-4 compact:py-4">
        <p class="m-0 max-w-176 text-button text-archive-muted compact:text-sm">{{ $t('persons.noRecords', { name: person.name }) }}</p>
      </section>

      <section v-if="person.statements.length" class="[ person-statements ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pb-[clamp(3rem,5vw,5rem)] compact:px-4 compact:pb-5" aria-labelledby="person-statements-title">
        <h2 id="person-statements-title" class="m-0 mb-6 font-display text-h3-sm font-normal compact:mb-4 compact:text-2xl">{{ $t('persons.statementsTitle', { name: person.name }) }}</h2>
        <ArchiveStatement v-for="statement in person.statements" :key="statement.id" class="[ person-statement ] max-w-3xl" :prompt="statement.prompt" :text="statement.text">{{ $t('persons.statementOn') }} <ArchiveTextLink :to="localePath(`/exhibitions/${statement.exhibitionSlug}/`)">{{ statement.exhibitionTitle }}</ArchiveTextLink></ArchiveStatement>
      </section>
  </div>
</template>

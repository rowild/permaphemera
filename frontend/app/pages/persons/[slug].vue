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

      <ArchiveRecordHero class="[ person-hero ]" title-id="person-title">
        <template #breadcrumb>
          <ArchiveBreadcrumb :items="person.isArtist ? [{ label: $t('artists.breadcrumb'), to: '/artists/' }, { label: person.name }] : [{ label: person.name }]" />
        </template>
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
              <ArchiveLinkList :items="person.venues.map((venue) => ({ label: venue.name, to: `/venues/${venue.slug}/` }))" />
            </ArchiveMetadataRow>
            <ArchiveMetadataRow v-if="person.home" :label="$t('persons.links', person.links.length)" variant="venue">
              <template #icon><ExternalLink :size="18" aria-hidden="true" /></template>
              <span class="[ person-link-main ] block"><ArchiveTextLink :href="person.home.url" target="_blank" rel="noreferrer" icon-motion="external">{{ person.home.label }}</ArchiveTextLink></span>
              <span v-if="furtherLinks.length" class="[ person-links-further ] block">
                <ArchiveLinkList :items="furtherLinks.map((link) => ({ label: linkLabel(link), href: link.url }))" />
              </span>
            </ArchiveMetadataRow>
          </dl>

          <section class="[ person-about ] mt-[clamp(2.5rem,4vw,4rem)] compact:mt-8" aria-labelledby="person-about-title">
            <h2 id="person-about-title" class="m-0 mb-4 font-display text-h3 font-normal leading-[1.15] compact:text-lg">{{ $t('persons.aboutTitle', { name: person.name }) }}</h2>
            <ArchiveRichText v-if="person.aboutHtml" :html="person.aboutHtml" />
            <p v-else class="m-0 max-w-176 text-button text-archive-muted compact:text-sm">{{ $t(person.records.length ? 'persons.noBio' : 'persons.noBioNoRecords', { name: person.name }) }}</p>
          </section>

        <template #aside>
        <ArchiveRecordFigure v-if="person.image" class="[ person-hero-figure ] pb-10 tablet:row-start-1" :image-class="['[ person-hero-image ]', person.image.fromExhibition ? 'aspect-[1.28]' : 'aspect-[0.8] tablet:w-full tablet:max-w-md']" :src="person.image.src" :alt="person.image.alt" :caption="person.image.caption ?? (person.image.fromExhibition ? $t('persons.fromExhibition', { title: person.image.fromExhibition }) : undefined)" />
        </template>
      </ArchiveRecordHero>

      <ArchiveExhibitionsDivider />

      <ArchiveRecordExhibitions
        class="[ person-records ]"
        title-id="person-records-title"
        :eyebrow="$t('persons.recordsEyebrow')"
        :items="person.records.map((record) => ({ exhibition: record.exhibition, label: roleLabel(record.role), key: `${record.exhibition.id}-${record.role}` }))"
        :empty="$t('persons.noRecords', { name: person.name })"
      >
        {{ $t('persons.recordsTitle', { name: person.name }) }}
      </ArchiveRecordExhibitions>

      <section v-if="person.statements.length" class="[ person-statements ] [ section-band ] relative mx-auto max-w-band px-gutter pb-[clamp(3rem,5vw,5rem)] compact:px-4 compact:pb-5" aria-labelledby="person-statements-title">
        <h2 id="person-statements-title" class="m-0 mb-6 font-display text-h3-sm font-normal compact:mb-4 compact:text-2xl">{{ $t('persons.statementsTitle', { name: person.name }) }}</h2>
        <ArchiveStatement v-for="statement in person.statements" :key="statement.id" class="[ person-statement ] max-w-3xl" :prompt="statement.prompt" :text="statement.text">{{ $t('persons.statementOn') }} <ArchiveTextLink :to="localePath(`/exhibitions/${statement.exhibitionSlug}/`)">{{ statement.exhibitionTitle }}</ArchiveTextLink></ArchiveStatement>
      </section>
  </div>
</template>

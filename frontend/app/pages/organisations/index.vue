<script setup lang="ts">
import { CURATOR_ROLES, ORGANISER_ROLES, isRegisterOrganisation, personsInRoles } from '~/utils/organisationsRegister'
import type { ResolvedOrganisation } from '~/utils/resolveOrganisations'
import type { ResolvedPerson } from '~/utils/resolvePersons'
import type { ResolvedSponsor } from '~/utils/resolveSponsors'

const { organisations, persons, sponsorPages } = useArchiveData()
const { t } = useI18n()

// Who organises: the organisations that run a gallery, stand behind an exhibition or are a
// group; the people who organise (board members included) and who curate; the sponsors.
const registerOrganisations = computed(() => organisations.value.filter(isRegisterOrganisation))
const organisers = computed(() => personsInRoles(persons.value, ORGANISER_ROLES))
const curators = computed(() => personsInRoles(persons.value, CURATOR_ROLES))
const peopleCount = computed(() => new Set([...organisers.value, ...curators.value].map((person) => person.id)).size)

const searchQuery = useQueryParam('q')
const matches = (values: (string | undefined)[]) => matchesSearch(searchQuery.value, values)
const organisationText = (organisation: ResolvedOrganisation) => [
  organisation.title,
  organisation.short_title,
  t(`organisations.kinds.${organisation.kind}`, organisation.kind),
  organisation.city,
  organisation.address,
  organisation.lede,
  organisation.description,
  ...organisation.members.map((member) => member.name),
  ...organisation.records.map((record) => record.title)
]
const personText = (person: ResolvedPerson) => [
  person.name,
  person.basedIn,
  person.lede,
  ...person.roles.map((role) => role.title),
  ...person.memberships.map((membership) => membership.title),
  ...person.records.map((record) => record.exhibition.title)
]
const sponsorText = (sponsor: ResolvedSponsor) => [
  sponsor.title,
  sponsor.description,
  ...sponsor.exhibitions.map((exhibition) => exhibition.title),
  ...sponsor.venues.map((venue) => venue.name),
  ...sponsor.persons.map((person) => person.name),
  ...sponsor.towns
]

const filteredOrganisations = computed(() => registerOrganisations.value.filter((organisation) => matches(organisationText(organisation))))
const filteredOrganisers = computed(() => organisers.value.filter((person) => matches(personText(person))))
const filteredCurators = computed(() => curators.value.filter((person) => matches(personText(person))))
const filteredSponsors = computed(() => sponsorPages.value.filter((sponsor) => matches(sponsorText(sponsor))))
const totalEntries = computed(() => registerOrganisations.value.length + organisers.value.length + curators.value.length + sponsorPages.value.length)
const visibleEntries = computed(() => filteredOrganisations.value.length + filteredOrganisers.value.length + filteredCurators.value.length + filteredSponsors.value.length)

const recordCount = computed(() => new Set(registerOrganisations.value.flatMap((organisation) => organisation.records.map((record) => record.id))).size)
const ledgerItems = computed(() => [
  { label: t('organisations.ledgerOrganisations'), value: registerOrganisations.value.length },
  { label: t('organisations.ledgerPeople'), value: peopleCount.value },
  { label: t('organisations.ledgerRecords'), value: recordCount.value }
])
// Mobile: the ledger's three facts as one line in the eyebrow's place.
const organisationFacts = computed(() => [
  t('organisations.factOrganisations', registerOrganisations.value.length),
  t('organisations.factPeople', peopleCount.value),
  t('organisations.factRecords', recordCount.value)
])

usePageSeo('/organisations/')
definePageMeta({ navActive: 'organisations' })
</script>

<template>
  <div class="[ organisations-page ]">

      <ArchiveDirectoryHero
        class="[ organisations-page-intro ]"
        title-id="organisations-page-title"
        :breadcrumb="$t('organisations.breadcrumb')"
        :eyebrow="$t('organisations.eyebrow')"
        :facts="organisationFacts"
        :title="$t('organisations.title')"
        :accent="$t('organisations.accent')"
        :intro="$t('organisations.intro')"
        :ledger="ledgerItems"
      />

      <section id="organisation-directory" class="[ organisation-directory ] [ section-band ] relative pb-[clamp(3rem,5vw,5rem)] compact:pb-6" :aria-label="$t('organisations.directory')">
        <div class="[ organisation-directory-controls ] mx-auto max-w-band px-gutter compact:px-4">
          <ArchiveSearchForm
            id="organisation-directory-search"
            v-model="searchQuery"
            class="[ organisation-directory-search ]"
            :label="$t('organisations.searchLabel')"
            :placeholder="$t('organisations.searchPlaceholder')"
          />
        </div>

        <ArchiveInsetDivider class="mt-7 compact:mt-4" />

        <div class="[ organisation-directory-results ] mx-auto max-w-band px-gutter compact:px-4">
          <ArchiveDirectoryStatus class="[ organisation-directory-status ] my-7 compact:my-4" :show="Boolean(searchQuery)" :text="$t('organisations.status', { visible: visibleEntries, total: totalEntries })" :clear-label="$t('organisations.clearSearch')" @clear="searchQuery = ''" />

          <ArchiveEmptyState v-if="!visibleEntries" class="[ organisation-directory-empty ]" :message="$t('organisations.noMatches')" :action-label="$t('organisations.returnAll')" @action="searchQuery = ''" />

          <div v-else class="[ organisation-directory-blocks ] grid gap-[clamp(3rem,5vw,5rem)]">
            <section v-if="filteredOrganisations.length" class="[ organisation-list ]" aria-labelledby="organisation-list-title">
              <div class="[ section-heading ] relative z-1 mb-4">
                <ArchiveSectionHeading id="organisation-list-title" class="max-w-232">{{ $t('organisations.listTitle') }} <span class="text-archive-red">{{ filteredOrganisations.length }}</span></ArchiveSectionHeading>
                <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('organisations.listIntro') }}</p>
              </div>
              <div class="[ organisation-directory-list ] max-w-232 border-t border-archive-rule-warm/22">
                <OrganisationDirectoryEntry
                  v-for="organisation in filteredOrganisations"
                  :key="organisation.id"
                  :organisation="organisation"
                />
              </div>
            </section>

            <section v-if="filteredOrganisers.length || filteredCurators.length" class="[ people-list ]" aria-labelledby="people-list-title">
              <div class="[ section-heading ] relative z-1 mb-4">
                <ArchiveSectionHeading id="people-list-title" class="max-w-232">{{ $t('organisations.peopleTitle') }} <span class="text-archive-red">{{ filteredOrganisers.length + filteredCurators.length }}</span></ArchiveSectionHeading>
                <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('organisations.peopleIntro') }}</p>
              </div>
              <div class="[ people-list-groups ] grid grid-cols-2 items-start gap-[clamp(2rem,5vw,5rem)] tablet:grid-cols-1">
                <div v-if="filteredOrganisers.length" class="[ people-list-group ]">
                  <ArchiveGroupLabel>{{ $t('organisations.organisersTitle') }} · {{ filteredOrganisers.length }}</ArchiveGroupLabel>
                  <div class="border-t border-archive-rule-warm/22">
                    <PersonDirectoryEntry v-for="person in filteredOrganisers" :key="person.id" :person="person" :roles="ORGANISER_ROLES" />
                  </div>
                </div>
                <div v-if="filteredCurators.length" class="[ people-list-group ]">
                  <ArchiveGroupLabel>{{ $t('organisations.curatorsTitle') }} · {{ filteredCurators.length }}</ArchiveGroupLabel>
                  <div class="border-t border-archive-rule-warm/22">
                    <PersonDirectoryEntry v-for="person in filteredCurators" :key="person.id" :person="person" :roles="CURATOR_ROLES" />
                  </div>
                </div>
              </div>
            </section>

            <section v-if="filteredSponsors.length" class="[ sponsor-list ]" aria-labelledby="sponsor-list-title">
              <div class="[ section-heading ] relative z-1 mb-4">
                <ArchiveSectionHeading id="sponsor-list-title" class="max-w-232">{{ $t('organisations.sponsorsTitle') }} <span class="text-archive-red">{{ filteredSponsors.length }}</span></ArchiveSectionHeading>
                <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('organisations.sponsorsIntro') }}</p>
              </div>
              <div class="[ sponsor-directory-list ] max-w-232 border-t border-archive-rule-warm/22">
                <SponsorDirectoryEntry v-for="sponsor in filteredSponsors" :key="sponsor.id" :sponsor="sponsor" />
              </div>
            </section>
          </div>
        </div>
      </section>
  </div>
</template>
